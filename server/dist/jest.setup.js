"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./src/config/env");
(0, env_1.loadEnv)();
// Apply timeout before any test hooks run.
jest.setTimeout(30000);
//# sourceMappingURL=jest.setup.js.map