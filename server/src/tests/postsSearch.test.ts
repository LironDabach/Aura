import request from "supertest";
import initApp from "../index";
import postsModel from "../models/postsModel";
import likesModel from "../models/likesModel";
import commentsModel from "../models/commentsModel";
import { Express } from "express";
import mongoose from "mongoose";
import http from "http";
import { AddressInfo } from "net";

describe("Posts AI Search API", () => {
  let app: Express;
  let server: http.Server;
  let baseUrl: string;
  let llmResponseText = '{"postIds":[]}';
  const senderID = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    app = await initApp();

    server = http.createServer((req, res) => {
      let raw = "";
      req.on("data", (chunk) => {
        raw += chunk.toString();
      });
      req.on("end", () => {
        const authHeader = req.headers.authorization || "";
        const expectedAuth = `Basic ${Buffer.from("student1:pass123").toString("base64")}`;
        if (authHeader !== expectedAuth) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: "Unauthorized" }));
          return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            response: llmResponseText,
            done: true,
          }),
        );
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  beforeEach(async () => {
    process.env.LLM_BASE_URL = baseUrl;
    process.env.LLM_USER = "student1";
    process.env.LLM_PASS = "pass123";
    process.env.LLM_TIMEOUT_MS = "2000";

    const postsToClean = await postsModel
      .find({ title: { $regex: /^api-search-test-/ } })
      .select("_id");
    const postIds = postsToClean.map((post) => post._id);
    if (postIds.length) {
      await likesModel.deleteMany({ postID: { $in: postIds } });
      await commentsModel.deleteMany({ postID: { $in: postIds } });
      await postsModel.deleteMany({ _id: { $in: postIds } });
    }
  });

  afterAll(async () => {
    const postsToClean = await postsModel
      .find({ title: { $regex: /^api-search-test-/ } })
      .select("_id");
    const postIds = postsToClean.map((post) => post._id);
    if (postIds.length) {
      await likesModel.deleteMany({ postID: { $in: postIds } });
      await commentsModel.deleteMany({ postID: { $in: postIds } });
      await postsModel.deleteMany({ _id: { $in: postIds } });
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.connection.close();
  });

  test("GET /api/post/search/ai returns llm-ranked posts", async () => {
    const post1 = await postsModel.create({
      title: "api-search-test-llm-1",
      body: "content for beaches",
      senderID,
      imageUrl: "https://example.com/1.png",
      date: new Date(),
    });
    const post2 = await postsModel.create({
      title: "api-search-test-llm-2",
      body: "content for mountains",
      senderID,
      imageUrl: "https://example.com/2.png",
      date: new Date(Date.now() + 500),
    });

    llmResponseText = JSON.stringify({
      postIds: [post2._id.toString(), post1._id.toString()],
    });

    const response = await request(app).get("/api/post/search/ai?q=trip");

    expect(response.status).toBe(200);
    expect(response.body.source).toBe("llm");
    expect(response.body.total).toBe(2);
    expect(response.body.posts[0]._id).toBe(post2._id.toString());
    expect(response.body.posts[1]._id).toBe(post1._id.toString());
  });

  test("GET /api/post/search/ai returns 400 when q is missing", async () => {
    const response = await request(app).get("/api/post/search/ai");

    expect(response.status).toBe(400);
  });

  test("GET /api/post/search/ai handles humanized query with likes and comment threshold", async () => {
    const postWithSignals = await postsModel.create({
      title: "api-search-test-threshold-hit",
      body: "great travel guide",
      senderID,
      imageUrl: "https://example.com/hit.png",
      date: new Date(),
    });
    const postWithoutEnoughSignals = await postsModel.create({
      title: "api-search-test-threshold-miss",
      body: "another travel guide",
      senderID,
      imageUrl: "https://example.com/miss.png",
      date: new Date(Date.now() + 500),
    });

    await likesModel.create([
      { postID: postWithSignals._id, senderID: new mongoose.Types.ObjectId() },
      { postID: postWithSignals._id, senderID: new mongoose.Types.ObjectId() },
      { postID: postWithSignals._id, senderID: new mongoose.Types.ObjectId() },
      { postID: postWithoutEnoughSignals._id, senderID: new mongoose.Types.ObjectId() },
    ]);

    await commentsModel.create([
      {
        postID: postWithSignals._id,
        userID: new mongoose.Types.ObjectId(),
        content: "nice post",
      },
    ]);

    llmResponseText = "not-json";

    const response = await request(app).get(
      "/api/post/search/ai?q=please%20search%20for%20posts%20that%20contains%20at%20least%203%20likes%20and%20comment",
    );

    expect(response.status).toBe(200);
    expect(response.body.source).toBe("fallback");
    expect(response.body.total).toBe(1);
    expect(response.body.posts[0]._id).toBe(postWithSignals._id.toString());
  });

  test("GET /api/post/search/ai rejects non-human strange symbols input", async () => {
    const response = await request(app).get(
      "/api/post/search/ai?q=%40%40%40%20%23%23%23%20!!!",
    );

    expect(response.status).toBe(400);
  });

  test("GET /api/post/search/ai accepts noisy but human query input", async () => {
    const response = await request(app).get(
      "/api/post/search/ai?q=%20%20PLEASE%20search%20for%20travel!!!%20%20",
    );

    expect(response.status).toBe(200);
  });
});
