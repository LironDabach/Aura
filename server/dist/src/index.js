"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const postsRoute_1 = __importDefault(require("./routes/postsRoute"));
const commentsRoute_1 = __importDefault(require("./routes/commentsRoute"));
const likesRoute_1 = __importDefault(require("./routes/likesRoute"));
const authRoute_1 = __importDefault(require("./routes/authRoute"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_1 = require("./swagger");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: ".env.dev" });
const app = (0, express_1.default)();
app.use(express_1.default.json());
(0, swagger_1.setupSwagger)(app);
// // API routes
app.use("/post", postsRoute_1.default);
app.use("/comment", commentsRoute_1.default);
app.use("/like", likesRoute_1.default);
app.use("/auth", authRoute_1.default);
// Serve React static files from dist
const distPath = path_1.default.join(__dirname, "../client/dist");
app.use(express_1.default.static(distPath));
// SPA fallback: route all unmatched requests to index.html (for React Router)
app.get(/.*/, (req, res) => {
    res.sendFile(path_1.default.join(distPath, "index.html"));
});
const initApp = () => {
    const pr = new Promise((resolve, reject) => {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            reject("DATABASE_URL is undefined");
            return;
        }
        mongoose_1.default
            .connect(dbUrl, {})
            .then(() => {
            resolve(app);
        })
            .catch((error) => {
            reject(error);
        });
        const db = mongoose_1.default.connection;
        db.on("error", (error) => console.error(error));
        db.once("open", () => console.log("Connected to Database"));
    });
    return pr;
};
exports.default = initApp;
//# sourceMappingURL=index.js.map