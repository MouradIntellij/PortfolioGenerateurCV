import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { z, ZodError } from "zod";
import { pool, redis } from "./infra.js";
import {
  requireAuth,
  limit,
  issueSession,
  cookieName,
  hashToken,
} from "./auth.js";
import { transaction, getPortfolio, bump } from "./repository.js";
import { generateCV, filename } from "./pdf.js";
import {
  registerSchema,
  credentials,
  profileSchema,
  itemSchema,
  sections,
  slugSchema,
  password,
  cvSchema,
  type Portfolio,
} from "../../shared/schema.js";
export const app = express();
// Docker : accès direct. Vercel est un reverse proxy de confiance.
if (process.env.VERCEL) app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "128kb" }), cookieParser());
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  const origin = process.env.APP_ORIGIN;
  if (!origin) {
    res.status(503).json({ error: "APP_ORIGIN doit être configurée." });
    return;
  }
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.headers.origin !== origin
  ) {
    res.status(403).json({ error: "Origine de la requête refusée." });
    return;
  }
  if (req.headers.origin === origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS",
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
    return;
  }
  next();
});
app.get("/api/health", async (_req, res) => {
  await pool.query("SELECT 1");
  await redis.ping();
  res.json({ status: "ok", postgres: "ok", redis: "ok" });
});
app.post("/api/auth/register", limit("register", 8, 3600), async (req, res) => {
  const input = registerSchema.parse(req.body);
  const hash = await bcrypt.hash(input.password, 12);
  const user = await transaction(async (c) => {
    const u = await c.query(
      "INSERT INTO users(email,password_hash,slug) VALUES($1,$2,$3) RETURNING id,session_version",
      [input.email, hash, input.slug],
    );
    await c.query(
      "INSERT INTO profiles(user_id,full_name,email) VALUES($1,$2,$3)",
      [u.rows[0].id, input.full_name, input.email],
    );
    return u.rows[0];
  });
  await issueSession(res, user.id, user.session_version);
  res.status(201).json({ id: user.id });
});
const dummyHash = bcrypt.hashSync("dummy-password-never-used", 12);
app.post("/api/auth/login", limit("login", 15, 900), async (req, res) => {
  const input = credentials.parse(req.body);
  const u = await pool.query(
    "SELECT id,password_hash,session_version FROM users WHERE email=$1",
    [input.email],
  );
  const valid = await bcrypt.compare(
    input.password,
    u.rows[0]?.password_hash || dummyHash,
  );
  if (!u.rowCount || !valid) {
    res.status(401).json({ error: "Courriel ou mot de passe incorrect." });
    return;
  }
  await issueSession(res, u.rows[0].id, u.rows[0].session_version);
  res.json({ ok: true });
});
app.post("/api/auth/logout", async (req, res) => {
  const token = req.cookies?.[cookieName];
  if (typeof token === "string") await redis.del(`session:${hashToken(token)}`);
  res.clearCookie(cookieName, { path: "/" });
  res.json({ ok: true });
});
app.get("/api/public/:slug", async (req, res) => {
  const u = await pool.query(
    "SELECT id,version FROM users WHERE slug=$1 AND is_public=true",
    [req.params.slug],
  );
  if (!u.rowCount) {
    res.status(404).json({ error: "Portfolio privé ou introuvable." });
    return;
  }
  const key = `public:${u.rows[0].id}:${u.rows[0].version}`;
  let raw: string | null = null;
  try {
    raw = await redis.get(key);
  } catch {
    /* Cache facultatif pour consultation. */
  }
  if (raw) {
    res.json(JSON.parse(raw));
    return;
  }
  const data = await getPortfolio(u.rows[0].id);
  if (!data.user.is_public) {
    res.status(404).json({ error: "Portfolio privé." });
    return;
  }
  try {
    await redis.set(key, JSON.stringify(data), "EX", 300);
  } catch {
    /* PostgreSQL reste la source. */
  }
  res.json(data);
});
app.get(
  "/api/public/:slug/cv",
  limit("public-cv", 30, 300),
  async (req, res) => {
    const u = await pool.query(
      "SELECT id FROM users WHERE slug=$1 AND is_public=true AND allow_cv=true",
      [req.params.slug],
    );
    if (!u.rowCount) {
      res.status(404).json({ error: "CV non disponible." });
      return;
    }
    const data = await getPortfolio(u.rows[0].id);
    if (!data.user.is_public || !data.user.allow_cv) {
      res.sendStatus(404);
      return;
    }
    const opts = cvSchema.parse({ template: "modern" });
    const pdf = await cachedCV(data, opts);
    res.type("pdf").attachment(filename(data.profile.full_name)).send(pdf);
  },
);
app.use("/api", requireAuth);
app.get("/api/me", async (_req, res) => {
  res.json(await getPortfolio(res.locals.userId));
});
app.get("/api/profile", async (_req, res) => {
  res.json((await getPortfolio(res.locals.userId)).profile);
});
app.put("/api/profile", async (req, res) => {
  const input = profileSchema.parse(req.body);
  const entries = Object.entries(input);
  await transaction(async (c) => {
    await c.query(
      `UPDATE profiles SET ${entries.map(([k], i) => `${k}=$${i + 1}`).join(",")} WHERE user_id=$${entries.length + 1}`,
      [...entries.map(([, v]) => v), res.locals.userId],
    );
    await bump(c, res.locals.userId);
  });
  res.json({ ok: true });
});
app.put("/api/settings", async (req, res) => {
  const input = z
    .object({ slug: slugSchema, is_public: z.boolean(), allow_cv: z.boolean() })
    .parse(req.body);
  await pool.query(
    "UPDATE users SET slug=$1,is_public=$2,allow_cv=$3,version=version+1 WHERE id=$4",
    [input.slug, input.is_public, input.allow_cv, res.locals.userId],
  );
  res.json({ ok: true });
});
app.put("/api/auth/password", limit("password", 10, 900), async (req, res) => {
  const input = z
    .object({ current_password: password, new_password: password })
    .parse(req.body);
  const hash = await bcrypt.hash(input.new_password, 12);
  const updated = await transaction(async (c) => {
    const u = await c.query(
      "SELECT password_hash FROM users WHERE id=$1 FOR UPDATE",
      [res.locals.userId],
    );
    if (
      !(await bcrypt.compare(input.current_password, u.rows[0].password_hash))
    )
      return false;
    await c.query(
      "UPDATE users SET password_hash=$1,session_version=session_version+1 WHERE id=$2",
      [hash, res.locals.userId],
    );
    return true;
  });
  if (!updated) {
    res.status(400).json({ error: "Mot de passe actuel incorrect." });
    return;
  }
  res.clearCookie(cookieName, { path: "/" });
  res.json({ ok: true });
});
app.delete("/api/account", limit("delete", 10, 900), async (req, res) => {
  const input = z.object({ password }).parse(req.body);
  const deleted = await transaction(async (c) => {
    const u = await c.query(
      "SELECT password_hash FROM users WHERE id=$1 FOR UPDATE",
      [res.locals.userId],
    );
    if (!(await bcrypt.compare(input.password, u.rows[0].password_hash)))
      return false;
    await c.query("DELETE FROM users WHERE id=$1", [res.locals.userId]);
    return true;
  });
  if (!deleted) {
    res.status(400).json({ error: "Mot de passe incorrect." });
    return;
  }
  res.clearCookie(cookieName, { path: "/" });
  res.json({ ok: true });
});
for (const section of sections) {
  app.get(`/api/${section}`, async (_req, res) =>
    res.json((await getPortfolio(res.locals.userId))[section]),
  );
  app.put(`/api/${section}/order`, async (req, res) => {
    const ids = z
      .array(z.number().int().positive())
      .max(100)
      .parse(req.body.ids);
    await transaction(async (c) => {
      await c.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [
        res.locals.userId,
      ]);
      const rows = await c.query(`SELECT id FROM ${section} WHERE user_id=$1`, [
        res.locals.userId,
      ]);
      if (
        new Set(ids).size !== ids.length ||
        rows.rowCount !== ids.length ||
        rows.rows.some((r) => !ids.includes(r.id))
      )
        throw Object.assign(new Error("Ordre invalide."), { status: 400 });
      for (let i = 0; i < ids.length; i++)
        await c.query(
          `UPDATE ${section} SET sort_order=$1 WHERE id=$2 AND user_id=$3`,
          [i, ids[i], res.locals.userId],
        );
      await bump(c, res.locals.userId);
    });
    res.json({ ok: true });
  });
  app.post(`/api/${section}`, async (req, res) => {
    const input = itemSchema.parse(req.body);
    const entries = Object.entries(input);
    const result = await transaction(async (c) => {
      await c.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [
        res.locals.userId,
      ]);
      const n = await c.query(
        `SELECT COUNT(*)::int AS n,COALESCE(MAX(sort_order),-1)+1 AS next FROM ${section} WHERE user_id=$1`,
        [res.locals.userId],
      );
      if (n.rows[0].n >= 50)
        throw Object.assign(new Error("Maximum 50 éléments par section."), {
          status: 422,
        });
      const r = await c.query(
        `INSERT INTO ${section} (${entries.map(([k]) => k).join(",")},user_id,sort_order) VALUES (${entries.map((_, i) => `$${i + 1}`).join(",")},$${entries.length + 1},$${entries.length + 2}) RETURNING id`,
        [...entries.map(([, v]) => v), res.locals.userId, n.rows[0].next],
      );
      await bump(c, res.locals.userId);
      return r.rows[0];
    });
    res.status(201).json(result);
  });
  app.put(`/api/${section}/:id`, async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const entries = Object.entries(itemSchema.parse(req.body));
    const count = await transaction(async (c) => {
      const r = await c.query(
        `UPDATE ${section} SET ${entries.map(([k], i) => `${k}=$${i + 1}`).join(",")} WHERE id=$${entries.length + 1} AND user_id=$${entries.length + 2}`,
        [...entries.map(([, v]) => v), id, res.locals.userId],
      );
      if (r.rowCount) await bump(c, res.locals.userId);
      return r.rowCount;
    });
    if (!count) {
      res.status(404).json({ error: "Élément introuvable." });
      return;
    }
    res.json({ ok: true });
  });
  app.delete(`/api/${section}/:id`, async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const count = await transaction(async (c) => {
      const r = await c.query(
        `DELETE FROM ${section} WHERE id=$1 AND user_id=$2`,
        [id, res.locals.userId],
      );
      if (r.rowCount) await bump(c, res.locals.userId);
      return r.rowCount;
    });
    if (!count) {
      res.status(404).json({ error: "Élément introuvable." });
      return;
    }
    res.json({ ok: true });
  });
}
async function cachedCV(
  data: Portfolio,
  opts: ReturnType<typeof cvSchema.parse>,
) {
  const digest = createHash("sha256")
    .update(JSON.stringify(opts))
    .digest("hex");
  const key = `cv:${data.user.id}:${data.user.version}:${digest}`;
  const cached = await redis.getBuffer(key);
  if (cached) return cached;
  const pdf = await generateCV(data, opts);
  await redis.set(key, pdf, "EX", 3600);
  return pdf;
}
for (const route of ["preview", "download"])
  app.get(`/api/cv/${route}`, limit("cv", 40, 300), async (req, res) => {
    let input: unknown = {};
    if (req.query.options) {
      try {
        input = JSON.parse(String(req.query.options));
      } catch {
        res.status(400).json({ error: "Options CV invalides." });
        return;
      }
    }
    const opts = cvSchema.parse(input);
    const data = await getPortfolio(res.locals.userId);
    const pdf = await cachedCV(data, opts);
    res.type("pdf");
    res.setHeader(
      "Content-Disposition",
      `${route === "preview" ? "inline" : "attachment"}; filename="${filename(data.profile.full_name)}"`,
    );
    res.send(pdf);
  });
app.use((_req, res) => res.status(404).json({ error: "Route introuvable." }));
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (err instanceof ZodError) {
      res.status(400).json({
        error: err.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(" "),
      });
      return;
    }
    const e = err as {
      code?: string;
      status?: number;
      message?: string;
      type?: string;
    };
    if (e.code === "23505") {
      res.status(409).json({
        error: "Ce courriel ou cette adresse de portfolio est déjà utilisé.",
      });
      return;
    }
    if (e.status && e.status >= 400 && e.status < 500) {
      res.status(e.status).json({ error: e.message || "Requête invalide." });
      return;
    }
    console.error("API failure", e.code || "service-unavailable");
    res.status(503).json({
      error:
        "Service momentanément indisponible. Vérifiez PostgreSQL et Redis.",
    });
  },
);
