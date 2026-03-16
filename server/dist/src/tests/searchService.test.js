"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const mongoose_1 = __importDefault(require("mongoose"));
const postsModel_1 = __importDefault(require("../models/postsModel"));
require("../models/usersModel");
const likesModel_1 = __importDefault(require("../models/likesModel"));
const commentsModel_1 = __importDefault(require("../models/commentsModel"));
const searchService_1 = require("../services/searchService");
const llmService_1 = require("../services/llmService");
describe("SearchService", () => {
    let server;
    let baseUrl;
    let llmResponseText = '{"postIds":[]}';
    let llmStatusCode = 200;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error("DATABASE_URL is undefined");
        }
        yield mongoose_1.default.connect(dbUrl);
        server = http_1.default.createServer((req, res) => {
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
                res.end(JSON.stringify({
                    response: llmResponseText,
                    done: true,
                }));
            });
        });
        yield new Promise((resolve) => {
            server.listen(0, () => {
                const address = server.address();
                baseUrl = `http://127.0.0.1:${address.port}`;
                resolve();
            });
        });
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const postsToClean = yield postsModel_1.default
            .find({ title: { $regex: /^ai-search-test-/ } })
            .select("_id");
        const postIds = postsToClean.map((post) => post._id);
        if (postIds.length) {
            yield likesModel_1.default.deleteMany({ postID: { $in: postIds } });
            yield commentsModel_1.default.deleteMany({ postID: { $in: postIds } });
            yield postsModel_1.default.deleteMany({ _id: { $in: postIds } });
        }
        process.env.LLM_BASE_URL = baseUrl;
        process.env.LLM_USER = "student1";
        process.env.LLM_PASS = "pass123";
        process.env.LLM_TIMEOUT_MS = "2000";
        llmStatusCode = 200;
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const postsToClean = yield postsModel_1.default
            .find({ title: { $regex: /^ai-search-test-/ } })
            .select("_id");
        const postIds = postsToClean.map((post) => post._id);
        if (postIds.length) {
            yield likesModel_1.default.deleteMany({ postID: { $in: postIds } });
            yield commentsModel_1.default.deleteMany({ postID: { $in: postIds } });
            yield postsModel_1.default.deleteMany({ _id: { $in: postIds } });
        }
        yield new Promise((resolve) => server.close(() => resolve()));
        yield mongoose_1.default.connection.close();
    }));
    test("uses llm ranking order for results", () => __awaiter(void 0, void 0, void 0, function* () {
        const senderID = new mongoose_1.default.Types.ObjectId();
        const postA = yield postsModel_1.default.create({
            title: "ai-search-test-first",
            body: "post about hiking and travel",
            senderID,
            imageUrl: "https://example.com/a.png",
            date: new Date(),
        });
        const postB = yield postsModel_1.default.create({
            title: "ai-search-test-second",
            body: "post about city food and travel tips",
            senderID,
            imageUrl: "https://example.com/b.png",
            date: new Date(Date.now() + 1000),
        });
        llmResponseText = JSON.stringify({
            postIds: [postA._id.toString(), postB._id.toString()],
        });
        const service = new searchService_1.SearchService(postsModel_1.default, new llmService_1.LlmService());
        const result = yield service.searchPostsAi("travel", 1, 10);
        expect(result.source).toBe("llm");
        expect(result.total).toBe(2);
        expect(result.posts[0]._id.toString()).toBe(postA._id.toString());
        expect(result.posts[1]._id.toString()).toBe(postB._id.toString());
    }));
    test("falls back to regex search when llm returns invalid json", () => __awaiter(void 0, void 0, void 0, function* () {
        const senderID = new mongoose_1.default.Types.ObjectId();
        yield postsModel_1.default.create({
            title: "ai-search-test-regex-hit",
            body: "contains pineapple keyword",
            senderID,
            imageUrl: "https://example.com/c.png",
            date: new Date(),
        });
        yield postsModel_1.default.create({
            title: "ai-search-test-non-hit",
            body: "does not include target word",
            senderID,
            imageUrl: "https://example.com/d.png",
            date: new Date(Date.now() + 1000),
        });
        llmResponseText = "not-json";
        const service = new searchService_1.SearchService(postsModel_1.default, new llmService_1.LlmService());
        const result = yield service.searchPostsAi("pineapple", 1, 10);
        expect(result.source).toBe("fallback");
        expect(result.total).toBe(1);
        expect(result.posts[0].title).toBe("ai-search-test-regex-hit");
    }));
    test("throws validation error when query is empty", () => __awaiter(void 0, void 0, void 0, function* () {
        const service = new searchService_1.SearchService(postsModel_1.default, new llmService_1.LlmService());
        yield expect(service.searchPostsAi("   ", 1, 5)).rejects.toBeInstanceOf(searchService_1.SearchValidationError);
    }));
    test("throws validation error for symbol-only query", () => __awaiter(void 0, void 0, void 0, function* () {
        const service = new searchService_1.SearchService(postsModel_1.default, new llmService_1.LlmService());
        yield expect(service.searchPostsAi("@@@ ### !!!", 1, 5)).rejects.toBeInstanceOf(searchService_1.SearchValidationError);
    }));
    test("supports humanized likes/comments constraint query", () => __awaiter(void 0, void 0, void 0, function* () {
        const senderID = new mongoose_1.default.Types.ObjectId();
        const uniqueKeyword = "signalrichzeta";
        const matchingPost = yield postsModel_1.default.create({
            title: "ai-search-test-signal-rich",
            body: `topic free body text ${uniqueKeyword}`,
            senderID,
            imageUrl: "https://example.com/e.png",
            date: new Date(),
        });
        const nonMatchingPost = yield postsModel_1.default.create({
            title: "ai-search-test-signal-poor",
            body: "topic free body text",
            senderID,
            imageUrl: "https://example.com/f.png",
            date: new Date(Date.now() + 1000),
        });
        yield likesModel_1.default.create([
            { postID: matchingPost._id, senderID: new mongoose_1.default.Types.ObjectId() },
            { postID: matchingPost._id, senderID: new mongoose_1.default.Types.ObjectId() },
            { postID: matchingPost._id, senderID: new mongoose_1.default.Types.ObjectId() },
            { postID: nonMatchingPost._id, senderID: new mongoose_1.default.Types.ObjectId() },
        ]);
        yield commentsModel_1.default.create([
            {
                postID: matchingPost._id,
                userID: new mongoose_1.default.Types.ObjectId(),
                content: "good one",
            },
        ]);
        llmResponseText = "invalid-json";
        const service = new searchService_1.SearchService(postsModel_1.default, new llmService_1.LlmService());
        const result = yield service.searchPostsAi(`please search for posts that contains at least 3 likes and comment and mention "${uniqueKeyword}"`, 1, 10);
        expect(result.source).toBe("fallback");
        expect(result.total).toBe(1);
        expect(result.posts[0]._id.toString()).toBe(matchingPost._id.toString());
    }));
    //implement humanized constraint test for date range (e.g. "posts from the last week") and for keyword presence (e.g. "posts that mention 'hiking' in the body")
    test("supports humanized date range constraint query", () => __awaiter(void 0, void 0, void 0, function* () {
        const senderID = new mongoose_1.default.Types.ObjectId();
        const uniqueKeyword = "recentzetatag";
        const recentPost = yield postsModel_1.default.create({
            title: "ai-search-test-recent",
            body: `topic free body text ${uniqueKeyword}`,
            senderID,
            imageUrl: "https://example.com/g.png",
            date: new Date(),
        });
        const oldPost = yield postsModel_1.default.create({
            title: "ai-search-test-old",
            body: "topic free body text",
            senderID,
            imageUrl: "https://example.com/h.png",
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
        });
        llmResponseText = "invalid-json";
        const service = new searchService_1.SearchService(postsModel_1.default, new llmService_1.LlmService());
        const result = yield service.searchPostsAi(`please search for posts from the last week that mention "${uniqueKeyword}"`, 1, 10);
        expect(result.source).toBe("fallback");
        expect(result.total).toBe(1);
        expect(result.posts[0]._id.toString()).toBe(recentPost._id.toString());
    }));
    test("supports humanized keyword presence constraint query", () => __awaiter(void 0, void 0, void 0, function* () {
        const senderID = new mongoose_1.default.Types.ObjectId();
        const matchingPost = yield postsModel_1.default.create({
            title: "ai-search-test-keyword-match",
            body: "this post mentions hiking in the body",
            senderID,
            imageUrl: "https://example.com/i.png",
            date: new Date(),
        });
        yield postsModel_1.default.create({
            title: "ai-search-test-keyword-non-match",
            body: "this post does not have the keyword",
            senderID,
            imageUrl: "https://example.com/j.png",
            date: new Date(Date.now() + 1000),
        });
        llmResponseText = "invalid-json";
        const service = new searchService_1.SearchService(postsModel_1.default, new llmService_1.LlmService());
        const result = yield service.searchPostsAi("please search for posts that mention 'hiking' in the body", 1, 10);
        expect(result.source).toBe("fallback");
        expect(result.total).toBe(1);
        expect(result.posts[0]._id.toString()).toBe(matchingPost._id.toString());
    }));
    test("falls back when llm returns too many requests (429)", () => __awaiter(void 0, void 0, void 0, function* () {
        const senderID = new mongoose_1.default.Types.ObjectId();
        const matchingPost = yield postsModel_1.default.create({
            title: "ai-search-test-rate-limit-hit",
            body: "contains mango keyword",
            senderID,
            imageUrl: "https://example.com/rate-limit-hit.png",
            date: new Date(),
        });
        yield postsModel_1.default.create({
            title: "ai-search-test-rate-limit-miss",
            body: "does not contain it",
            senderID,
            imageUrl: "https://example.com/rate-limit-miss.png",
            date: new Date(Date.now() + 1000),
        });
        llmStatusCode = 429;
        const service = new searchService_1.SearchService(postsModel_1.default, new llmService_1.LlmService());
        const result = yield service.searchPostsAi("mango", 1, 10);
        expect(result.source).toBe("fallback");
        expect(result.total).toBe(1);
        expect(result.posts[0]._id.toString()).toBe(matchingPost._id.toString());
    }));
});
//# sourceMappingURL=searchService.test.js.map