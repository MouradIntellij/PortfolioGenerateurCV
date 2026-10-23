import { createHash, randomBytes } from "node:crypto";
import type { RequestHandler, Response } from "express";
import { redis, pool } from "./infra.js";
export const cookieName = "folio_session";
export const hashToken = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export async function issueSession(res: Response, id: number, version: number) {
  const token = randomBytes(32).toString("hex");
  await redis.set(
    `session:${hashToken(token)}`,
    JSON.stringify({ id, version }),
    "EX",
    604800,
  );
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 604800000,
    path: "/",
  });
}
export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = req.cookies?.[cookieName];
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
    res.status(401).json({ error: "Connectez-vous pour continuer." });
    return;
  }
  const raw = await redis.get(`session:${hashToken(token)}`);
  if (!raw) {
    res.status(401).json({ error: "Session expirée. Reconnectez-vous." });
    return;
  }
  const session = JSON.parse(raw) as { id: number; version: number };
  const u = await pool.query("SELECT session_version FROM users WHERE id=$1", [
    session.id,
  ]);
  if (!u.rowCount || u.rows[0].session_version !== session.version) {
    res.status(401).json({ error: "Session révoquée." });
    return;
  }
  res.locals.userId = session.id;
  next();
};
export function limit(
  prefix: string,
  max: number,
  seconds: number,
): RequestHandler {
  return async (req, res, next) => {
    const identity = hashToken(req.ip || req.socket.remoteAddress || "unknown");
    const count = Number(
      await redis.eval(
        "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end; return n",
        1,
        `limit:${prefix}:${identity}`,
        seconds,
      ),
    );
    if (count > max) {
      res.setHeader("Retry-After", String(seconds));
      res
        .status(429)
        .json({ error: "Trop de tentatives. Réessayez plus tard." });
      return;
    }
    next();
  };
}
