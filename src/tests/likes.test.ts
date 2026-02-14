import request from "supertest";
import initApp from "../index";
import likesModel from "../models/likesModel";
import postsModel from "../models/postsModel";
import likesRoute from "../routes/likesRoute";
import likesController from "../controllers/likesController";
import { authenticate } from "../middleware/authMiddleware";
import { Express } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

jest.setTimeout(30000);

let app: Express;
let authToken: string;
let otherAuthToken: string;
const userId = new mongoose.Types.ObjectId().toString();
const otherUserId = new mongoose.Types.ObjectId().toString();
let createdPostId: string;
let createdLikeId: string;
let createdOtherLikeId: string;
let createdAutoSenderLikeId: string;
let createdNoLikesPostId: string;

beforeAll(async () => {
  app = await initApp();

  // Keep this test aligned with other suites: initialize app once and seed DB data.
  app.use("/like", likesRoute);
  app.post("/like", authenticate, likesController.create.bind(likesController));
  app.put("/like/:id", authenticate, likesController.update.bind(likesController));
  app.delete("/like/:id", authenticate, likesController.del.bind(likesController));

  const createdPost = await postsModel.create({
    title: "Post for likes",
    body: "Seed post body",
    senderID: userId,
  });
  createdPostId = createdPost._id.toString();

  const secret = process.env.JWT_SECRET || "default_secret";
  authToken = jwt.sign({ _id: userId }, secret, { expiresIn: "1h" });
  otherAuthToken = jwt.sign({ _id: otherUserId }, secret, { expiresIn: "1h" });
}, 30000);

afterAll(async () => {
  const likeIds = [
    createdLikeId,
    createdOtherLikeId,
    createdAutoSenderLikeId,
  ].filter(Boolean);
  if (likeIds.length > 0) {
    await likesModel.deleteMany({ _id: { $in: likeIds } });
  }
  const postIds = [createdPostId, createdNoLikesPostId].filter(Boolean);
  if (postIds.length > 0) {
    await postsModel.deleteMany({ _id: { $in: postIds } });
  }
  await mongoose.connection.close();
});

describe("Likes CRUD API", () => {
  test("create requires authentication", async () => {
    const response = await request(app).post("/like").send({
      postID: createdPostId,
      senderID: userId,
    });

    expect(response.status).toBe(401);
  });

  test("create by post id requires authentication", async () => {
    const response = await request(app).post(`/like/post/${createdPostId}`).send({
      senderID: userId,
    });

    expect(response.status).toBe(401);
  });

  test("creates a like", async () => {
    const response = await request(app)
      .post("/like")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        postID: createdPostId,
        senderID: userId,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.postID).toBe(createdPostId);
    expect(response.body.senderID).toBe(userId);
    expect(response.body).toHaveProperty("date");
    createdLikeId = response.body._id;
  });

  test("creates a like by post id route", async () => {
    const response = await request(app)
      .post(`/like/post/${createdPostId}`)
      .set("Authorization", `Bearer ${otherAuthToken}`)
      .send({
        postID: new mongoose.Types.ObjectId().toString(),
        senderID: otherUserId,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.postID).toBe(createdPostId);
    expect(response.body.senderID).toBe(otherUserId);
    expect(response.body).toHaveProperty("date");
    createdOtherLikeId = response.body._id;
  });

  test("returns empty likes list for a post with no likes", async () => {
    const createdOtherPost = await postsModel.create({
      title: "Post without likes",
      body: "No likes yet",
      senderID: userId,
    });
    createdNoLikesPostId = createdOtherPost._id.toString();

    const response = await request(app).get(
      `/like/post/${createdOtherPost._id.toString()}`,
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  test("gets all likes for a specific post", async () => {
    const response = await request(app).get(`/like/post/${createdPostId}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    response.body.forEach((like: { postID: string; date: string }) => {
      expect(like.postID).toBe(createdPostId);
      expect(typeof like.date).toBe("string");
    });
  });

  test("create sets senderID from token when missing in payload", async () => {
    const response = await request(app)
      .post("/like")
      .set("Authorization", `Bearer ${otherAuthToken}`)
      .send({
        postID: createdPostId,
      });

    expect(response.status).toBe(201);
    expect(response.body.senderID).toBe(otherUserId);
    expect(response.body).toHaveProperty("date");
    createdAutoSenderLikeId = response.body._id;
  });


  test("update requires authentication", async () => {
    const response = await request(app)
      .put(`/like/${createdLikeId}`)
      .send({ postID: createdPostId });

    expect(response.status).toBe(401);
  });

  test("update returns 404 when like is missing", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .put(`/like/${missingId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ postID: createdPostId });

    expect(response.status).toBe(404);
  });

  test("update rejects senderID change", async () => {
    const response = await request(app)
      .put(`/like/${createdLikeId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ senderID: otherUserId });

    expect(response.status).toBe(400);
  });

  test("delete returns 404 when like is missing", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .delete(`/like/${missingId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });

  test("delete succeeds for creator", async () => {
    const response = await request(app)
      .delete(`/like/${createdLikeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
  });

  test("delete requires authentication", async () => {
    const response = await request(app).delete(`/like/${createdLikeId}`);

    expect(response.status).toBe(401);
  });

  test("delete by post id requires authentication", async () => {
    const response = await request(app).delete(`/like/post/${createdPostId}`);

    expect(response.status).toBe(401);
  });

  test("delete by post id returns 404 when like for user is missing", async () => {
    const response = await request(app)
      .delete(`/like/post/${createdPostId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });
});
