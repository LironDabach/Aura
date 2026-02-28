"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const baseController_1 = __importDefault(require("./baseController"));
const postsModel_1 = __importDefault(require("../models/postsModel"));
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const searchService_1 = __importStar(require("../services/searchService"));
class PostsController extends baseController_1.default {
    constructor() {
        super(postsModel_1.default);
    }
    // Override getAll to populate sender info + support pagination
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Math.max(1, parseInt(req.query.page) || 1);
                const defaultLimit = parseInt(process.env.POSTS_PER_PAGE || "5");
                const limit = Math.max(1, parseInt(req.query.limit) || defaultLimit);
                const skip = (page - 1) * limit;
                const [posts, total] = yield Promise.all([
                    this.model
                        .find()
                        .populate("senderID", "username profilePicture")
                        .sort({ date: -1 })
                        .skip(skip)
                        .limit(limit),
                    this.model.countDocuments(),
                ]);
                return res.json({
                    posts,
                    page,
                    totalPages: Math.ceil(total / limit),
                    total,
                });
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error: Can't retrieve posts");
            }
        });
    }
    // Override getById to populate sender info
    getById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = req.params.id;
            try {
                const post = yield this.model
                    .findById(id)
                    .populate("senderID", "username profilePicture");
                if (!post) {
                    return res.status(404).send("Error: Not found");
                }
                return res.json(post);
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error: Can't retrieve post by ID");
            }
        });
    }
    create(req, res) {
        const _super = Object.create(null, {
            create: { get: () => super.create }
        });
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (req.user) {
                req.body.senderID = req.user._id; // Associate post with user ID from token
            }
            if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.filename) {
                req.body.imageUrl = (0, uploadMiddleware_1.buildUploadedFileUrl)(req, req.file.filename);
            }
            if (!req.body.imageUrl) {
                res.status(400).send("Error: imageUrl or file is required");
                return;
            }
            // Keep post date server-managed to prevent spoofing.
            req.body.date = new Date();
            return _super.create.call(this, req, res);
        });
    }
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const id = req.params.id;
            try {
                const post = yield this.model.findById(id);
                if (!post) {
                    res.status(404).send("Error: Post not found");
                    return;
                }
                if (req.body.senderID && req.body.senderID !== post.senderID.toString()) {
                    res.status(400).send("Error: Cannot change creator of the post");
                    return;
                }
                if (req.body.date) {
                    res.status(400).send("Error: Cannot change post date");
                    return;
                }
                if (req.user && post.senderID.toString() !== req.user._id) {
                    res.status(403).send("Forbidden: Not the creator of the post");
                    return;
                }
                const oldImageUrl = post.imageUrl;
                if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.filename) {
                    req.body.imageUrl = (0, uploadMiddleware_1.buildUploadedFileUrl)(req, req.file.filename);
                }
                const data = yield this.model.findByIdAndUpdate(id, req.body, {
                    new: true,
                });
                if (!data) {
                    res.status(404).send("Error: Post not found");
                    return;
                }
                if (((_b = req.file) === null || _b === void 0 ? void 0 : _b.filename) && oldImageUrl && oldImageUrl !== data.imageUrl) {
                    yield (0, uploadMiddleware_1.deleteUploadedFileByUrl)(oldImageUrl);
                }
                res.json(data);
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error: Can't update post");
            }
        });
    }
    del(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const id = req.params.id;
            try {
                const post = yield this.model.findById(id);
                if (!post) {
                    res.status(404).send("Post not found");
                    return;
                }
                if (req.user && post.senderID.toString() === req.user._id) {
                    const deletedData = yield this.model.findByIdAndDelete(id);
                    if (!deletedData) {
                        res.status(404).send("Post not found");
                        return;
                    }
                    yield (0, uploadMiddleware_1.deleteUploadedFileByUrl)(deletedData.imageUrl);
                    res.status(200).json(deletedData);
                    return;
                }
                else {
                    console.log("req.user:", req.user);
                    console.log("Forbidden delete attempt by user: " + ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id));
                    res.status(403).send("Forbidden: Not the creator of the post");
                    return;
                }
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error: Can't delete post");
            }
        });
    }
    getByUserId(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = req.params.userId;
            try {
                const posts = yield this.model.find({ senderID: userId }).sort({ date: -1 });
                res.json(posts);
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error: Can't retrieve posts by user ID");
            }
        });
    }
    searchAi(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const q = req.query.q || "";
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const defaultLimit = parseInt(process.env.POSTS_PER_PAGE || "5");
            const limit = Math.max(1, parseInt(req.query.limit) || defaultLimit);
            try {
                const results = yield searchService_1.default.searchPostsAi(q, page, limit);
                return res.json(results);
            }
            catch (err) {
                if (err instanceof searchService_1.SearchValidationError) {
                    return res.status(400).send(`Error: ${err.message}`);
                }
                console.error(err);
                return res.status(500).send("Error: Can't search posts");
            }
        });
    }
}
exports.default = new PostsController();
//# sourceMappingURL=postsController.js.map