import dotEnv from "dotenv";
dotEnv.config({ path: ".env.test" });

// Apply timeout before any test hooks run.
jest.setTimeout(30000);
