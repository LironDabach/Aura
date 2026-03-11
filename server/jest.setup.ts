import { loadEnv } from "./src/config/env";

loadEnv();

// Apply timeout before any test hooks run.
jest.setTimeout(30000);
