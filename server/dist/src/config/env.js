"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = exports.getRuntimeEnvironment = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const envCandidates = [
    path_1.default.resolve(process.cwd(), "../.env"),
    path_1.default.resolve(process.cwd(), ".env"),
    path_1.default.resolve(__dirname, "../../../.env"),
    path_1.default.resolve(__dirname, "../../../../.env"),
];
const rootEnvPath = envCandidates.find((candidate) => fs_1.default.existsSync(candidate));
let isLoaded = false;
const readScopedValue = (scope, key) => {
    return process.env[`${scope}_${key}`];
};
const applyScopedValue = (key, scope) => {
    if (process.env[key]) {
        return;
    }
    const scopedValue = readScopedValue(scope, key);
    if (scopedValue !== undefined) {
        process.env[key] = scopedValue;
    }
};
const getRuntimeEnvironment = () => {
    const value = (process.env.NODE_ENV || "development").toLowerCase();
    return value === "production" ? "production" : "development";
};
exports.getRuntimeEnvironment = getRuntimeEnvironment;
const loadEnv = () => {
    if (!isLoaded) {
        if (rootEnvPath) {
            dotenv_1.default.config({ path: rootEnvPath });
        }
        isLoaded = true;
    }
    const scope = (0, exports.getRuntimeEnvironment)() === "production" ? "PROD" : "DEV";
    const runtimeKeys = [
        "PORT",
        "DOMAIN_BASE",
        "DATABASE_URL",
        "MONGO_CONNECT_TIMEOUT_MS",
        "VITE_API_BASE_URL",
    ];
    runtimeKeys.forEach((key) => applyScopedValue(key, scope));
};
exports.loadEnv = loadEnv;
//# sourceMappingURL=env.js.map