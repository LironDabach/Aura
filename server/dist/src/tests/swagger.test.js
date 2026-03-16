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
const mongoose_1 = __importDefault(require("mongoose"));
let app;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    jest.setTimeout(20000);
    app = yield (0, index_1.default)();
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connection.close();
}));
describe("Swagger and initApp", () => {
    test("serves swagger spec JSON", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/api-docs.json");
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toMatch(/application\/json/);
        expect(response.body.servers).toEqual([
            expect.objectContaining({ url: "/" }),
        ]);
    }));
    test("initApp rejects when DATABASE_URL is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const originalUrl = process.env.DATABASE_URL;
        process.env.DATABASE_URL = "";
        yield expect((0, index_1.default)()).rejects.toBe("DATABASE_URL is undefined");
        if (originalUrl === undefined) {
            delete process.env.DATABASE_URL;
        }
        else {
            process.env.DATABASE_URL = originalUrl;
        }
    }));
});
//# sourceMappingURL=swagger.test.js.map