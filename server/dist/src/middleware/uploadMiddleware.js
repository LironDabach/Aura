"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUploadedFileByUrl = exports.buildUploadedFileUrl = exports.uploadSingleImage = exports.uploadSingle = exports.uploadsDir = void 0;
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
exports.uploadsDir = "public/uploads";
const uploadsAbsDir = path_1.default.resolve(process.cwd(), exports.uploadsDir);
fs_1.default.mkdirSync(uploadsAbsDir, { recursive: true });
const sanitizeBaseName = (name) => {
    const sanitized = name
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
    return sanitized || "file";
};
const sanitizeUsername = (username) => username.replace(/[^a-zA-Z0-9_-]/g, "__");
const storage = multer_1.default.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, uploadsAbsDir);
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
        const now = new Date();
        const formattedDate = String(now.getDate()).padStart(2, "0") +
            "_" +
            String(now.getMonth() + 1).padStart(2, "0") +
            "_" +
            now.getFullYear();
        const nameParts = [];
        if (sanitizedUsername) {
            nameParts.push(sanitizedUsername);
        }
        nameParts.push(sanitizedOriginalName, formattedDate);
        const fileName = nameParts.join("-") + (ext ? `.${ext}` : "");
        cb(null, fileName);
    },
});
const upload = (0, multer_1.default)({ storage });
const uploadImage = (0, multer_1.default)({
    storage,
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
            return;
        }
        cb(new Error("Unsupported file type"));
    },
});
exports.uploadSingle = upload.single("file");
const uploadSingleImage = (req, res, next) => {
    uploadImage.single("file")(req, res, (err) => {
        if (err) {
            return res.status(400).send({ message: err.message || "Invalid file" });
        }
        next();
    });
};
exports.uploadSingleImage = uploadSingleImage;
const buildUploadedFileUrl = (req, fileName) => `${req.protocol}://${req.get("host")}/api/upload/${fileName}`;
exports.buildUploadedFileUrl = buildUploadedFileUrl;
const extractUploadFileNameFromUrl = (url) => {
    try {
        const parsed = new URL(url, "http://localhost");
        const prefix = "/api/upload/";
        if (!parsed.pathname.startsWith(prefix)) {
            return null;
        }
        return path_1.default.basename(decodeURIComponent(parsed.pathname.slice(prefix.length)));
    }
    catch (_err) {
        return null;
    }
};
const deleteUploadedFileByUrl = (url) => __awaiter(void 0, void 0, void 0, function* () {
    if (!url)
        return;
    const fileName = extractUploadFileNameFromUrl(url);
    if (!fileName)
        return;
    const absolutePath = path_1.default.resolve(uploadsAbsDir, fileName);
    if (!absolutePath.startsWith(uploadsAbsDir))
        return;
    try {
        yield fs_1.default.promises.unlink(absolutePath);
    }
    catch (err) {
        if ((err === null || err === void 0 ? void 0 : err.code) !== "ENOENT") {
            throw err;
        }
    }
});
exports.deleteUploadedFileByUrl = deleteUploadedFileByUrl;
//# sourceMappingURL=uploadMiddleware.js.map