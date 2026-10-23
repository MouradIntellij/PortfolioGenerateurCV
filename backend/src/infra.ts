import pg from "pg";
import Redis from "ioredis";
import { attachDatabasePool } from "@vercel/functions";
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});
if (process.env.VERCEL) attachDatabasePool(pool);
export const redis = new Redis(
  process.env.REDIS_URL || "redis://localhost:6380",
  {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    retryStrategy: () => null,
  },
);
redis.on("error", () => {
  /* Errors returned by awaited operations; never log credentials. */
});
