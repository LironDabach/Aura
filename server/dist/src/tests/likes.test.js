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
const likesModel_1 = __importDefault(require("../models/likesModel"));
const postsModel_1 = __importDefault(require("../models/postsModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
jest.setTimeout(30000);
let app;
let authToken;
let otherAuthToken;
const userId = new mongoose_1.default.Types.ObjectId().toString();
const otherUserId = new mongoose_1.default.Types.ObjectId().toString();
let createdPostId;
let createdLikeId;
let createdNoLikesPostId;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    app = yield (0, index_1.default)();
    const createdPost = yield postsModel_1.default.create({
        title: "Post for likes",
        body: "Seed post body",
        senderID: userId,
        imageUrl: "https://example.com/like-seed.png",
    });
    createdPostId = createdPost._id.toString();
    const secret = process.env.JWT_SECRET || "default_secret";
    authToken = jsonwebtoken_1.default.sign({ _id: userId }, secret, { expiresIn: "1h" });
    otherAuthToken = jsonwebtoken_1.default.sign({ _id: otherUserId }, secret, { expiresIn: "1h" });
}), 30000);
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    if (createdLikeId) {
        yield likesModel_1.default.deleteMany({ _id: createdLikeId });
    }
    const postIds = [createdPostId, createdNoLikesPostId].filter(Boolean);
    if (postIds.length > 0) {
        yield postsModel_1.default.deleteMany({ _id: { $in: postIds } });
    }
    yield mongoose_1.default.connection.close();
}));
describe("Likes API", () => {
    // ── POST /api/like/post/:postID ──
    test("like requires authentication", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post(`/api/like/post/${createdPostId}`)
            .send({});
        expect(response.status).toBe(401);
    }));
    test("creates a like for a post", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post(`/api/like/post/${createdPostId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({});
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("_id");
        expect(response.body.postID).toBe(createdPostId);
        expect(response.body.senderID).toBe(userId);
        expect(response.body).toHaveProperty("date");
        createdLikeId = response.body._id;
    }));
    // ── GET /api/like/post/:postID ──
    test("returns empty likes list for a post with no likes", () => __awaiter(void 0, void 0, void 0, function* () {
        const createdOtherPost = yield postsModel_1.default.create({
            title: "Post without likes",
            body: "No likes yet",
            senderID: userId,
            imageUrl: "https://example.com/no-likes-seed.png",
        });
        createdNoLikesPostId = createdOtherPost._id.toString();
        const response = yield (0, supertest_1.default)(app).get(`/api/like/post/${createdOtherPost._id.toString()}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    }));
    test("gets all likes for a specific post", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get(`/api/like/post/${createdPostId}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach((like) => {
            expect(like.postID).toBe(createdPostId);
            expect(typeof like.date).toBe("string");
        });
    }));
    // ── DELETE /api/like/post/:postID ──
    test("unlike requires authentication", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).delete(`/api/like/post/${createdPostId}`);
        expect(response.status).toBe(401);
    }));
    test("unlike returns 404 when user has no like on the post", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .delete(`/api/like/post/${createdPostId}`)
            .set("Authorization", `Bearer ${otherAuthToken}`);
        expect(response.status).toBe(404);
    }));
    test("unlike removes the like for the authenticated user", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .delete(`/api/like/post/${createdPostId}`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(response.status).toBe(200);
        // Verify it was actually deleted
        const likesResponse = yield (0, supertest_1.default)(app).get(`/api/like/post/${createdPostId}`);
        expect(likesResponse.body.length).toBe(0);
    }));
});
//# sourceMappingURL=likes.test.js.map