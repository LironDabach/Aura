import http from "http";
import mongoose from "mongoose";
import { AddressInfo } from "net";
import postsModel from "../models/postsModel";
import "../models/usersModel";
import likesModel from "../models/likesModel";
import commentsModel from "../models/commentsModel";
import { SearchService, SearchValidationError } from "../services/searchService";
import { LlmService } from "../services/llmService";

describe("SearchService", () => {
  let server: http.Server;
  let baseUrl: string;
  let llmResponseText = '{"postIds":[]}';
  let llmStatusCode = 200;

  beforeAll(async () => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL is undefined");
    }
    await mongoose.connect(dbUrl);

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

        res.statusCode = llmStatusCode;
        res.setHeader("Content-Type", "application/json");
        if (llmStatusCode !== 200) {
          res.end(JSON.stringify({ error: "rate limited" }));
          return;
        }
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
    const postsToClean = await postsModel
      .find({ title: { $regex: /^ai-search-test-/ } })
      .select("_id");
    const postIds = postsToClean.map((post) => post._id);
    if (postIds.length) {
      await likesModel.deleteMany({ postID: { $in: postIds } });
      await commentsModel.deleteMany({ postID: { $in: postIds } });
      await postsModel.deleteMany({ _id: { $in: postIds } });
    }

    process.env.LLM_BASE_URL = baseUrl;
    process.env.LLM_USER = "student1";
    process.env.LLM_PASS = "pass123";
    process.env.LLM_TIMEOUT_MS = "2000";
    llmStatusCode = 200;
  });

  afterAll(async () => {
    const postsToClean = await postsModel
      .find({ title: { $regex: /^ai-search-test-/ } })
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

  test("uses llm ranking order for results", async () => {
    const senderID = new mongoose.Types.ObjectId();
    const postA = await postsModel.create({
      title: "ai-search-test-first",
      body: "post about hiking and travel",
      senderID,
      imageUrl: "https://example.com/a.png",
      date: new Date(),
    });
    const postB = await postsModel.create({
      title: "ai-search-test-second",
      body: "post about city food and travel tips",
      senderID,
      imageUrl: "https://example.com/b.png",
      date: new Date(Date.now() + 1000),
    });

    llmResponseText = JSON.stringify({
      postIds: [postA._id.toString(), postB._id.toString()],
    });

    const service = new SearchService(postsModel, new LlmService());
    const result = await service.searchPostsAi("travel", 1, 10);

    expect(result.source).toBe("llm");
    expect(result.total).toBe(2);
    expect(result.posts[0]._id.toString()).toBe(postA._id.toString());
    expect(result.posts[1]._id.toString()).toBe(postB._id.toString());
  });

  test("falls back to regex search when llm returns invalid json", async () => {
    const senderID = new mongoose.Types.ObjectId();
    await postsModel.create({
      title: "ai-search-test-regex-hit",
      body: "contains pineapple keyword",
      senderID,
      imageUrl: "https://example.com/c.png",
      date: new Date(),
    });
    await postsModel.create({
      title: "ai-search-test-non-hit",
      body: "does not include target word",
      senderID,
      imageUrl: "https://example.com/d.png",
      date: new Date(Date.now() + 1000),
    });

    llmResponseText = "not-json";

    const service = new SearchService(postsModel, new LlmService());
    const result = await service.searchPostsAi("pineapple", 1, 10);

    expect(result.source).toBe("fallback");
    expect(result.total).toBe(1);
    expect(result.posts[0].title).toBe("ai-search-test-regex-hit");
  });

  test("returns only the top commented posts for most commented queries", async () => {
    const senderID = new mongoose.Types.ObjectId();
    const topPost = await postsModel.create({
      title: "ai-search-test-most-commented-top",
      body: "alpha body",
      senderID,
      imageUrl: "https://example.com/top-comments.png",
      date: new Date(),
    });
    const lowerPost = await postsModel.create({
      title: "ai-search-test-most-commented-lower",
      body: "beta body",
      senderID,
      imageUrl: "https://example.com/lower-comments.png",
      date: new Date(Date.now() + 1000),
    });

    await commentsModel.create([
      { postID: topPost._id, userID: new mongoose.Types.ObjectId(), content: "1" },
      { postID: topPost._id, userID: new mongoose.Types.ObjectId(), content: "2" },
      { postID: topPost._id, userID: new mongoose.Types.ObjectId(), content: "3" },
      { postID: lowerPost._id, userID: new mongoose.Types.ObjectId(), content: "only one" },
    ]);

    llmResponseText = JSON.stringify({
      postIds: [lowerPost._id.toString(), topPost._id.toString()],
    });

    const service = new SearchService(postsModel, new LlmService());
    const result = await service.searchPostsAi("give me the most commented posts", 1, 10);

    expect(result.source).toBe("fallback");
    expect(result.total).toBe(1);
    expect(result.posts[0]._id.toString()).toBe(topPost._id.toString());
  });

  test("returns all posts that satisfy at least 2 likes", async () => {
    const senderID = new mongoose.Types.ObjectId();
    const firstMatching = await postsModel.create({
      title: "ai-search-test-likes-threshold-first",
      body: "alpha likes body",
      senderID,
      imageUrl: "https://example.com/likes-first.png",
      date: new Date(),
    });
    const secondMatching = await postsModel.create({
      title: "ai-search-test-likes-threshold-second",
      body: "beta likes body",
      senderID,
      imageUrl: "https://example.com/likes-second.png",
      date: new Date(Date.now() + 1000),
    });
    const nonMatching = await postsModel.create({
      title: "ai-search-test-likes-threshold-miss",
      body: "gamma likes body",
      senderID,
      imageUrl: "https://example.com/likes-miss.png",
      date: new Date(Date.now() + 2000),
    });

    await likesModel.create([
      { postID: firstMatching._id, senderID: new mongoose.Types.ObjectId() },
      { postID: firstMatching._id, senderID: new mongoose.Types.ObjectId() },
      { postID: secondMatching._id, senderID: new mongoose.Types.ObjectId() },
      { postID: secondMatching._id, senderID: new mongoose.Types.ObjectId() },
      { postID: secondMatching._id, senderID: new mongoose.Types.ObjectId() },
      { postID: nonMatching._id, senderID: new mongoose.Types.ObjectId() },
    ]);

    llmResponseText = JSON.stringify({
      postIds: [secondMatching._id.toString()],
    });

    const service = new SearchService(postsModel, new LlmService());
    const result = await service.searchPostsAi("posts that have at least 2 likes", 1, 10);

    expect(result.source).toBe("fallback");
    expect(result.total).toBe(2);
    expect(result.posts.map((post) => post._id.toString())).toEqual([
      secondMatching._id.toString(),
      firstMatching._id.toString(),
    ]);
  });

  test("returns quoted single-word matches even for common words like of", async () => {
    const senderID = new mongoose.Types.ObjectId();
    const matchingPost = await postsModel.create({
      title: "ai-search-test-word-of",
      body: "the city of gold",
      senderID,
      imageUrl: "https://example.com/of-hit.png",
      date: new Date(),
    });
    await postsModel.create({
      title: "ai-search-test-word-office",
      body: "office stories only",
      senderID,
      imageUrl: "https://example.com/of-miss.png",
      date: new Date(Date.now() + 1000),
    });

    llmResponseText = '{"postIds":[]}';

    const service = new SearchService(postsModel, new LlmService());
    const result = await service.searchPostsAi('give me the posts that contain the word "of"', 1, 10);

    expect(result.source).toBe("fallback");
    expect(result.total).toBe(1);
    expect(result.posts[0]._id.toString()).toBe(matchingPost._id.toString());
  });

  test("throws validation error when query is empty", async () => {
    const service = new SearchService(postsModel, new LlmService());
    await expect(service.searchPostsAi("   ", 1, 5)).rejects.toBeInstanceOf(
      SearchValidationError,
    );
  });

  test("throws validation error for symbol-only query", async () => {
    const service = new SearchService(postsModel, new LlmService());
    await expect(service.searchPostsAi("@@@ ### !!!", 1, 5)).rejects.toBeInstanceOf(
      SearchValidationError,
    );
  });

  test("supports humanized likes/comments constraint query", async () => {
    const senderID = new mongoose.Types.ObjectId();
    const uniqueKeyword = "signalrichzeta";
    const matchingPost = await postsModel.create({
      title: "ai-search-test-signal-rich",
      body: `topic free body text ${uniqueKeyword}`,
      senderID,
      imageUrl: "https://example.com/e.png",
      date: new Date(),
    });
    const nonMatchingPost = await postsModel.create({
      title: "ai-search-test-signal-poor",
      body: "topic free body text",
      senderID,
      imageUrl: "https://example.com/f.png",
      date: new Date(Date.now() + 1000),
    });

    await likesModel.create([
      { postID: matchingPost._id, senderID: new mongoose.Types.ObjectId() },
      { postID: matchingPost._id, senderID: new mongoose.Types.ObjectId() },
      { postID: matchingPost._id, senderID: new mongoose.Types.ObjectId() },
      { postID: nonMatchingPost._id, senderID: new mongoose.Types.ObjectId() },
    ]);
    await commentsModel.create([
      {
        postID: matchingPost._id,
        userID: new mongoose.Types.ObjectId(),
        content: "good one",
      },
    ]);

    llmResponseText = "invalid-json";
    const service = new SearchService(postsModel, new LlmService());

    const result = await service.searchPostsAi(
      `please search for posts that contains at least 3 likes and comment and mention "${uniqueKeyword}"`,
      1,
      10,
    );

    expect(result.source).toBe("fallback");
    expect(result.total).toBe(1);
    expect(result.posts[0]._id.toString()).toBe(matchingPost._id.toString());
  });

  //implement humanized constraint test for date range (e.g. "posts from the last week") and for keyword presence (e.g. "posts that mention 'hiking' in the body")
  test("supports humanized date range constraint query", async () => {
    const senderID = new mongoose.Types.ObjectId();
    const uniqueKeyword = "recentzetatag";
    const recentPost = await postsModel.create({
      title: "ai-search-test-recent",
      body: `topic free body text ${uniqueKeyword}`,
      senderID,
      imageUrl: "https://example.com/g.png",
      date: new Date(),
    });
    const oldPost = await postsModel.create({
      title: "ai-search-test-old",
      body: "topic free body text",
      senderID,
      imageUrl: "https://example.com/h.png",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
    });

    llmResponseText = "invalid-json";
    const service = new SearchService(postsModel, new LlmService());

    const result = await service.searchPostsAi(
      `please search for posts from the last week that mention "${uniqueKeyword}"`,
      1,
      10,
    );

    expect(result.source).toBe("fallback");
    expect(result.total).toBe(1);
    expect(result.posts[0]._id.toString()).toBe(recentPost._id.toString());
  });

  test("supports humanized keyword presence constraint query", async () => {
    const senderID = new mongoose.Types.ObjectId();
    const matchingPost = await postsModel.create({
      title: "ai-search-test-keyword-match",
      body: "this post mentions hiking in the body",
      senderID,
      imageUrl: "https://example.com/i.png",
      date: new Date(),
    });
    await postsModel.create({
      title: "ai-search-test-keyword-non-match",
      body: "this post does not have the keyword",
      senderID,
      imageUrl: "https://example.com/j.png",
      date: new Date(Date.now() + 1000),
    });

    llmResponseText = "invalid-json";
    const service = new SearchService(postsModel, new LlmService());

    const result = await service.searchPostsAi(
      "please search for posts that mention 'hiking' in the body",
      1,
      10,
    );

    expect(result.source).toBe("fallback");
    expect(result.total).toBe(1);
    expect(result.posts[0]._id.toString()).toBe(matchingPost._id.toString()); 
  });

  test("falls back when llm returns too many requests (429)", async () => {
    const senderID = new mongoose.Types.ObjectId();
    const matchingPost = await postsModel.create({
      title: "ai-search-test-rate-limit-hit",
      body: "contains mango keyword",
      senderID,
      imageUrl: "https://example.com/rate-limit-hit.png",
      date: new Date(),
    });
    await postsModel.create({
      title: "ai-search-test-rate-limit-miss",
      body: "does not contain it",
      senderID,
      imageUrl: "https://example.com/rate-limit-miss.png",
      date: new Date(Date.now() + 1000),
    });

    llmStatusCode = 429;
    const service = new SearchService(postsModel, new LlmService());
    const result = await service.searchPostsAi("mango", 1, 10);

    expect(result.source).toBe("fallback");
    expect(result.total).toBe(1);
    expect(result.posts[0]._id.toString()).toBe(matchingPost._id.toString());
  });
});
