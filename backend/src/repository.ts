import { pool } from "./infra.js";
import {
  sections,
  type Portfolio,
  type Section,
  type Item,
  type Profile,
} from "../../shared/schema.js";
import type { PoolClient } from "pg";
export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const result = await fn(c);
    await c.query("COMMIT");
    return result;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
export async function getPortfolio(id: number): Promise<Portfolio> {
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    const u = await c.query(
      "SELECT id,slug,is_public,allow_cv,version FROM users WHERE id=$1",
      [id],
    );
    if (!u.rowCount)
      throw Object.assign(new Error("Portfolio introuvable."), { status: 404 });
    const p = await c.query<Profile>(
      "SELECT full_name,headline,bio,email,phone,city,linkedin_url,github_url,website_url,photo_url FROM profiles WHERE user_id=$1",
      [id],
    );
    const data = {} as Record<Section, Item[]>;
    for (const section of sections) {
      const r = await c.query<Item>(
        `SELECT id,title,subtitle,start_date,end_date,description,technologies,repo_url,demo_url,image_url,category,level,sort_order FROM ${section} WHERE user_id=$1 ORDER BY sort_order,id`,
        [id],
      );
      data[section] = r.rows;
    }
    return { user: u.rows[0], profile: p.rows[0], ...data };
  });
}
export async function bump(c: PoolClient, id: number) {
  await c.query("UPDATE users SET version=version+1 WHERE id=$1", [id]);
}
