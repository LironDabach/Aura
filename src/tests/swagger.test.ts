import request from "supertest";
import initApp from "../index";
import { Express } from "express";
import mongoose from "mongoose";

let app: Express;

beforeAll(async () => {
  jest.setTimeout(20000);
  app = await initApp();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Swagger and initApp", () => {
  test("serves swagger spec JSON", async () => {
    const response = await request(app).get("/api-docs.json");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
  });

  test("initApp rejects when DATABASE_URL is missing", async () => {
    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "";

    await expect(initApp()).rejects.toBe("DATABASE_URL is undefined");

    if (originalUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalUrl;
    }
  });
});
