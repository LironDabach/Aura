import request from "supertest";
import initApp from "../index";
import usersModel from "../models/usersModel";
import { Express } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { deleteUploadedFileByUrl } from "../middleware/uploadMiddleware";

let app: Express;
const uploadedUrls: string[] = [];

const trackUpload = (url: string) => {
  uploadedUrls.push(url);
  return url;
};

const toRelativeUrl = (fullUrl: string) => fullUrl.replace(/^.*\/\/[^/]+/, "");

beforeAll(async () => {
  jest.setTimeout(20000);
  app = await initApp();
  await usersModel.deleteMany({});
});

afterAll(async () => {
  for (const url of uploadedUrls) {
    await deleteUploadedFileByUrl(url);
  }
  await usersModel.deleteMany({});
  await mongoose.connection.close();
});

describe("Users CRUD API with multer", () => {
  test("creates user with profilePicture upload", async () => {
    const filePath = `${__dirname}/aura_test_file.png`;
    const response = await request(app)
      .post("/api/user")
      .field("username", "multer_user_1")
      .field("email", "multer_user_1@example.com")
      .field("password", "StrongPass123!")
      .attach("file", filePath);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body).toHaveProperty("profilePicture");
    expect(response.body.profilePicture).toContain("/api/upload/");
    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("refreshTokens");

    const imageUrl = trackUpload(response.body.profilePicture);
    const fetchResponse = await request(app).get(toRelativeUrl(imageUrl));
    expect(fetchResponse.status).toBe(200);
  });

  test("update replaces profilePicture and deletes old file", async () => {
    const filePath = `${__dirname}/aura_test_file.png`;
    const createResponse = await request(app)
      .post("/api/user")
      .field("username", "multer_user_2")
      .field("email", "multer_user_2@example.com")
      .field("password", "StrongPass123!")
      .attach("file", filePath);

    expect(createResponse.status).toBe(201);
    const userId = createResponse.body._id;
    const oldUrl = trackUpload(createResponse.body.profilePicture);
    const secret = process.env.JWT_SECRET || "default_secret";
    const token = jwt.sign({ _id: userId }, secret, { expiresIn: "1h" });

    const newFilePath = `${__dirname}/aura_test_file.png`;
    const updateResponse = await request(app)
      .put(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .attach("file", newFilePath);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.profilePicture).toContain("/api/upload/");
    expect(updateResponse.body.profilePicture).not.toBe(oldUrl);

    const newUrl = trackUpload(updateResponse.body.profilePicture);
    const oldFetch = await request(app).get(toRelativeUrl(oldUrl));
    expect(oldFetch.status).toBe(404);

    const newFetch = await request(app).get(toRelativeUrl(newUrl));
    expect(newFetch.status).toBe(200);
  });

  test("update is forbidden for non-owner token", async () => {
    const createResponse = await request(app)
      .post("/api/user")
      .field("username", "multer_user_3")
      .field("email", "multer_user_3@example.com")
      .field("password", "StrongPass123!");

    expect(createResponse.status).toBe(201);
    const userId = createResponse.body._id;
    const secret = process.env.JWT_SECRET || "default_secret";
    const token = jwt.sign({ _id: new mongoose.Types.ObjectId().toString() }, secret, {
      expiresIn: "1h",
    });

    const updateResponse = await request(app)
      .put(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .field("username", "should_fail");

    expect(updateResponse.status).toBe(403);
  });

  test("delete removes profilePicture file", async () => {
    const filePath = `${__dirname}/aura_test_file.png`;
    const createResponse = await request(app)
      .post("/api/user")
      .field("username", "multer_user_4")
      .field("email", "multer_user_4@example.com")
      .field("password", "StrongPass123!")
      .attach("file", filePath);

    expect(createResponse.status).toBe(201);
    const userId = createResponse.body._id;
    const imageUrl = trackUpload(createResponse.body.profilePicture);
    const secret = process.env.JWT_SECRET || "default_secret";
    const token = jwt.sign({ _id: userId }, secret, { expiresIn: "1h" });

    const deleteResponse = await request(app)
      .delete(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteResponse.status).toBe(200);

    const fetchResponse = await request(app).get(toRelativeUrl(imageUrl));
    expect(fetchResponse.status).toBe(404);
  });

  test("delete is forbidden for non-owner token", async () => {
    const createResponse = await request(app)
      .post("/api/user")
      .field("username", "multer_user_5")
      .field("email", "multer_user_5@example.com")
      .field("password", "StrongPass123!");

    expect(createResponse.status).toBe(201);
    const userId = createResponse.body._id;
    const secret = process.env.JWT_SECRET || "default_secret";
    const token = jwt.sign({ _id: new mongoose.Types.ObjectId().toString() }, secret, {
      expiresIn: "1h",
    });

    const deleteResponse = await request(app)
      .delete(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteResponse.status).toBe(403);
  });

  test("creating user without file should succeed without profilePicture", async () => {
    const response = await request(app)
      .post("/api/user")
      .field("username", "multer_user_6")
      .field("email", "multer_user_6@example.com")
      .field("password", "StrongPass123!");
    expect(response.status).toBe(201);
    expect(response.body.profilePicture).toBeUndefined();
  });

  test("creating user with non-file field should fail", async () => {
    const response = await request(app)
      .post("/api/user")
      .field("username", "multer_user_7")
      .field("email", "multer_user_7@example.com")
      .field("password", "StrongPass123!")
      .field("nonFileField", "should_fail");
    expect(response.status).toBe(400);
  });

  test("creating user with invalid file field should fail", async () => {
    const response = await request(app)
      .post("/api/user")
      .field("username", "multer_user_8")
      .field("email", "multer_user_8@example.com")
      .field("password", "StrongPass123!")
      .field("file", "should_fail");
    expect(response.status).toBe(400);
  });

  test("creating user with unsupported file type should fail", async () => {
    const filePath = `${__dirname}/aura_test_file...name...with...dots.txt`;
    const response = await request(app)
      .post("/api/user")
      .field("username", "multer_user_9")
      .field("email", "multer_user_9@example.com")
      .field("password", "StrongPass123!")
      .attach("file", filePath);
    expect(response.status).toBe(400);
  });

  test("creating user with file but missing required fields should fail", async () => {
    const filePath = `${__dirname}/aura_test_file.png`;
    const response = await request(app)
      .post("/api/user")
      .attach("file", filePath);
    expect(response.status).toBe(400);
  });

  test("creating user with file but invalid email should fail", async () => {
    const filePath = `${__dirname}/aura_test_file.png`;
    const response = await request(app)
      .post("/api/user")
      .field("username", "multer_user_10")
      .field("email", "invalid_email")
      .field("password", "StrongPass123!")
      .attach("file", filePath);
    expect(response.status).toBe(400);
  });
});
