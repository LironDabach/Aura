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
const express_1 = __importDefault(require("express"));
const multerRoute_1 = __importDefault(require("../routes/multerRoute"));
let app;
beforeAll(() => {
    app = (0, express_1.default)();
    app.use("/api/upload", express_1.default.static("public/uploads"));
    app.use("/api/upload", multerRoute_1.default);
});
describe("File Tests", () => {
    test("upload file", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = `${__dirname}/aura_test_file.png`;
        const uploadResponse = yield (0, supertest_1.default)(app)
            .post("/api/upload")
            .attach("file", filePath);
        expect(uploadResponse.statusCode).toBe(200);
        expect(uploadResponse.body).toHaveProperty("url");
        const fullUrl = uploadResponse.body.url;
        const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");
        const fetchResponse = yield (0, supertest_1.default)(app).get(relativeUrl);
        expect(fetchResponse.statusCode).toBe(200);
    }));
    // test if username is added to the file name
    test("upload file with username", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = `${__dirname}/aura_test_file.png`;
        const username = "testuser";
        const uploadResponse = yield (0, supertest_1.default)(app)
            .post("/api/upload")
            .field("username", username)
            .attach("file", filePath);
        expect(uploadResponse.statusCode).toBe(200);
        expect(uploadResponse.body).toHaveProperty("url");
        const fullUrl = uploadResponse.body.url;
        const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");
        // Check if the filename contains the username
        expect(relativeUrl).toContain(username);
        const fetchResponse = yield (0, supertest_1.default)(app).get(relativeUrl);
        expect(fetchResponse.statusCode).toBe(200);
    }));
    test("upload file with special characters in name", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = `${__dirname}/aura_test_file...name...with...dots.txt`;
        const username = "testuser";
        const uploadResponse = yield (0, supertest_1.default)(app)
            .post("/api/upload")
            .field("username", username)
            .attach("file", filePath);
        expect(uploadResponse.statusCode).toBe(200);
        expect(uploadResponse.body).toHaveProperty("url");
        const fullUrl = uploadResponse.body.url;
        const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");
        // Check if the filename is sanitized (dots replaced with underscores)
        expect(relativeUrl).toContain("testuser-aura_test_file_name_with_dots");
        const fetchResponse = yield (0, supertest_1.default)(app).get(relativeUrl);
        expect(fetchResponse.statusCode).toBe(200);
    }));
    test("upload file without username", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = `${__dirname}/aura_test_file.png`;
        const uploadResponse = yield (0, supertest_1.default)(app)
            .post("/api/upload")
            .attach("file", filePath);
        expect(uploadResponse.statusCode).toBe(200);
        expect(uploadResponse.body).toHaveProperty("url");
        const fullUrl = uploadResponse.body.url;
        const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");
        // Check if the filename does not contain "undefined"
        expect(relativeUrl).not.toContain("undefined");
        const fetchResponse = yield (0, supertest_1.default)(app).get(relativeUrl);
        expect(fetchResponse.statusCode).toBe(200);
    }));
    test("upload file with empty username", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = `${__dirname}/aura_test_file.png`;
        const uploadResponse = yield (0, supertest_1.default)(app)
            .post("/api/upload")
            .field("username", "")
            .attach("file", filePath);
        expect(uploadResponse.statusCode).toBe(200);
        expect(uploadResponse.body).toHaveProperty("url");
        const fullUrl = uploadResponse.body.url;
        const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");
        // Check if the filename does not contain "undefined"
        expect(relativeUrl).not.toContain("undefined");
        const fetchResponse = yield (0, supertest_1.default)(app).get(relativeUrl);
        expect(fetchResponse.statusCode).toBe(200);
    }));
    test("uplaod file with only special characters in name", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = `${__dirname}/aura_test_file...name...with...dots.txt`;
        const username = "testuser";
        const uploadResponse = yield (0, supertest_1.default)(app)
            .post("/api/upload")
            .field("username", username)
            .attach("file", filePath);
        expect(uploadResponse.statusCode).toBe(200);
        expect(uploadResponse.body).toHaveProperty("url");
        const fullUrl = uploadResponse.body.url;
        const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");
        // Check if the filename is sanitized (dots replaced with underscores)
        expect(relativeUrl).toContain("testuser-aura_test_file_name_with_dots");
        const fetchResponse = yield (0, supertest_1.default)(app).get(relativeUrl);
        expect(fetchResponse.statusCode).toBe(200);
    }));
    test("upload file with no extension", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = `${__dirname}/aura_test_file_no_extension`;
        const username = "testuser";
        const uploadResponse = yield (0, supertest_1.default)(app)
            .post("/api/upload")
            .field("username", username)
            .attach("file", filePath);
        expect(uploadResponse.statusCode).toBe(200);
        expect(uploadResponse.body).toHaveProperty("url");
        const fullUrl = uploadResponse.body.url;
        const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");
        // Check if the filename contains the username and original name without extension
        expect(relativeUrl).toContain("testuser-aura_test_file_no_extension");
        const fetchResponse = yield (0, supertest_1.default)(app).get(relativeUrl);
        expect(fetchResponse.statusCode).toBe(200);
    }));
    test("upload file with multiple dots in name", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = `${__dirname}/aura_test_file...name...with...multiple...dots.txt`;
        const username = "testuser";
        const uploadResponse = yield (0, supertest_1.default)(app)
            .post("/api/upload")
            .field("username", username)
            .attach("file", filePath);
        expect(uploadResponse.statusCode).toBe(200);
        expect(uploadResponse.body).toHaveProperty("url");
        const fullUrl = uploadResponse.body.url;
        const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");
        // Check if the filename is sanitized (dots replaced with underscores)
        expect(relativeUrl).toContain("testuser-aura_test_file_name_with_multiple_dots");
        const fetchResponse = yield (0, supertest_1.default)(app).get(relativeUrl);
        expect(fetchResponse.statusCode).toBe(200);
    }));
    test("upload file with special username characters", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = `${__dirname}/aura_test_file.png`;
        const username = "testuser!@#$%^&*()";
        const uploadResponse = yield (0, supertest_1.default)(app)
            .post("/api/upload")
            .field("username", username)
            .attach("file", filePath);
        expect(uploadResponse.statusCode).toBe(200);
        expect(uploadResponse.body).toHaveProperty("url");
        const fullUrl = uploadResponse.body.url;
        const relativeUrl = fullUrl.replace(/^.*\/\/[^/]+/, "");
        // Check if the filename is sanitized (special characters replaced with underscores)
        expect(relativeUrl).toContain("testuser____________________");
        const fetchResponse = yield (0, supertest_1.default)(app).get(relativeUrl);
        expect(fetchResponse.statusCode).toBe(200);
    }));
});
//# sourceMappingURL=multer.test.js.map