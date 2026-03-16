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
const multerRoute_1 = __importDefault(require("./routes/multerRoute"));
const usersRoute_1 = __importDefault(require("./routes/usersRoute"));
const swagger_1 = require("./swagger");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
(0, swagger_1.setupSwagger)(app);
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});
// // API routes
app.use("/api/post", postsRoute_1.default);
app.use("/api/comment", commentsRoute_1.default);
app.use("/api/like", likesRoute_1.default);
app.use("/api/auth", authRoute_1.default);
app.use("/api/user", usersRoute_1.default);
app.use("/api/upload", express_1.default.static("public/uploads"));
app.use("/api/upload", multerRoute_1.default);
// Serve React static files
//const distPath = path.resolve(__dirname, "../../client/dist");
const distPath = path_1.default.resolve(__dirname, '../../../client/dist');
app.use(express_1.default.static(distPath));
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(distPath, "index.html"));
});
const initApp = () => {
    const pr = new Promise((resolve, reject) => {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            reject("DATABASE_URL is undefined");
            return;
        }
        const mongoTimeoutMs = Number(process.env.MONGO_CONNECT_TIMEOUT_MS || "5000");
        mongoose_1.default
            .connect(dbUrl, {
            connectTimeoutMS: mongoTimeoutMs,
            serverSelectionTimeoutMS: mongoTimeoutMs,
        })
            .then(() => {
            resolve(app);
        })
            .catch((error) => {
            reject(new Error(`Failed to connect to MongoDB within ${mongoTimeoutMs}ms. ` +
                `Check DATABASE_URL and that MongoDB is reachable. ` +
                `Original error: ${error instanceof Error ? error.message : String(error)}`));
        });
        const db = mongoose_1.default.connection;
        db.on("error", (error) => console.error("Mongo connection error:", error));
        db.once("open", () => console.log("Connected to Database"));
    });
    return pr;
};
exports.default = initApp;
//# sourceMappingURL=index.js.map