import request from "supertest";
import initApp from "../index";
import commentsModel from "../models/commentsModel";
import postsModel from "../models/postsModel";
import { Express } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

let app: Express;
let authToken: string;
let otherAuthToken: string;
const userId = new mongoose.Types.ObjectId().toString();
const otherUserId = new mongoose.Types.ObjectId().toString();
let createdPostId: string;
let createdCommentId: string;
let createdOtherCommentId: string;

beforeAll(async () => {
  jest.setTimeout(20000);
  app = await initApp();
  const createdPost = await postsModel.create({
    title: "Post for comments",
    body: "Seed post body",
    senderID: userId,
  });
  createdPostId = createdPost._id.toString();
  const secret = process.env.JWT_SECRET || "default_secret";
  authToken = jwt.sign({ _id: userId }, secret, { expiresIn: "1h" });
  otherAuthToken = jwt.sign({ _id: otherUserId }, secret, { expiresIn: "1h" });
});

afterAll(async () => {
  const commentIds = [createdCommentId, createdOtherCommentId].filter(Boolean);
  if (commentIds.length > 0) {
    await commentsModel.deleteMany({ _id: { $in: commentIds } });
  }
  if (createdPostId) {
    await postsModel.findByIdAndDelete(createdPostId);
  }
  await mongoose.connection.close();
});

describe("Comments By Post ID API", () => {
  test("create by post id requires authentication", async () => {
    const response = await request(app).post(`/comment/post/${createdPostId}`).send({
      content: "No auth comment",
    });

    expect(response.status).toBe(401);
  });

  test("creates a comment by post id route", async () => {
    const response = await request(app)
      .post(`/comment/post/${createdPostId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        postID: new mongoose.Types.ObjectId().toString(),
        userID: otherUserId,
        content: "Comment by post route",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.postID).toBe(createdPostId);
    expect(response.body.userID).toBe(userId);
    expect(response.body).toHaveProperty("date");
    expect(Number.isNaN(Date.parse(response.body.date))).toBe(false);
    createdCommentId = response.body._id;
  });

  test("create by post id uses authenticated user id over body userID", async () => {
    const response = await request(app)
      .post(`/comment/post/${createdPostId}`)
      .set("Authorization", `Bearer ${otherAuthToken}`)
      .send({
        postID: createdPostId,
        userID: userId,
        content: "Comment from other user",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.userID).toBe(otherUserId);
    expect(response.body).toHaveProperty("date");
    expect(Number.isNaN(Date.parse(response.body.date))).toBe(false);
    createdOtherCommentId = response.body._id;
  });

  test("gets comments by post id route", async () => {
    const response = await request(app).get(`/comment/post/${createdPostId}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    response.body.forEach((comment: { postID: string }) => {
      expect(comment.postID).toBe(createdPostId);
    });
  });

  test("update by post id requires authentication", async () => {
    const response = await request(app)
      .put(`/comment/post/${createdPostId}/${createdCommentId}`)
      .send({ content: "No auth update" });

    expect(response.status).toBe(401);
  });

  test("updates a comment by post id", async () => {
    const response = await request(app)
      .put(`/comment/post/${createdPostId}/${createdCommentId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ content: "Updated comment" });

    expect(response.status).toBe(200);
    expect(response.body.content).toBe("Updated comment");
  });

  test("update by post id returns 404 when comment is missing", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .put(`/comment/post/${createdPostId}/${missingId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ content: "Nope" });

    expect(response.status).toBe(404);
  });

  test("update by post id is forbidden when not creator", async () => {
    const response = await request(app)
      .put(`/comment/post/${createdPostId}/${createdCommentId}`)
      .set("Authorization", `Bearer ${otherAuthToken}`)
      .send({ content: "Should fail" });

    expect(response.status).toBe(403);
  });

  test("update by post id rejects changing user, post or date", async () => {
    const response = await request(app)
      .put(`/comment/post/${createdPostId}/${createdCommentId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        userID: otherUserId,
        postID: new mongoose.Types.ObjectId().toString(),
        date: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        content: "Attempt change",
      });

    expect(response.status).toBe(400);
  });

  test("delete by post id requires authentication", async () => {
    const response = await request(app).delete(
      `/comment/post/${createdPostId}/${createdCommentId}`,
    );

    expect(response.status).toBe(401);
  });

  test("delete by post id returns 404 when comment is missing", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .delete(`/comment/post/${createdPostId}/${missingId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });

  test("delete by post id is forbidden when not creator", async () => {
    const response = await request(app)
      .delete(`/comment/post/${createdPostId}/${createdCommentId}`)
      .set("Authorization", `Bearer ${otherAuthToken}`);

    expect(response.status).toBe(403);
  });

  test("deletes a comment by post id route", async () => {
    const response = await request(app)
      .delete(`/comment/post/${createdPostId}/${createdCommentId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);

    const check = await request(app).get(`/comment/post/${createdPostId}`);
    expect(check.status).toBe(200);
    const ids = check.body.map((comment: { _id: string }) => comment._id);
    expect(ids).not.toContain(createdCommentId);
  });
});
