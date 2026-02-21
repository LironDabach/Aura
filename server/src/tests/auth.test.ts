import request from "supertest";
import initApp from "../index";
import usersModel from "../models/usersModel";
import { Express } from "express";
import jwt from "jsonwebtoken";
import { authenticate } from "../middleware/authMiddleware";
import mongoose from "mongoose";

let app: Express;

beforeAll(async () => {
  jest.setTimeout(20000);
  app = await initApp();
  await usersModel.deleteMany({});
});

afterAll(async () => {
  await usersModel.deleteMany({});
  await mongoose.connection.close();
});

describe("Auth API", () => {
  const username = "shiranlevi";
  const email = "liron.dabach3@gmail.com";
  const password = "StrongPass123!";
  let registerRefreshToken: string;
  let loginRefreshToken: string;
  let loginAccessToken: string;
  let refreshedRefreshToken: string;
  let usedSecret: string;

  beforeAll(() => {
    usedSecret = process.env.JWT_SECRET || "";
  });

  test("register requires username, email and password", async () => {
    const response = await request(app).post("/api/auth/register").send({
      username,
      email,
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  test("registers a user and returns tokens", async () => {
    const response = await request(app).post("/api/auth/register").send({
      username,
      email,
      password,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("refreshToken");
    registerRefreshToken = response.body.refreshToken;

    const user = await usersModel.findOne({ username, email });
    expect(user).not.toBeNull();
    expect(user?.refreshTokens).toContain(registerRefreshToken);
  });

  test("register fails when JWT_SECRET is missing and process.exit is called", async () => {
    const originalSecret = process.env.JWT_SECRET;
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((() => {
        throw new Error("process.exit called");
      }) as never);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    delete process.env.JWT_SECRET;

    try {
      const response = await request(app).post("/api/auth/register").send({
        username: `${username}nosecret`,
        email: `nosecret${email}`,
        password,
      });

      expect(response.status).toBe(500);
      expect(errorSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalled();
    } finally {
      if (originalSecret !== undefined) {
        process.env.JWT_SECRET = originalSecret;
      }
      exitSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });

  test("login requires username and password", async () => {
    const response = await request(app).post("/api/auth/login").send({
      username,
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  test("login fails when user is not found", async () => {
    const response = await request(app).post("/api/auth/login").send({
      username: `${username}_missing`,
      password,
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  test("logs in a user and returns new tokens", async () => {
    const response = await request(app).post("/api/auth/login").send({
      username,
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("refreshToken");
    loginAccessToken = response.body.token;
    loginRefreshToken = response.body.refreshToken;
    expect(loginRefreshToken).not.toBe(registerRefreshToken);

    const user = await usersModel.findOne({ username, email });
    expect(user).not.toBeNull();
    expect(user?.refreshTokens).toContain(registerRefreshToken);
    expect(user?.refreshTokens).toContain(loginRefreshToken);
  });

  test("login fails with invalid password", async () => {
    const response = await request(app).post("/api/auth/login").send({
      username,
      password: "WrongPass123!",
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  test("login returns 500 when model throws", async () => {
    const findOneSpy = jest
      .spyOn(usersModel, "findOne")
      .mockRejectedValueOnce(new Error("db error"));

    const response = await request(app).post("/api/auth/login").send({
      username,
      password,
    });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message");

    findOneSpy.mockRestore();
  });

  test("trying creating a post without token fails", async () => {
    const postData = {
      title: "Unauthorized Post",
      content: "This should fail.",
    };
    const invakidToken = loginAccessToken + "invalid";
    const response = await request(app)
      .post("/api/post")
      .set("Authorization", `Bearer ${invakidToken}`)
      .send(postData);

    expect(response.status).toBe(401);
  });

  test("missing Authorization header returns 401", async () => {
    const response = await request(app).post("/api/post").send({
      title: "No auth header",
      content: "Should fail",
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  test("missing bearer token returns 401", async () => {
    const response = await request(app)
      .post("/api/post")
      .set("Authorization", "Bearer ")
      .send({
        title: "No token",
        content: "Should fail",
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  test("authenticate returns 401 when Bearer token is empty", () => {
    const req: any = { headers: { authorization: "Bearer " } };
    const res: any = {
      status: jest.fn().mockReturnValue({ json: jest.fn() }),
    };
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("refreshes token and rotates refresh token", async () => {
    const response = await request(app).post("/api/auth/refresh-token").send({
      refreshToken: loginRefreshToken,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("refreshToken");
    refreshedRefreshToken = response.body.refreshToken;
    expect(refreshedRefreshToken).not.toBe(loginRefreshToken);

    const user = await usersModel.findOne({ username, email });
    expect(user).not.toBeNull();
    expect(user?.refreshTokens).toContain(refreshedRefreshToken);
    expect(user?.refreshTokens).not.toContain(loginRefreshToken);
  });

  test("logout revokes refresh token", async () => {
    const response = await request(app).post("/api/auth/logout").send({
      refreshToken: refreshedRefreshToken,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");

    const user = await usersModel.findOne({ username, email });
    expect(user).not.toBeNull();
    expect(user?.refreshTokens).not.toContain(refreshedRefreshToken);

    const refreshAttempt = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken: refreshedRefreshToken });
    expect(refreshAttempt.status).toBe(401);
  });

  test("logout requires refresh token", async () => {
    const response = await request(app).post("/api/auth/logout").send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  test("logout fails when token points to missing user", async () => {
    const fakeToken = jwt.sign(
      { _id: "000000000000000000000000" },
      usedSecret,
      { expiresIn: "1h" },
    );
    const response = await request(app).post("/api/auth/logout").send({
      refreshToken: fakeToken,
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  test("logout returns 500 for malformed refresh token", async () => {
    const response = await request(app).post("/api/auth/logout").send({
      refreshToken: "not-a-jwt",
    });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message");
  });

  test("refresh token requires refresh token", async () => {
    const response = await request(app).post("/api/auth/refresh-token").send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  test("refresh token fails when token points to missing user", async () => {
    const fakeToken = jwt.sign(
      { _id: "000000000000000000000000" },
      usedSecret,
      { expiresIn: "1h" },
    );
    const response = await request(app).post("/api/auth/refresh-token").send({
      refreshToken: fakeToken,
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  test("refresh token returns 401 for malformed token", async () => {
    const response = await request(app).post("/api/auth/refresh-token").send({
      refreshToken: "not-a-jwt",
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  test("tokens verify with .env.test JWT_SECRET and fail with a wrong secret", () => {
    expect(usedSecret).toBeTruthy();

    const accessPayload = jwt.verify(loginAccessToken, usedSecret) as {
      _id: string;
    };
    const refreshPayload = jwt.verify(refreshedRefreshToken, usedSecret) as {
      _id: string;
    };

    expect(accessPayload._id).toBeTruthy();
    expect(refreshPayload._id).toBeTruthy();

    const wrongSecret = `${usedSecret}_wrong`;
    expect(() => jwt.verify(loginAccessToken, wrongSecret)).toThrow();
    expect(() => jwt.verify(refreshedRefreshToken, wrongSecret)).toThrow();
  });
});
