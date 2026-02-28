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
exports.LlmService = exports.LlmServiceError = void 0;
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
class LlmServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "LlmServiceError";
        this.statusCode = statusCode;
    }
}
exports.LlmServiceError = LlmServiceError;
class LlmService {
    getConfig() {
        const baseUrl = process.env.LLM_BASE_URL;
        const user = process.env.LLM_USER;
        const pass = process.env.LLM_PASS;
        const timeoutMs = Number(process.env.LLM_TIMEOUT_MS || "15000");
        const defaultModel = process.env.LLM_MODEL || "llama3.1:8b";
        if (!baseUrl || !user || !pass) {
            throw new LlmServiceError("LLM service credentials are missing", 500);
        }
        return { baseUrl, user, pass, timeoutMs, defaultModel };
    }
    postJson(urlString, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user, pass, timeoutMs } = this.getConfig();
            const encodedCredentials = Buffer.from(`${user}:${pass}`).toString("base64");
            const body = JSON.stringify(payload);
            const url = new URL(urlString);
            const isHttps = url.protocol === "https:";
            const client = isHttps ? https_1.default : http_1.default;
            return new Promise((resolve, reject) => {
                const req = client.request({
                    protocol: url.protocol,
                    hostname: url.hostname,
                    port: url.port || (isHttps ? 443 : 80),
                    path: `${url.pathname}${url.search}`,
                    method: "POST",
                    headers: {
                        Authorization: `Basic ${encodedCredentials}`,
                        "Content-Type": "application/json",
                        "Content-Length": Buffer.byteLength(body),
                    },
                    timeout: timeoutMs,
                }, (res) => {
                    let responseData = "";
                    res.setEncoding("utf8");
                    res.on("data", (chunk) => {
                        responseData += chunk;
                    });
                    res.on("end", () => {
                        const statusCode = res.statusCode || 500;
                        try {
                            const parsed = responseData ? JSON.parse(responseData) : {};
                            resolve({ statusCode, data: parsed });
                        }
                        catch (error) {
                            reject(new LlmServiceError("Invalid JSON response from LLM service", 502));
                        }
                    });
                });
                req.on("timeout", () => {
                    req.destroy(new Error("timeout"));
                });
                req.on("error", (error) => {
                    if (error.message === "timeout") {
                        reject(new LlmServiceError("LLM service request timed out", 504));
                        return;
                    }
                    reject(new LlmServiceError("Failed to connect to LLM service", 503));
                });
                req.write(body);
                req.end();
            });
        });
    }
    generate(options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { baseUrl, defaultModel } = this.getConfig();
            const payload = {
                model: options.model || defaultModel,
                prompt: options.prompt,
                stream: (_a = options.stream) !== null && _a !== void 0 ? _a : false,
                format: options.format,
                options: options.options || {},
            };
            const { statusCode, data } = yield this.postJson(`${baseUrl.replace(/\/$/, "")}/api/generate`, payload);
            if (statusCode >= 200 && statusCode < 300) {
                return data;
            }
            if (statusCode === 401) {
                throw new LlmServiceError("LLM authentication failed", 401);
            }
            if (statusCode === 429) {
                throw new LlmServiceError("LLM rate limit exceeded", 429);
            }
            if (statusCode >= 500) {
                throw new LlmServiceError("LLM service unavailable", 503);
            }
            const errorMessage = typeof (data === null || data === void 0 ? void 0 : data.error) === "string" ? data.error : "LLM request failed";
            throw new LlmServiceError(errorMessage, statusCode);
        });
    }
}
exports.LlmService = LlmService;
exports.default = new LlmService();
//# sourceMappingURL=llmService.js.map