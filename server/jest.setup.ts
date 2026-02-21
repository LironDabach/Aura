import dotEnv from "dotenv";
import path from "path";

dotEnv.config({ path: path.resolve(__dirname, "../.env.development") });

console.log(process.env.DATABASE_URL);

// Apply timeout before any test hooks run.
jest.setTimeout(30000);
