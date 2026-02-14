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
const likesRoute_1 = __importDefault(require("../routes/likesRoute"));
const likesController_1 = __importDefault(require("../controllers/likesController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
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
let createdOtherLikeId;
let createdNoLikesPostId;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    app = yield (0, index_1.default)();
    // Keep this test aligned with other suites: initialize app once and seed DB data.
    app.use("/like", likesRoute_1.default);
    app.post("/like", authMiddleware_1.authenticate, likesController_1.default.create.bind(likesController_1.default));
    app.put("/like/:id", authMiddleware_1.authenticate, likesController_1.default.update.bind(likesController_1.default));
    app.delete("/like/:id", authMiddleware_1.authenticate, likesController_1.default.del.bind(likesController_1.default));
    const createdPost = yield postsModel_1.default.create({
        title: "Post for likes",
        body: "Seed post body",
        senderID: userId,
    });
    createdPostId = createdPost._id.toString();
    const secret = process.env.JWT_SECRET || "default_secret";
    authToken = jsonwebtoken_1.default.sign({ _id: userId }, secret, { expiresIn: "1h" });
    otherAuthToken = jsonwebtoken_1.default.sign({ _id: otherUserId }, secret, { expiresIn: "1h" });
}), 30000);
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    const likeIds = [createdLikeId, createdOtherLikeId].filter(Boolean);
    if (likeIds.length > 0) {
        yield likesModel_1.default.deleteMany({ _id: { $in: likeIds } });
    }
    const postIds = [createdPostId, createdNoLikesPostId].filter(Boolean);
    if (postIds.length > 0) {
        yield postsModel_1.default.deleteMany({ _id: { $in: postIds } });
    }
    yield mongoose_1.default.connection.close();
}));
describe("Likes CRUD API", () => {
    test("create requires authentication", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/like").send({
            postID: createdPostId,
            senderID: userId,
        });
        expect(response.status).toBe(401);
    }));
    test("create by post id requires authentication", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(`/like/post/${createdPostId}`).send({
            senderID: userId,
        });
        expect(response.status).toBe(401);
    }));
    test("creates a like", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post("/like")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            postID: createdPostId,
            senderID: userId,
        });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("_id");
        expect(response.body.postID).toBe(createdPostId);
        createdLikeId = response.body._id;
    }));
    test("creates a like by post id route", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post(`/like/post/${createdPostId}`)
            .set("Authorization", `Bearer ${otherAuthToken}`)
            .send({
            postID: new mongoose_1.default.Types.ObjectId().toString(),
            senderID: otherUserId,
        });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("_id");
        expect(response.body.postID).toBe(createdPostId);
        createdOtherLikeId = response.body._id;
    }));
    test("returns empty likes list for a post with no likes", () => __awaiter(void 0, void 0, void 0, function* () {
        const createdOtherPost = yield postsModel_1.default.create({
            title: "Post without likes",
            body: "No likes yet",
            senderID: userId,
        });
        createdNoLikesPostId = createdOtherPost._id.toString();
        const response = yield (0, supertest_1.default)(app).get(`/like/post/${createdOtherPost._id.toString()}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    }));
    test("gets all likes for a specific post", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get(`/like/post/${createdPostId}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach((like) => {
            expect(like.postID).toBe(createdPostId);
        });
    }));
    test("create fails when senderID is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post("/like")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            postID: createdPostId,
        });
        expect(response.status).toBe(500);
    }));
    test("update requires authentication", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .put(`/like/${createdLikeId}`)
            .send({ postID: createdPostId });
        expect(response.status).toBe(401);
    }));
    test("update returns 404 when like is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const missingId = new mongoose_1.default.Types.ObjectId().toString();
        const response = yield (0, supertest_1.default)(app)
            .put(`/like/${missingId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({ postID: createdPostId });
        expect(response.status).toBe(404);
    }));
    test("update returns 500 when owner field is unavailable", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .put(`/like/${createdLikeId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({ postID: createdPostId });
        expect(response.status).toBe(500);
    }));
    test("delete returns 404 when like is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const missingId = new mongoose_1.default.Types.ObjectId().toString();
        const response = yield (0, supertest_1.default)(app)
            .delete(`/like/${missingId}`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(response.status).toBe(404);
    }));
    test("delete returns 500 when owner field is unavailable", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .delete(`/like/${createdLikeId}`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(response.status).toBe(500);
    }));
    test("delete requires authentication", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).delete(`/like/${createdLikeId}`);
        expect(response.status).toBe(401);
    }));
    test("delete by post id requires authentication", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).delete(`/like/post/${createdPostId}`);
        expect(response.status).toBe(401);
    }));
    test("delete by post id returns 404 when like for user is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .delete(`/like/post/${createdPostId}`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(response.status).toBe(404);
    }));
});
//# sourceMappingURL=likes.test.js.map