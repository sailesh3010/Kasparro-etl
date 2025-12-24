import request from "supertest";
import { createApp } from "../server";
import { Pool } from "pg";

jest.mock("../db", () => {
  const { Pool } = jest.requireActual("pg");
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/postgres",
  });
  return {
    pool,
    query: (text: string, params?: any[]) => pool.query(text, params),
  };
});

const app = createApp();

test("GET /data returns pagination meta", async () => {
  const res = await request(app).get("/data?page=1&limit=1");
  expect(res.status).toBe(200);
  expect(res.body.meta).toHaveProperty("request_id");
});
