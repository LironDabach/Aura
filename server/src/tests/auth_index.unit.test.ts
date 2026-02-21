import mongoose from "mongoose";
import authController from "../controllers/authController";
import initApp from "../index";
import User from "../models/usersModel";
import { OAuth2Client } from "google-auth-library";

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("AuthController unit", () => {
  let originalClientId: string | undefined;

  beforeEach(() => {
    originalClientId = process.env.GOOGLE_CLIENT_ID;
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalClientId === undefined) {
      delete process.env.GOOGLE_CLIENT_ID;
    } else {
      process.env.GOOGLE_CLIENT_ID = originalClientId;
    }
    jest.restoreAllMocks();
  });

  test("register rejects invalid username format", async () => {
    const req: any = {
      body: { username: "bad username!", email: "a@b.com", password: "Pass123!" },
    };
    const res = makeRes();

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Username can only contain English letters, numbers, dots, underscores, and hyphens",
      }),
    );
  });

  test("login rejects local login for Google-only user", async () => {
    jest.spyOn(User, "findOne").mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      username: "google_user",
      password: undefined,
      refreshTokens: [],
      save: jest.fn(),
    } as any);

    const req: any = { body: { username: "google_user", password: "x" } };
    const res = makeRes();

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Please use Google to sign in" }),
    );
  });

  test("googleLogin requires credential", async () => {
    const req: any = { body: {} };
    const res = makeRes();

    await authController.googleLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("googleLogin fails when GOOGLE_CLIENT_ID is missing", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    const req: any = { body: { credential: "token" } };
    const res = makeRes();

    await authController.googleLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("googleLogin handles provider failure", async () => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    const verifyIdToken = jest
      .spyOn(OAuth2Client.prototype as any, "verifyIdToken")
      .mockImplementation(() => Promise.reject(new Error("google down")));

    const req: any = { body: { credential: "token" } };
    const res = makeRes();

    await authController.googleLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    verifyIdToken.mockRestore();
  });

  test("googleLogin returns 401 when token payload is missing", async () => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    const verifyIdToken = jest
      .spyOn(OAuth2Client.prototype as any, "verifyIdToken")
      .mockResolvedValue({
        getPayload: () => null,
      });
    const req: any = { body: { credential: "token" } };
    const res = makeRes();

    await authController.googleLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    verifyIdToken.mockRestore();
  });

  test("googleLogin returns 400 when payload email is missing", async () => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    const verifyIdToken = jest
      .spyOn(OAuth2Client.prototype as any, "verifyIdToken")
      .mockResolvedValue({
        getPayload: () => ({ sub: "google-sub", name: "No Email" }),
      });
    const req: any = { body: { credential: "token" } };
    const res = makeRes();

    await authController.googleLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    verifyIdToken.mockRestore();
  });

  test("googleLogin updates existing user without googleId", async () => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    const verifyIdToken = jest
      .spyOn(OAuth2Client.prototype as any, "verifyIdToken")
      .mockResolvedValue({
        getPayload: () => ({
          sub: "google-sub",
          email: "user@example.com",
          name: "User Name",
          picture: "pic",
        }),
      });

    const save = jest.fn().mockResolvedValue(undefined);
    const existingUser: any = {
      _id: new mongoose.Types.ObjectId(),
      username: "username",
      email: "user@example.com",
      profilePicture: undefined,
      googleId: undefined,
      refreshTokens: [],
      save,
    };
    jest.spyOn(User, "findOne").mockResolvedValue(existingUser);

    const req: any = { body: { credential: "token" } };
    const res = makeRes();

    await authController.googleLogin(req, res);

    expect(existingUser.googleId).toBe("google-sub");
    expect(existingUser.profilePicture).toBe("pic");
    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    verifyIdToken.mockRestore();
  });

  test("googleLogin creates user and resolves username collisions", async () => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    const verifyIdToken = jest
      .spyOn(OAuth2Client.prototype as any, "verifyIdToken")
      .mockResolvedValue({
        getPayload: () => ({
          sub: "google-new",
          email: "new.user@example.com",
          name: "New User",
          picture: "pic2",
        }),
      });

    const createdUser: any = {
      _id: new mongoose.Types.ObjectId(),
      username: "newuser1",
      email: "new.user@example.com",
      profilePicture: "pic2",
      googleId: "google-new",
      refreshTokens: [],
      save: jest.fn().mockResolvedValue(undefined),
    };

    const findOneSpy = jest
      .spyOn(User, "findOne")
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce({ _id: new mongoose.Types.ObjectId() } as any)
      .mockResolvedValueOnce(null as any);
    const createSpy = jest.spyOn(User, "create").mockResolvedValue(createdUser);

    const req: any = { body: { credential: "token" } };
    const res = makeRes();

    await authController.googleLogin(req, res);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ username: "newuser1" }),
    );
    expect(createdUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);

    verifyIdToken.mockRestore();
    findOneSpy.mockRestore();
    createSpy.mockRestore();
  });
});

describe("initApp unit", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("rejects when DATABASE_URL is missing", async () => {
    const old = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    await expect(initApp()).rejects.toBe("DATABASE_URL is undefined");

    if (old !== undefined) process.env.DATABASE_URL = old;
  });

  test("wraps mongoose connection errors with timeout message", async () => {
    process.env.DATABASE_URL = "mongodb://localhost:27017/aura";
    process.env.MONGO_CONNECT_TIMEOUT_MS = "1234";
    const connectSpy = jest
      .spyOn(mongoose, "connect")
      .mockRejectedValueOnce(new Error("boom"));

    await expect(initApp()).rejects.toThrow(
      "Failed to connect to MongoDB within 1234ms",
    );

    connectSpy.mockRestore();
  });
});
