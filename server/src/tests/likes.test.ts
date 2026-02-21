import request from "supertest";
import initApp from "../index";
import likesModel from "../models/likesModel";
import postsModel from "../models/postsModel";
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
let createdNoLikesPostId: string;

beforeAll(async () => {
  app = await initApp();

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
  if (createdLikeId) {
    await likesModel.deleteMany({ _id: createdLikeId });
  }
  const postIds = [createdPostId, createdNoLikesPostId].filter(Boolean);
  if (postIds.length > 0) {
    await postsModel.deleteMany({ _id: { $in: postIds } });
  }
  await mongoose.connection.close();
});

describe("Likes API", () => {
  // ── POST /api/like/post/:postID ──

  test("like requires authentication", async () => {
    const response = await request(app)
      .post(`/api/like/post/${createdPostId}`)
      .send({});

    expect(response.status).toBe(401);
  });

  test("creates a like for a post", async () => {
    const response = await request(app)
      .post(`/api/like/post/${createdPostId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.postID).toBe(createdPostId);
    expect(response.body.senderID).toBe(userId);
    expect(response.body).toHaveProperty("date");
    createdLikeId = response.body._id;
  });

  // ── GET /api/like/post/:postID ──

  test("returns empty likes list for a post with no likes", async () => {
    const createdOtherPost = await postsModel.create({
      title: "Post without likes",
      body: "No likes yet",
      senderID: userId,
    });
    createdNoLikesPostId = createdOtherPost._id.toString();

    const response = await request(app).get(
      `/api/like/post/${createdOtherPost._id.toString()}`
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  test("gets all likes for a specific post", async () => {
    const response = await request(app).get(`/api/like/post/${createdPostId}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    response.body.forEach((like: { postID: string; date: string }) => {
      expect(like.postID).toBe(createdPostId);
      expect(typeof like.date).toBe("string");
    });
  });

  // ── DELETE /api/like/post/:postID ──

  test("unlike requires authentication", async () => {
    const response = await request(app).delete(`/api/like/post/${createdPostId}`);

    expect(response.status).toBe(401);
  });

  test("unlike returns 404 when user has no like on the post", async () => {
    const response = await request(app)
      .delete(`/api/like/post/${createdPostId}`)
      .set("Authorization", `Bearer ${otherAuthToken}`);

    expect(response.status).toBe(404);
  });

  test("unlike removes the like for the authenticated user", async () => {
    const response = await request(app)
      .delete(`/api/like/post/${createdPostId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);

    // Verify it was actually deleted
    const likesResponse = await request(app).get(`/api/like/post/${createdPostId}`);
    expect(likesResponse.body.length).toBe(0);
  });
});
