import request from "supertest";
import initApp from "../index";
import postsModel from "../models/postsModel";
import { Express } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import BaseController from "../controllers/baseController";

let app: Express;
let authToken: string;
let otherAuthToken: string;
const userId = new mongoose.Types.ObjectId().toString();
const otherUserId = new mongoose.Types.ObjectId().toString();
let createdPostId: string;
let createdOtherPostId: string;

beforeAll(async () => {
  jest.setTimeout(20000);
  app = await initApp();
  const secret = process.env.JWT_SECRET || "default_secret";
  authToken = jwt.sign({ _id: userId }, secret, { expiresIn: "1h" });
  otherAuthToken = jwt.sign({ _id: otherUserId }, secret, { expiresIn: "1h" });
});

afterAll(async () => {
  await postsModel.deleteMany({ senderID: { $in: [userId, otherUserId] } });
  await mongoose.connection.close();
});

describe("Posts CRUD API", () => {
  test("creates a post", async () => {
    const beforeCreate = Date.now();
    const response = await request(app)
      .post("/api/post")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "First post",
        body: "Hello from tests",
        senderID: userId,
        date: "2000-01-01T00:00:00.000Z",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.title).toBe("First post");
    expect(response.body).toHaveProperty("date");
    expect(Number.isNaN(Date.parse(response.body.date))).toBe(false);
    expect(new Date(response.body.date).getTime()).toBeGreaterThanOrEqual(
      beforeCreate,
    );
    createdPostId = response.body._id;
  });

  test("create uses authenticated user id over body senderID", async () => {
    const response = await request(app)
      .post("/api/post")
      .set("Authorization", `Bearer ${otherAuthToken}`)
      .send({
        title: "Other post",
        body: "Other body",
        senderID: userId,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.senderID).toBe(otherUserId);
    createdOtherPostId = response.body._id;
  });

  test("gets all posts", async () => {
    const response = await request(app).get("/api/post");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("posts");
    expect(response.body).toHaveProperty("page");
    expect(response.body).toHaveProperty("totalPages");
    expect(response.body).toHaveProperty("total");
    expect(Array.isArray(response.body.posts)).toBe(true);
    expect(response.body.posts.length).toBeGreaterThan(0);
  });

  test("gets a post by id", async () => {
    const response = await request(app).get(`/api/post/${createdPostId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("_id", createdPostId);
  });

  test("gets posts by user id", async () => {
    const response = await request(app).get(`/api/post/user/${userId}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    response.body.forEach((post: { senderID: string }) => {
      expect(post.senderID).toBe(userId);
    });
  });

  test("gets posts by user id returns empty array for user without posts", async () => {
    const noPostsUserId = new mongoose.Types.ObjectId().toString();
    const response = await request(app).get(`/api/post/user/${noPostsUserId}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(0);
  });

  test("updates a post", async () => {
    const response = await request(app)
      .put(`/api/post/${createdPostId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Updated post",
        body: "Updated body",
      });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Updated post");
  });

  test("update returns 404 when post is missing", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .put(`/api/post/${missingId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Nope" });

    expect(response.status).toBe(404);
  });

  test("update rejects changing the creator", async () => {
    const response = await request(app)
      .put(`/api/post/${createdPostId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ senderID: otherUserId, title: "Attempt change" });

    expect(response.status).toBe(400);
  });

  test("update rejects changing the post date", async () => {
    const response = await request(app)
      .put(`/api/post/${createdPostId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ date: "2030-01-01T00:00:00.000Z", title: "Attempt date change" });

    expect(response.status).toBe(400);
  });

  test("update is forbidden when not creator", async () => {
    const response = await request(app)
      .put(`/api/post/${createdPostId}`)
      .set("Authorization", `Bearer ${otherAuthToken}`)
      .send({ title: "Should fail" });

    expect(response.status).toBe(403);
  });

  test("update returns 500 when model throws", async () => {
    const findByIdSpy = jest
      .spyOn(postsModel, "findById")
      .mockRejectedValueOnce(new Error("db"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(app)
      .put(`/api/post/${createdPostId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Trigger error" });

    expect(response.status).toBe(500);

    findByIdSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test("delete is forbidden when not creator", async () => {
    const response = await request(app)
      .delete(`/api/post/${createdPostId}`)
      .set("Authorization", `Bearer ${otherAuthToken}`);

    expect(response.status).toBe(403);
  });

  test("delete returns 404 when post is missing", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .delete(`/api/post/${missingId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });

  test("deletes a post", async () => {
    const response = await request(app)
      .delete(`/api/post/${createdPostId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);

    const check = await request(app).get(`/api/post/${createdPostId}`);
    expect(check.status).toBe(404);
  });
});

describe("BaseController error handling", () => {
  const makeRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  test("getAll uses model.find without query when query is undefined", async () => {
    const model = { find: jest.fn().mockResolvedValue([{ id: 1 }]) };
    const controller = new BaseController(model);
    const req: any = { query: undefined };
    const res = makeRes();

    await controller.getAll(req, res);

    expect(model.find).toHaveBeenCalledWith();
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  test("getAll returns 500 when model.find throws", async () => {
    const model = { find: jest.fn().mockRejectedValue(new Error("db")) };
    const controller = new BaseController(model);
    const req: any = { query: { foo: "bar" } };
    const res = makeRes();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await controller.getAll(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Error: Can't retrieve entities");
    errorSpy.mockRestore();
  });

  test("getById returns 500 when model.findById throws", async () => {
    const model = { findById: jest.fn().mockRejectedValue(new Error("db")) };
    const controller = new BaseController(model);
    const req: any = { params: { id: "123" } };
    const res = makeRes();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      "Error: Can't retrieve Entity by ID",
    );
    errorSpy.mockRestore();
  });

  test("create returns 500 when model.create throws", async () => {
    const model = { create: jest.fn().mockRejectedValue(new Error("db")) };
    const controller = new BaseController(model);
    const req: any = { params: {}, body: { title: "x" } };
    const res = makeRes();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Error: Can't create entity");
    errorSpy.mockRestore();
  });

  test("del returns 500 when model.findByIdAndDelete throws", async () => {
    const model = {
      findByIdAndDelete: jest.fn().mockRejectedValue(new Error("db")),
    };
    const controller = new BaseController(model);
    const req: any = { params: { id: "123" } };
    const res = makeRes();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await controller.del(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Error: Can't delete entity");
    errorSpy.mockRestore();
  });

  test("update returns 500 when model.findByIdAndUpdate throws", async () => {
    const model = {
      findByIdAndUpdate: jest.fn().mockRejectedValue(new Error("db")),
    };
    const controller = new BaseController(model);
    const req: any = { params: { id: "123" }, body: { title: "x" } };
    const res = makeRes();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await controller.update(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Error: Can't update entity");
    errorSpy.mockRestore();
  });
});
