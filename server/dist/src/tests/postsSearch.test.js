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
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index"));
const postsModel_1 = __importDefault(require("../models/postsModel"));
const likesModel_1 = __importDefault(require("../models/likesModel"));
const commentsModel_1 = __importDefault(require("../models/commentsModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = __importDefault(require("http"));
describe("Posts AI Search API", () => {
    let app;
    let server;
    let baseUrl;
    let llmResponseText = '{"postIds":[]}';
    const senderID = new mongoose_1.default.Types.ObjectId();
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        app = yield (0, index_1.default)();
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
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
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
        process.env.LLM_BASE_URL = baseUrl;
        process.env.LLM_USER = "student1";
        process.env.LLM_PASS = "pass123";
        process.env.LLM_TIMEOUT_MS = "2000";
        const postsToClean = yield postsModel_1.default
            .find({ title: { $regex: /^api-search-test-/ } })
            .select("_id");
        const postIds = postsToClean.map((post) => post._id);
        if (postIds.length) {
            yield likesModel_1.default.deleteMany({ postID: { $in: postIds } });
            yield commentsModel_1.default.deleteMany({ postID: { $in: postIds } });
            yield postsModel_1.default.deleteMany({ _id: { $in: postIds } });
        }
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const postsToClean = yield postsModel_1.default
            .find({ title: { $regex: /^api-search-test-/ } })
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
    test("GET /api/post/search/ai returns llm-ranked posts", () => __awaiter(void 0, void 0, void 0, function* () {
        const post1 = yield postsModel_1.default.create({
            title: "api-search-test-llm-1",
            body: "content for beaches",
            senderID,
            imageUrl: "https://example.com/1.png",
            date: new Date(),
        });
        const post2 = yield postsModel_1.default.create({
            title: "api-search-test-llm-2",
            body: "content for mountains",
            senderID,
            imageUrl: "https://example.com/2.png",
            date: new Date(Date.now() + 500),
        });
        llmResponseText = JSON.stringify({
            postIds: [post2._id.toString(), post1._id.toString()],
        });
        const response = yield (0, supertest_1.default)(app).get("/api/post/search/ai?q=trip");
        expect(response.status).toBe(200);
        expect(response.body.source).toBe("llm");
        expect(response.body.total).toBe(2);
        expect(response.body.posts[0]._id).toBe(post2._id.toString());
        expect(response.body.posts[1]._id).toBe(post1._id.toString());
    }));
    test("GET /api/post/search/ai returns 400 when q is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/api/post/search/ai");
        expect(response.status).toBe(400);
    }));
    test("GET /api/post/search/ai handles humanized query with likes and comment threshold", () => __awaiter(void 0, void 0, void 0, function* () {
        const uniqueKeyword = "apisignalzeta";
        const postWithSignals = yield postsModel_1.default.create({
            title: "api-search-test-threshold-hit",
            body: `great travel guide ${uniqueKeyword}`,
            senderID,
            imageUrl: "https://example.com/hit.png",
            date: new Date(),
        });
        const postWithoutEnoughSignals = yield postsModel_1.default.create({
            title: "api-search-test-threshold-miss",
            body: "another travel guide",
            senderID,
            imageUrl: "https://example.com/miss.png",
            date: new Date(Date.now() + 500),
        });
        yield likesModel_1.default.create([
            { postID: postWithSignals._id, senderID: new mongoose_1.default.Types.ObjectId() },
            { postID: postWithSignals._id, senderID: new mongoose_1.default.Types.ObjectId() },
            { postID: postWithSignals._id, senderID: new mongoose_1.default.Types.ObjectId() },
            { postID: postWithoutEnoughSignals._id, senderID: new mongoose_1.default.Types.ObjectId() },
        ]);
        yield commentsModel_1.default.create([
            {
                postID: postWithSignals._id,
                userID: new mongoose_1.default.Types.ObjectId(),
                content: "nice post",
            },
        ]);
        llmResponseText = "not-json";
        const response = yield (0, supertest_1.default)(app).get(`/api/post/search/ai?q=${encodeURIComponent(`please search for posts that contains at least 3 likes and comment and mention "${uniqueKeyword}"`)}`);
        expect(response.status).toBe(200);
        expect(response.body.source).toBe("fallback");
        expect(response.body.total).toBe(1);
        expect(response.body.posts[0]._id).toBe(postWithSignals._id.toString());
    }));
    test("GET /api/post/search/ai rejects non-human strange symbols input", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/api/post/search/ai?q=%40%40%40%20%23%23%23%20!!!");
        expect(response.status).toBe(400);
    }));
    test("GET /api/post/search/ai accepts noisy but human query input", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/api/post/search/ai?q=%20%20PLEASE%20search%20for%20travel!!!%20%20");
        expect(response.status).toBe(200);
    }));
});
//# sourceMappingURL=postsSearch.test.js.map