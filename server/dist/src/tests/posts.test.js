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
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const baseController_1 = __importDefault(require("../controllers/baseController"));
let app;
let authToken;
let otherAuthToken;
const userId = new mongoose_1.default.Types.ObjectId().toString();
const otherUserId = new mongoose_1.default.Types.ObjectId().toString();
let createdPostId;
let createdOtherPostId;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    jest.setTimeout(20000);
    app = yield (0, index_1.default)();
    const secret = process.env.JWT_SECRET || "default_secret";
    authToken = jsonwebtoken_1.default.sign({ _id: userId }, secret, { expiresIn: "1h" });
    otherAuthToken = jsonwebtoken_1.default.sign({ _id: otherUserId }, secret, { expiresIn: "1h" });
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield postsModel_1.default.deleteMany({ senderID: { $in: [userId, otherUserId] } });
    yield mongoose_1.default.connection.close();
}));
describe("Posts CRUD API", () => {
    test("creates a post", () => __awaiter(void 0, void 0, void 0, function* () {
        const beforeCreate = Date.now();
        const response = yield (0, supertest_1.default)(app)
            .post("/api/post")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            title: "First post",
            body: "Hello from tests",
            senderID: userId,
            date: "2000-01-01T00:00:00.000Z",
        });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("_id");
        expect(response.body.title).toBe("First post");
        expect(response.body).toHaveProperty("date");
        expect(Number.isNaN(Date.parse(response.body.date))).toBe(false);
        expect(new Date(response.body.date).getTime()).toBeGreaterThanOrEqual(beforeCreate);
        createdPostId = response.body._id;
    }));
    test("create uses authenticated user id over body senderID", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post("/api/post")
            .set("Authorization", `Bearer ${otherAuthToken}`)
            .send({
            title: "Other post",
            body: "Other body",
            senderID: userId,
        });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("_id");
        expect(response.body.senderID).toBe(otherUserId);
        createdOtherPostId = response.body._id;
    }));
    test("gets all posts", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/api/post");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("posts");
        expect(Array.isArray(response.body.posts)).toBe(true);
        expect(response.body.posts.length).toBeGreaterThan(0);
    }));
    test("gets a post by id", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get(`/api/post/${createdPostId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("_id", createdPostId);
    }));
    test("gets posts by user id", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get(`/api/post/user/${userId}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach((post) => {
            expect(post.senderID).toBe(userId);
        });
    }));
    test("gets posts by user id returns empty array for user without posts", () => __awaiter(void 0, void 0, void 0, function* () {
        const noPostsUserId = new mongoose_1.default.Types.ObjectId().toString();
        const response = yield (0, supertest_1.default)(app).get(`/api/post/user/${noPostsUserId}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(0);
    }));
    test("updates a post", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .put(`/api/post/${createdPostId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({
            title: "Updated post",
            body: "Updated body",
        });
        expect(response.status).toBe(200);
        expect(response.body.title).toBe("Updated post");
    }));
    test("update returns 404 when post is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const missingId = new mongoose_1.default.Types.ObjectId().toString();
        const response = yield (0, supertest_1.default)(app)
            .put(`/api/post/${missingId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({ title: "Nope" });
        expect(response.status).toBe(404);
    }));
    test("update rejects changing the creator", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .put(`/api/post/${createdPostId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({ senderID: otherUserId, title: "Attempt change" });
        expect(response.status).toBe(400);
    }));
    test("update rejects changing the post date", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .put(`/api/post/${createdPostId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({ date: "2030-01-01T00:00:00.000Z", title: "Attempt date change" });
        expect(response.status).toBe(400);
    }));
    test("update is forbidden when not creator", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .put(`/api/post/${createdPostId}`)
            .set("Authorization", `Bearer ${otherAuthToken}`)
            .send({ title: "Should fail" });
        expect(response.status).toBe(403);
    }));
    test("update returns 500 when model throws", () => __awaiter(void 0, void 0, void 0, function* () {
        const findByIdSpy = jest
            .spyOn(postsModel_1.default, "findById")
            .mockRejectedValueOnce(new Error("db"));
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
        const response = yield (0, supertest_1.default)(app)
            .put(`/api/post/${createdPostId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({ title: "Trigger error" });
        expect(response.status).toBe(500);
        findByIdSpy.mockRestore();
        errorSpy.mockRestore();
    }));
    test("delete is forbidden when not creator", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .delete(`/api/post/${createdPostId}`)
            .set("Authorization", `Bearer ${otherAuthToken}`);
        expect(response.status).toBe(403);
    }));
    test("delete returns 404 when post is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const missingId = new mongoose_1.default.Types.ObjectId().toString();
        const response = yield (0, supertest_1.default)(app)
            .delete(`/api/post/${missingId}`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(response.status).toBe(404);
    }));
    test("deletes a post", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .delete(`/api/post/${createdPostId}`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(response.status).toBe(200);
        const check = yield (0, supertest_1.default)(app).get(`/api/post/${createdPostId}`);
        expect(check.status).toBe(404);
    }));
});
describe("BaseController error handling", () => {
    const makeRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.send = jest.fn().mockReturnValue(res);
        return res;
    };
    test("getAll uses model.find without query when query is undefined", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { find: jest.fn().mockResolvedValue([{ id: 1 }]) };
        const controller = new baseController_1.default(model);
        const req = { query: undefined };
        const res = makeRes();
        yield controller.getAll(req, res);
        expect(model.find).toHaveBeenCalledWith();
        expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
    }));
    test("getAll returns 500 when model.find throws", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { find: jest.fn().mockRejectedValue(new Error("db")) };
        const controller = new baseController_1.default(model);
        const req = { query: { foo: "bar" } };
        const res = makeRes();
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
        yield controller.getAll(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error: Can't retrieve entities");
        errorSpy.mockRestore();
    }));
    test("getById returns 500 when model.findById throws", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { findById: jest.fn().mockRejectedValue(new Error("db")) };
        const controller = new baseController_1.default(model);
        const req = { params: { id: "123" } };
        const res = makeRes();
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
        yield controller.getById(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error: Can't retrieve Entity by ID");
        errorSpy.mockRestore();
    }));
    test("create returns 500 when model.create throws", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = { create: jest.fn().mockRejectedValue(new Error("db")) };
        const controller = new baseController_1.default(model);
        const req = { params: {}, body: { title: "x" } };
        const res = makeRes();
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
        yield controller.create(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error: Can't create entity");
        errorSpy.mockRestore();
    }));
    test("del returns 500 when model.findByIdAndDelete throws", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = {
            findByIdAndDelete: jest.fn().mockRejectedValue(new Error("db")),
        };
        const controller = new baseController_1.default(model);
        const req = { params: { id: "123" } };
        const res = makeRes();
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
        yield controller.del(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error: Can't delete entity");
        errorSpy.mockRestore();
    }));
    test("update returns 500 when model.findByIdAndUpdate throws", () => __awaiter(void 0, void 0, void 0, function* () {
        const model = {
            findByIdAndUpdate: jest.fn().mockRejectedValue(new Error("db")),
        };
        const controller = new baseController_1.default(model);
        const req = { params: { id: "123" }, body: { title: "x" } };
        const res = makeRes();
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
        yield controller.update(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Error: Can't update entity");
        errorSpy.mockRestore();
    }));
});
//# sourceMappingURL=posts.test.js.map