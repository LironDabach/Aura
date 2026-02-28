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
const mongoose_1 = __importDefault(require("mongoose"));
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
let app;
const uploadedUrls = [];
const trackUpload = (url) => {
    uploadedUrls.push(url);
    return url;
};
const toRelativeUrl = (fullUrl) => fullUrl.replace(/^.*\/\/[^/]+/, "");
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    jest.setTimeout(20000);
    app = yield (0, index_1.default)();
    yield usersModel_1.default.deleteMany({});
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    for (const url of uploadedUrls) {
        yield (0, uploadMiddleware_1.deleteUploadedFileByUrl)(url);
    }
    yield usersModel_1.default.deleteMany({});
    yield mongoose_1.default.connection.close();
}));
describe("Users CRUD API with multer", () => {
    test("creates user with profilePicture upload", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = `${__dirname}/aura_test_file.png`;
        const response = yield (0, supertest_1.default)(app)
            .post("/api/user")
            .field("username", "multer_user_1")
            .field("email", "multer_user_1@example.com")
            .field("password", "StrongPass123!")
            .attach("file", filePath);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("_id");
        expect(response.body).toHaveProperty("profilePicture");
        expect(response.body.profilePicture).toContain("/api/upload/");
        expect(response.body).not.toHaveProperty("password");
        expect(response.body).not.toHaveProperty("refreshTokens");
        const imageUrl = trackUpload(response.body.profilePicture);
        const fetchResponse = yield (0, supertest_1.default)(app).get(toRelativeUrl(imageUrl));
        expect(fetchResponse.status).toBe(200);
    }));
    test("update replaces profilePicture and deletes old file", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = `${__dirname}/aura_test_file.png`;
        const createResponse = yield (0, supertest_1.default)(app)
            .post("/api/user")
            .field("username", "multer_user_2")
            .field("email", "multer_user_2@example.com")
            .field("password", "StrongPass123!")
            .attach("file", filePath);
        expect(createResponse.status).toBe(201);
        const userId = createResponse.body._id;
        const oldUrl = trackUpload(createResponse.body.profilePicture);
        const secret = process.env.JWT_SECRET || "default_secret";
        const token = jsonwebtoken_1.default.sign({ _id: userId }, secret, { expiresIn: "1h" });
        const newFilePath = `${__dirname}/aura_test_file.png`;
        const updateResponse = yield (0, supertest_1.default)(app)
            .put(`/api/user/${userId}`)
            .set("Authorization", `Bearer ${token}`)
            .attach("file", newFilePath);
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.profilePicture).toContain("/api/upload/");
        expect(updateResponse.body.profilePicture).not.toBe(oldUrl);
        const newUrl = trackUpload(updateResponse.body.profilePicture);
        const oldFetch = yield (0, supertest_1.default)(app).get(toRelativeUrl(oldUrl));
        expect(oldFetch.status).toBe(404);
        const newFetch = yield (0, supertest_1.default)(app).get(toRelativeUrl(newUrl));
        expect(newFetch.status).toBe(200);
    }));
    test("update is forbidden for non-owner token", () => __awaiter(void 0, void 0, void 0, function* () {
        const createResponse = yield (0, supertest_1.default)(app)
            .post("/api/user")
            .field("username", "multer_user_3")
            .field("email", "multer_user_3@example.com")
            .field("password", "StrongPass123!");
        expect(createResponse.status).toBe(201);
        const userId = createResponse.body._id;
        const secret = process.env.JWT_SECRET || "default_secret";
        const token = jsonwebtoken_1.default.sign({ _id: new mongoose_1.default.Types.ObjectId().toString() }, secret, {
            expiresIn: "1h",
        });
        const updateResponse = yield (0, supertest_1.default)(app)
            .put(`/api/user/${userId}`)
            .set("Authorization", `Bearer ${token}`)
            .field("username", "should_fail");
        expect(updateResponse.status).toBe(403);
    }));
    test("delete removes profilePicture file", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = `${__dirname}/aura_test_file.png`;
        const createResponse = yield (0, supertest_1.default)(app)
            .post("/api/user")
            .field("username", "multer_user_4")
            .field("email", "multer_user_4@example.com")
            .field("password", "StrongPass123!")
            .attach("file", filePath);
        expect(createResponse.status).toBe(201);
        const userId = createResponse.body._id;
        const imageUrl = trackUpload(createResponse.body.profilePicture);
        const secret = process.env.JWT_SECRET || "default_secret";
        const token = jsonwebtoken_1.default.sign({ _id: userId }, secret, { expiresIn: "1h" });
        const deleteResponse = yield (0, supertest_1.default)(app)
            .delete(`/api/user/${userId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(deleteResponse.status).toBe(200);
        const fetchResponse = yield (0, supertest_1.default)(app).get(toRelativeUrl(imageUrl));
        expect(fetchResponse.status).toBe(404);
    }));
    test("delete is forbidden for non-owner token", () => __awaiter(void 0, void 0, void 0, function* () {
        const createResponse = yield (0, supertest_1.default)(app)
            .post("/api/user")
            .field("username", "multer_user_5")
            .field("email", "multer_user_5@example.com")
            .field("password", "StrongPass123!");
        expect(createResponse.status).toBe(201);
        const userId = createResponse.body._id;
        const secret = process.env.JWT_SECRET || "default_secret";
        const token = jsonwebtoken_1.default.sign({ _id: new mongoose_1.default.Types.ObjectId().toString() }, secret, {
            expiresIn: "1h",
        });
        const deleteResponse = yield (0, supertest_1.default)(app)
            .delete(`/api/user/${userId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(deleteResponse.status).toBe(403);
    }));
    test("creating user without file should succeed without profilePicture", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post("/api/user")
            .field("username", "multer_user_6")
            .field("email", "multer_user_6@example.com")
            .field("password", "StrongPass123!");
        expect(response.status).toBe(201);
        expect(response.body.profilePicture).toBeUndefined();
    }));
    test("creating user with non-file field should fail", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post("/api/user")
            .field("username", "multer_user_7")
            .field("email", "multer_user_7@example.com")
            .field("password", "StrongPass123!")
            .field("nonFileField", "should_fail");
        expect(response.status).toBe(400);
    }));
    test("creating user with invalid file field should fail", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post("/api/user")
            .field("username", "multer_user_8")
            .field("email", "multer_user_8@example.com")
            .field("password", "StrongPass123!")
            .field("file", "should_fail");
        expect(response.status).toBe(400);
    }));
    test("creating user with unsupported file type should fail", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = `${__dirname}/aura_test_file...name...with...dots.txt`;
        const response = yield (0, supertest_1.default)(app)
            .post("/api/user")
            .field("username", "multer_user_9")
            .field("email", "multer_user_9@example.com")
            .field("password", "StrongPass123!")
            .attach("file", filePath);
        expect(response.status).toBe(400);
    }));
    test("creating user with file but missing required fields should fail", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = `${__dirname}/aura_test_file.png`;
        const response = yield (0, supertest_1.default)(app)
            .post("/api/user")
            .attach("file", filePath);
        expect(response.status).toBe(400);
    }));
    test("creating user with file but invalid email should fail", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = `${__dirname}/aura_test_file.png`;
        const response = yield (0, supertest_1.default)(app)
            .post("/api/user")
            .field("username", "multer_user_10")
            .field("email", "invalid_email")
            .field("password", "StrongPass123!")
            .attach("file", filePath);
        expect(response.status).toBe(400);
    }));
});
//# sourceMappingURL=users.test.js.map