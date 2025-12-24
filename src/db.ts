import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

let pool: Pool;

if (process.env.DB_HOST) {
  // ✅ Cloud Run / Production (Cloud SQL via socket)
  pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false,
  });
} else {
  // ✅ Local / Docker Compose
  const DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@db:5432/postgres";

  pool = new Pool({
    connectionString: DATABASE_URL,
  });
}

export { pool };

export async function query(text: string, params?: any[]) {
  const res = await pool.query(text, params);
  return res;
}
