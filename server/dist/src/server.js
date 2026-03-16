"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const port = process.env.PORT;
const httpsPort = process.env.HTTPS_PORT;
(0, index_1.default)()
    .then((app) => {
    if (process.env.NODE_ENV !== "production") {
        console.log("Development Environment");
        http_1.default.createServer(app).listen(port, () => {
            console.log(`Listening at http://localhost:${port}`);
        });
        return;
    }
    console.log("Production Environment");
    const httpsOptions = {
        key: fs_1.default.readFileSync("../client-key.pem"),
        cert: fs_1.default.readFileSync("../client-cert.pem"),
    };
    https_1.default.createServer(httpsOptions, app).listen(httpsPort, () => {
        console.log(`Listening on HTTPS port ${httpsPort}`);
    });
})
    .catch((error) => {
    console.error("Failed to initialize app:", error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map