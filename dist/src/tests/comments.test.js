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
const commentsModel_1 = __importDefault(require("../models/commentsModel"));
const postsModel_1 = __importDefault(require("../models/postsModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let app;
let authToken;
let otherAuthToken;
const userId = new mongoose_1.default.Types.ObjectId().toString();
const otherUserId = new mongoose_1.default.Types.ObjectId().toString();
let createdPostId;
let createdCommentId;
let createdOtherCommentId;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    jest.setTimeout(20000);
    app = yield (0, index_1.default)();
    const createdPost = yield postsModel_1.default.create({
        title: "Post for comments",
        body: "Seed post body",
        senderID: userId,
    });
    createdPostId = createdPost._id.toString();
    const secret = process.env.JWT_SECRET || "default_secret";
    authToken = jsonwebtoken_1.default.sign({ _id: userId }, secret, { expiresIn: "1h" });
    otherAuthToken = jsonwebtoken_1.default.sign({ _id: otherUserId }, secret, { expiresIn: "1h" });
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    const commentIds = [createdCommentId, createdOtherCommentId].filter(Boolean);
    if (commentIds.length > 0) {
        yield commentsModel_1.default.deleteMany({ _id: { $in: commentIds } });
    }
    if (createdPostId) {
        yield postsModel_1.default.findByIdAndDelete(createdPostId);
    }
    yield mongoose_1.default.connection.close();
}));
describe("Comments By Post ID API", () => {
    test("create by post id requires authentication", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(`/comment/post/${createdPostId}`).send({
            content: "No auth comment",
        });
        expect(response.status).toBe(401);
    }));
    test("creates a comment by post id route", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post(`/comment/post/${createdPostId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            postID: new mongoose_1.default.Types.ObjectId().toString(),
            userID: otherUserId,
            content: "Comment by post route",
        });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("_id");
        expect(response.body.postID).toBe(createdPostId);
        expect(response.body.userID).toBe(userId);
        createdCommentId = response.body._id;
    }));
    test("create by post id uses authenticated user id over body userID", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
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
        createdOtherCommentId = response.body._id;
    }));
    test("gets comments by post id route", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get(`/comment/post/${createdPostId}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach((comment) => {
            expect(comment.postID).toBe(createdPostId);
        });
    }));
    test("update by post id requires authentication", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .put(`/comment/post/${createdPostId}/${createdCommentId}`)
            .send({ content: "No auth update" });
        expect(response.status).toBe(401);
    }));
    test("updates a comment by post id", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .put(`/comment/post/${createdPostId}/${createdCommentId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({ content: "Updated comment" });
        expect(response.status).toBe(200);
        expect(response.body.content).toBe("Updated comment");
    }));
    test("update by post id returns 404 when comment is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const missingId = new mongoose_1.default.Types.ObjectId().toString();
        const response = yield (0, supertest_1.default)(app)
            .put(`/comment/post/${createdPostId}/${missingId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({ content: "Nope" });
        expect(response.status).toBe(404);
    }));
    test("update by post id is forbidden when not creator", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .put(`/comment/post/${createdPostId}/${createdCommentId}`)
            .set("Authorization", `Bearer ${otherAuthToken}`)
            .send({ content: "Should fail" });
        expect(response.status).toBe(403);
    }));
    test("update by post id rejects changing user or post", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .put(`/comment/post/${createdPostId}/${createdCommentId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            userID: otherUserId,
            postID: new mongoose_1.default.Types.ObjectId().toString(),
            content: "Attempt change",
        });
        expect(response.status).toBe(400);
    }));
    test("delete by post id requires authentication", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).delete(`/comment/post/${createdPostId}/${createdCommentId}`);
        expect(response.status).toBe(401);
    }));
    test("delete by post id returns 404 when comment is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const missingId = new mongoose_1.default.Types.ObjectId().toString();
        const response = yield (0, supertest_1.default)(app)
            .delete(`/comment/post/${createdPostId}/${missingId}`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(response.status).toBe(404);
    }));
    test("delete by post id is forbidden when not creator", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .delete(`/comment/post/${createdPostId}/${createdCommentId}`)
            .set("Authorization", `Bearer ${otherAuthToken}`);
        expect(response.status).toBe(403);
    }));
    test("deletes a comment by post id route", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .delete(`/comment/post/${createdPostId}/${createdCommentId}`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(response.status).toBe(200);
        const check = yield (0, supertest_1.default)(app).get(`/comment/post/${createdPostId}`);
        expect(check.status).toBe(200);
        const ids = check.body.map((comment) => comment._id);
        expect(ids).not.toContain(createdCommentId);
    }));
});
//# sourceMappingURL=comments.test.js.map