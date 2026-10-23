import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import { readFile } from "node:fs/promises";
import type { Express } from "express";
import type { Pool } from "pg";
import type Redis from "ioredis";
import { demo } from "../shared/demo";
// Les tests d'intégration utilisent une base dédiée, jamais les données de l'application.
const enabled = process.env.RUN_INTEGRATION === "1";
describe.skipIf(!enabled)("API réelle avec PostgreSQL et Redis", () => {
  let app: Express,
    pool: Pool,
    redis: Redis,
    cookie: string,
    otherCookie: string;
  const origin = "http://localhost:5173";
  const email = `qa-${Date.now()}@example.com`;
  const slug = `qa-${Date.now()}`;
  const pass = "Valid-password-2026";
  let itemId: number;
  let userId: number;
  beforeAll(async () => {
    if (!process.env.DATABASE_URL?.includes("folio_test"))
      throw new Error("Utiliser une base dédiée nommée folio_test.");
    process.env.APP_ORIGIN = origin;
    process.env.NODE_ENV = "test";
    app = (await import("../backend/src/app")).app;
    ({ pool, redis } = await import("../backend/src/infra"));
    await pool.query(await readFile("backend/db/init.sql", "utf8"));
  });
  afterAll(async () => {
    if (pool) {
      await pool.query("DELETE FROM users WHERE email=$1 OR email=$2", [
        email,
        "other-" + email,
      ]);
      await pool.end();
    }
    if (redis) await redis.quit();
  });
  it("vérifie les services", async () => {
    expect((await request(app).get("/api/health")).status).toBe(200);
  });
  it("refuse les écritures sans origine approuvée", async () => {
    expect(
      (
        await request(app)
          .post("/api/auth/register")
          .send({ email, password: pass, slug, full_name: "Camille Test" })
      ).status,
    ).toBe(403);
  });
  it("valide les mots de passe", async () => {
    expect(
      (
        await request(app)
          .post("/api/auth/register")
          .set("Origin", origin)
          .send({ email, password: "weak", slug, full_name: "Camille Test" })
      ).status,
    ).toBe(400);
  });
  it("inscrit et émet un cookie HttpOnly", async () => {
    const r = await request(app)
      .post("/api/auth/register")
      .set("Origin", origin)
      .send({ email, password: pass, slug, full_name: "Camille Test" });
    expect(r.status).toBe(201);
    cookie = r.headers["set-cookie"][0].split(";")[0];
    expect(r.headers["set-cookie"][0]).toContain("HttpOnly");
    userId = r.body.id;
    const u = await pool.query("SELECT password_hash FROM users WHERE id=$1", [
      userId,
    ]);
    expect(u.rows[0].password_hash).toMatch(/^\$2/);
  });
  it("empêche les doublons", async () => {
    expect(
      (
        await request(app)
          .post("/api/auth/register")
          .set("Origin", origin)
          .send({ email, password: pass, slug, full_name: "Camille Test" })
      ).status,
    ).toBe(409);
  });
  it("protège les données privées", async () => {
    expect((await request(app).get("/api/me")).status).toBe(401);
    expect((await request(app).get("/api/public/" + slug)).status).toBe(404);
  });
  it("authentifie sans exposer le hash", async () => {
    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .set("Origin", origin)
          .send({ email, password: "Invalid-password-2026" })
      ).status,
    ).toBe(401);
    const r = await request(app)
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ email, password: pass });
    expect(r.status).toBe(200);
    const me = await request(app).get("/api/me").set("Cookie", cookie);
    expect(me.status).toBe(200);
    expect(JSON.stringify(me.body)).not.toContain("password_hash");
  });
  it("enregistre le profil", async () => {
    expect(
      (
        await request(app)
          .put("/api/profile")
          .set("Origin", origin)
          .set("Cookie", cookie)
          .send(demo.profile)
      ).status,
    ).toBe(200);
  });
  it("crée les éléments, les modifie et les ordonne", async () => {
    const r = await request(app)
      .post("/api/experiences")
      .set("Origin", origin)
      .set("Cookie", cookie)
      .send(demo.experiences[0]);
    expect(r.status).toBe(201);
    itemId = r.body.id;
    expect(
      (
        await request(app)
          .put("/api/experiences/" + itemId)
          .set("Origin", origin)
          .set("Cookie", cookie)
          .send({ ...demo.experiences[0], title: "Poste modifié" })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .put("/api/experiences/order")
          .set("Origin", origin)
          .set("Cookie", cookie)
          .send({ ids: [itemId] })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .put("/api/experiences/order")
          .set("Origin", origin)
          .set("Cookie", cookie)
          .send({ ids: [itemId, itemId] })
      ).status,
    ).toBe(400);
  });
  it("isole les utilisateurs", async () => {
    const r = await request(app)
      .post("/api/auth/register")
      .set("Origin", origin)
      .send({
        email: "other-" + email,
        password: pass,
        slug: "other-" + slug,
        full_name: "Autre Utilisateur",
      });
    expect(r.status).toBe(201);
    otherCookie = r.headers["set-cookie"][0].split(";")[0];
    expect(
      (
        await request(app)
          .delete("/api/experiences/" + itemId)
          .set("Origin", origin)
          .set("Cookie", otherCookie)
      ).status,
    ).toBe(404);
  });
  it("publie et invalide le cache après modification", async () => {
    await request(app)
      .put("/api/settings")
      .set("Origin", origin)
      .set("Cookie", cookie)
      .send({ slug, is_public: true, allow_cv: false });
    const first = await request(app).get("/api/public/" + slug);
    expect(first.status).toBe(200);
    await request(app)
      .put("/api/profile")
      .set("Origin", origin)
      .set("Cookie", cookie)
      .send({ ...demo.profile, headline: "Nouveau titre" });
    const next = await request(app).get("/api/public/" + slug);
    expect(next.body.profile.headline).toBe("Nouveau titre");
    expect(next.body.user.version).toBeGreaterThan(first.body.user.version);
    expect((await request(app).get("/api/public/" + slug + "/cv")).status).toBe(
      404,
    );
  });
  it("génère, met en cache et télécharge un vrai PDF", async () => {
    const url =
      "/api/cv/download?options=" +
      encodeURIComponent(JSON.stringify({ template: "modern" }));
    const a = await request(app).get(url).set("Cookie", cookie);
    const b = await request(app).get(url).set("Cookie", cookie);
    expect(a.status).toBe(200);
    expect(a.headers["content-type"]).toContain("application/pdf");
    expect(a.headers["content-disposition"]).toContain("CV_Camille_Martin.pdf");
    expect(Buffer.compare(a.body, b.body)).toBe(0);
    expect((await redis.keys(`cv:${userId}:*`)).length).toBeGreaterThan(0);
  });
  it("autorise explicitement le CV public puis rend immédiatement le portfolio privé", async () => {
    await request(app)
      .put("/api/settings")
      .set("Origin", origin)
      .set("Cookie", cookie)
      .send({ slug, is_public: true, allow_cv: true });
    expect((await request(app).get("/api/public/" + slug + "/cv")).status).toBe(
      200,
    );
    await request(app)
      .put("/api/settings")
      .set("Origin", origin)
      .set("Cookie", cookie)
      .send({ slug, is_public: false, allow_cv: true });
    expect((await request(app).get("/api/public/" + slug)).status).toBe(404);
    expect((await request(app).get("/api/public/" + slug + "/cv")).status).toBe(
      404,
    );
  });
  it("supprime un élément", async () => {
    expect(
      (
        await request(app)
          .delete("/api/experiences/" + itemId)
          .set("Origin", origin)
          .set("Cookie", cookie)
      ).status,
    ).toBe(200);
    const me = await request(app).get("/api/me").set("Cookie", cookie);
    expect(me.body.experiences).toHaveLength(0);
  });
  it("change le mot de passe et révoque les anciennes sessions", async () => {
    const r = await request(app)
      .put("/api/auth/password")
      .set("Origin", origin)
      .set("Cookie", cookie)
      .send({ current_password: pass, new_password: "New-password-2026" });
    expect(r.status).toBe(200);
    expect(
      (await request(app).get("/api/me").set("Cookie", cookie)).status,
    ).toBe(401);
    const login = await request(app)
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ email, password: "New-password-2026" });
    expect(login.status).toBe(200);
    cookie = login.headers["set-cookie"][0].split(";")[0];
  });
  it("supprime le compte et les données en cascade", async () => {
    await request(app)
      .post("/api/projects")
      .set("Origin", origin)
      .set("Cookie", cookie)
      .send(demo.projects[0]);
    expect(
      (
        await request(app)
          .delete("/api/account")
          .set("Origin", origin)
          .set("Cookie", cookie)
          .send({ password: "New-password-2026" })
      ).status,
    ).toBe(200);
    for (const table of ["users", "profiles", "projects"]) {
      const r = await pool.query(
        `SELECT COUNT(*)::int AS n FROM ${table} WHERE ${table === "users" ? "id" : "user_id"}=$1`,
        [userId],
      );
      expect(r.rows[0].n).toBe(0);
    }
    expect(
      (await request(app).get("/api/me").set("Cookie", cookie)).status,
    ).toBe(401);
  });
  it("déconnecte et invalide la session Redis", async () => {
    expect(
      (
        await request(app)
          .post("/api/auth/logout")
          .set("Origin", origin)
          .set("Cookie", otherCookie)
      ).status,
    ).toBe(200);
    expect(
      (await request(app).get("/api/me").set("Cookie", otherCookie)).status,
    ).toBe(401);
  });
});
