import { readFile } from "node:fs/promises";
import { pool } from "./infra.js";
try {
  await pool.query(
    await readFile(new URL("../db/init.sql", import.meta.url), "utf8"),
  );
  console.log("Schéma installé.");
} finally {
  await pool.end();
}
