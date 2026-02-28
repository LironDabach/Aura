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
const llmService_1 = require("../services/llmService");
describe("LlmService", () => {
    let server;
    let baseUrl;
    let behavior;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        behavior = () => ({
            status: 200,
            payload: { response: '{"postIds":[]}' },
        });
        server = http_1.default.createServer((req, res) => {
            let raw = "";
            req.on("data", (chunk) => {
                raw += chunk.toString();
            });
            req.on("end", () => {
                const parsedBody = raw ? JSON.parse(raw) : {};
                const result = behavior(req, parsedBody);
                setTimeout(() => {
                    res.statusCode = result.status;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify(result.payload));
                }, result.delayMs || 0);
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
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield new Promise((resolve) => server.close(() => resolve()));
    }));
    test("sends request with basic auth and returns response", () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.LLM_BASE_URL = baseUrl;
        process.env.LLM_USER = "student1";
        process.env.LLM_PASS = "pass123";
        process.env.LLM_MODEL = "llama3.1:8b";
        let receivedAuthHeader = "";
        let receivedBody = null;
        behavior = (req, body) => {
            receivedAuthHeader = req.headers.authorization || "";
            receivedBody = body;
            return {
                status: 200,
                payload: { response: '{"postIds":["1","2"]}', done: true },
            };
        };
        const service = new llmService_1.LlmService();
        const response = yield service.generate({
            prompt: "rank this",
            format: "json",
            options: { temperature: 0.1 },
        });
        expect(response.response).toBe('{"postIds":["1","2"]}');
        expect(receivedAuthHeader).toBe(`Basic ${Buffer.from("student1:pass123").toString("base64")}`);
        expect(receivedBody.model).toBe("llama3.1:8b");
        expect(receivedBody.prompt).toBe("rank this");
        expect(receivedBody.format).toBe("json");
    }));
    test("maps 401 to LlmServiceError", () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.LLM_BASE_URL = baseUrl;
        process.env.LLM_USER = "bad";
        process.env.LLM_PASS = "bad";
        behavior = () => ({
            status: 401,
            payload: { error: "Unauthorized" },
        });
        const service = new llmService_1.LlmService();
        yield expect(service.generate({ prompt: "hello" })).rejects.toEqual(expect.objectContaining({
            message: "LLM authentication failed",
            statusCode: 401,
        }));
    }));
    test("maps timeouts to 504", () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.LLM_BASE_URL = baseUrl;
        process.env.LLM_USER = "student1";
        process.env.LLM_PASS = "pass123";
        process.env.LLM_TIMEOUT_MS = "50";
        behavior = () => ({
            status: 200,
            payload: { response: "slow" },
            delayMs: 200,
        });
        const service = new llmService_1.LlmService();
        yield expect(service.generate({ prompt: "slow call" })).rejects.toEqual(expect.objectContaining({
            message: "LLM service request timed out",
            statusCode: 504,
        }));
    }));
});
//# sourceMappingURL=llmService.test.js.map