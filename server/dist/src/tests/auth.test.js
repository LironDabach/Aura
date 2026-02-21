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
const usersModel_1 = __importDefault(require("../models/usersModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const mongoose_1 = __importDefault(require("mongoose"));
let app;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    jest.setTimeout(20000);
    app = yield (0, index_1.default)();
    yield usersModel_1.default.deleteMany({});
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield usersModel_1.default.deleteMany({});
    yield mongoose_1.default.connection.close();
}));
describe("Auth API", () => {
    const runId = Date.now().toString();
    const username = `shiranlevi${runId}`;
    const email = `liron.dabach3+${runId}@gmail.com`;
    const password = "StrongPass123!";
    let registerRefreshToken;
    let loginRefreshToken;
    let loginAccessToken;
    let refreshedRefreshToken;
    let usedSecret;
    beforeAll(() => {
        usedSecret = process.env.JWT_SECRET || "";
    });
    test("register requires username, email and password", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/api/auth/register").send({
            username,
            email,
        });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
    }));
    test("registers a user and returns tokens", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/api/auth/register").send({
            username,
            email,
            password,
        });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("token");
        expect(response.body).toHaveProperty("refreshToken");
        registerRefreshToken = response.body.refreshToken;
        const user = yield usersModel_1.default.findOne({ username, email });
        expect(user).not.toBeNull();
        expect(user === null || user === void 0 ? void 0 : user.refreshTokens).toContain(registerRefreshToken);
    }));
    test("register fails when JWT_SECRET is missing and process.exit is called", () => __awaiter(void 0, void 0, void 0, function* () {
        const originalSecret = process.env.JWT_SECRET;
        const exitSpy = jest.spyOn(process, "exit").mockImplementation((() => {
            throw new Error("process.exit called");
        }));
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
        delete process.env.JWT_SECRET;
        const response = yield (0, supertest_1.default)(app)
            .post("/api/auth/register")
            .send({
            username: `${username}nosecret`,
            email: `nosecret.${runId}@example.com`,
            password,
        });
        expect(response.status).toBe(500);
        expect(errorSpy).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalled();
        if (originalSecret !== undefined) {
            process.env.JWT_SECRET = originalSecret;
        }
        exitSpy.mockRestore();
        errorSpy.mockRestore();
    }));
    test("login requires username and password", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/api/auth/login").send({
            username,
        });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
    }));
    test("login fails when user is not found", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post("/api/auth/login")
            .send({
            username: `${username}missing`,
            password,
        });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message");
    }));
    test("logs in a user and returns new tokens", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/api/auth/login").send({
            username,
            password,
        });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("token");
        expect(response.body).toHaveProperty("refreshToken");
        loginAccessToken = response.body.token;
        loginRefreshToken = response.body.refreshToken;
        expect(loginRefreshToken).not.toBe(registerRefreshToken);
        const user = yield usersModel_1.default.findOne({ username, email });
        expect(user).not.toBeNull();
        expect(user === null || user === void 0 ? void 0 : user.refreshTokens).toContain(registerRefreshToken);
        expect(user === null || user === void 0 ? void 0 : user.refreshTokens).toContain(loginRefreshToken);
    }));
    test("login fails with invalid password", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/api/auth/login").send({
            username,
            password: "WrongPass123!",
        });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message");
    }));
    test("login returns 500 when model throws", () => __awaiter(void 0, void 0, void 0, function* () {
        const findOneSpy = jest
            .spyOn(usersModel_1.default, "findOne")
            .mockRejectedValueOnce(new Error("db error"));
        const response = yield (0, supertest_1.default)(app).post("/api/auth/login").send({
            username,
            password,
        });
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty("message");
        findOneSpy.mockRestore();
    }));
    test("trying creating a post without token fails", () => __awaiter(void 0, void 0, void 0, function* () {
        const postData = {
            title: "Unauthorized Post",
            content: "This should fail.",
        };
        const invakidToken = loginAccessToken + "invalid";
        const response = yield (0, supertest_1.default)(app)
            .post("/api/post")
            .set("Authorization", `Bearer ${invakidToken}`)
            .send(postData);
        expect(response.status).toBe(401);
    }));
    test("missing Authorization header returns 401", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/api/post").send({
            title: "No auth header",
            content: "Should fail",
        });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message");
    }));
    test("missing bearer token returns 401", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post("/api/post")
            .set("Authorization", "Bearer ")
            .send({
            title: "No token",
            content: "Should fail",
        });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message");
    }));
    test("authenticate returns 401 when Bearer token is empty", () => {
        const req = { headers: { authorization: "Bearer " } };
        const res = {
            status: jest.fn().mockReturnValue({ json: jest.fn() }),
        };
        const next = jest.fn();
        (0, authMiddleware_1.authenticate)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });
    test("refreshes token and rotates refresh token", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/api/auth/refresh-token").send({
            refreshToken: loginRefreshToken,
        });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("token");
        expect(response.body).toHaveProperty("refreshToken");
        refreshedRefreshToken = response.body.refreshToken;
        expect(refreshedRefreshToken).not.toBe(loginRefreshToken);
        const user = yield usersModel_1.default.findOne({ username, email });
        expect(user).not.toBeNull();
        expect(user === null || user === void 0 ? void 0 : user.refreshTokens).toContain(refreshedRefreshToken);
        expect(user === null || user === void 0 ? void 0 : user.refreshTokens).not.toContain(loginRefreshToken);
    }));
    test("logout revokes refresh token", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/api/auth/logout").send({
            refreshToken: refreshedRefreshToken,
        });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("message");
        const user = yield usersModel_1.default.findOne({ username, email });
        expect(user).not.toBeNull();
        expect(user === null || user === void 0 ? void 0 : user.refreshTokens).not.toContain(refreshedRefreshToken);
        const refreshAttempt = yield (0, supertest_1.default)(app)
            .post("/api/auth/refresh-token")
            .send({ refreshToken: refreshedRefreshToken });
        expect(refreshAttempt.status).toBe(401);
    }));
    test("logout requires refresh token", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/api/auth/logout").send({});
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
    }));
    test("logout fails when token points to missing user", () => __awaiter(void 0, void 0, void 0, function* () {
        const fakeToken = jsonwebtoken_1.default.sign({ _id: "000000000000000000000000" }, usedSecret, { expiresIn: "1h" });
        const response = yield (0, supertest_1.default)(app).post("/api/auth/logout").send({
            refreshToken: fakeToken,
        });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message");
    }));
    test("logout returns 500 for malformed refresh token", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/api/auth/logout").send({
            refreshToken: "not-a-jwt",
        });
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty("message");
    }));
    test("refresh token requires refresh token", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/api/auth/refresh-token").send({});
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
    }));
    test("refresh token fails when token points to missing user", () => __awaiter(void 0, void 0, void 0, function* () {
        const fakeToken = jsonwebtoken_1.default.sign({ _id: "000000000000000000000000" }, usedSecret, { expiresIn: "1h" });
        const response = yield (0, supertest_1.default)(app).post("/api/auth/refresh-token").send({
            refreshToken: fakeToken,
        });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message");
    }));
    test("refresh token returns 401 for malformed token", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/api/auth/refresh-token").send({
            refreshToken: "not-a-jwt",
        });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message");
    }));
    test("tokens verify with .env.development JWT_SECRET and fail with a wrong secret", () => {
        expect(usedSecret).toBeTruthy();
        const accessPayload = jsonwebtoken_1.default.verify(loginAccessToken, usedSecret);
        const refreshPayload = jsonwebtoken_1.default.verify(refreshedRefreshToken, usedSecret);
        expect(accessPayload._id).toBeTruthy();
        expect(refreshPayload._id).toBeTruthy();
        const wrongSecret = `${usedSecret}_wrong`;
        expect(() => jsonwebtoken_1.default.verify(loginAccessToken, wrongSecret)).toThrow();
        expect(() => jsonwebtoken_1.default.verify(refreshedRefreshToken, wrongSecret)).toThrow();
    });
});
//# sourceMappingURL=auth.test.js.map