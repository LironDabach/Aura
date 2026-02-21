"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
const base = "http://" + process.env.DOMAIN_BASE + ":" + process.env.PORT + "/api/upload/";
const now = new Date();
const formattedDate = String(now.getDate()).padStart(2, "0") +
    "_" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "_" +
    now.getFullYear();
const uploadsDir = "public/uploads/";
fs_1.default.mkdirSync(path_1.default.resolve(process.cwd(), uploadsDir), { recursive: true });
const sanitizeBaseName = (name) => {
    const sanitized = name
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
    return sanitized || "file";
};
const sanitizeUsername = (username) => username.replace(/[^a-zA-Z0-9_-]/g, "__");
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        var _a;
        const lastDotIndex = file.originalname.lastIndexOf(".");
        const hasExtension = lastDotIndex > 0 && lastDotIndex < file.originalname.length - 1;
        const rawBaseName = hasExtension
            ? file.originalname.slice(0, lastDotIndex)
            : file.originalname;
        const ext = hasExtension ? file.originalname.slice(lastDotIndex + 1) : "";
        const sanitizedOriginalName = sanitizeBaseName(rawBaseName);
        const username = typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.username) === "string" ? req.body.username : "";
        const sanitizedUsername = sanitizeUsername(username);
        const nameParts = [];
        if (sanitizedUsername) {
            nameParts.push(sanitizedUsername);
        }
        nameParts.push(sanitizedOriginalName, formattedDate);
        const fileName = nameParts.join("-") + (ext ? `.${ext}` : "");
        cb(null, fileName);
    },
});
const upload = (0, multer_1.default)({ storage: storage });
router.post("/", upload.single("file"), function (req, res) {
    const parts = req.file.path.split("/");
    const url = base + parts[parts.length - 1];
    console.log("router.post(/file: " + url);
    res.status(200).send({ url: url });
});
module.exports = router;
//# sourceMappingURL=multerRoute.js.map