import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const envCandidates = [
  path.resolve(process.cwd(), "../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../../.env"),
  path.resolve(__dirname, "../../../../.env"),
];
const rootEnvPath = envCandidates.find((candidate) => fs.existsSync(candidate));
let isLoaded = false;

const readScopedValue = (scope: string, key: string): string | undefined => {
  return process.env[`${scope}_${key}`];
};

const applyScopedValue = (key: string, scope: string) => {
  if (process.env[key]) {
    return;
  }

  const scopedValue = readScopedValue(scope, key);
  if (scopedValue !== undefined) {
    process.env[key] = scopedValue;
  }
};

export const getRuntimeEnvironment = (): "development" | "production" => {
  const value = (process.env.NODE_ENV || "development").toLowerCase();
  return value === "production" ? "production" : "development";
};

export const loadEnv = () => {
  if (!isLoaded) {
    if (rootEnvPath) {
      dotenv.config({ path: rootEnvPath });
    }
    isLoaded = true;
  }

  const scope = getRuntimeEnvironment() === "production" ? "PROD" : "DEV";
  const runtimeKeys = [
    "PORT",
    "DOMAIN_BASE",
    "DATABASE_URL",
    "MONGO_CONNECT_TIMEOUT_MS",
    "VITE_API_BASE_URL",
  ];

  runtimeKeys.forEach((key) => applyScopedValue(key, scope));
};
