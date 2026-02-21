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
const baseController_1 = __importDefault(require("./baseController"));
const postsModel_1 = __importDefault(require("../models/postsModel"));
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
            if (req.user) {
                req.body.senderID = req.user._id; // Associate post with user ID from token
            }
            // Keep post date server-managed to prevent spoofing.
            req.body.date = new Date();
            return _super.create.call(this, req, res);
        });
    }
    update(req, res) {
        const _super = Object.create(null, {
            update: { get: () => super.update }
        });
        return __awaiter(this, void 0, void 0, function* () {
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
                if (req.body.date && req.body.date !== post.date.toISOString()) {
                    res.status(400).send("Error: Cannot change post date");
                    return;
                }
                if (req.user && post.senderID.toString() !== req.user._id) {
                    res.status(403).send("Forbidden: Not the creator of the post");
                    return;
                }
                _super.update.call(this, req, res);
                return;
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error: Can't update post");
            }
        });
    }
    del(req, res) {
        const _super = Object.create(null, {
            del: { get: () => super.del }
        });
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
                    _super.del.call(this, req, res);
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
                const posts = yield this.model
                    .find({ senderID: userId })
                    .populate("senderID", "username profilePicture")
                    .sort({ date: -1 });
                res.json(posts);
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error: Can't retrieve posts by user ID");
            }
        });
    }
}
exports.default = new PostsController();
//# sourceMappingURL=postsController.js.map