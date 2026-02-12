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
const likesModel_1 = __importDefault(require("../models/likesModel"));
const baseController_1 = __importDefault(require("./baseController"));
class LikesController extends baseController_1.default {
    constructor() {
        super(likesModel_1.default);
    }
    // Override create method to associate like with authenticated user
    create(req, res) {
        const _super = Object.create(null, {
            create: { get: () => super.create }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user) {
                req.body.userID = req.user._id; // Associate like with user ID from token
            }
            return _super.create.call(this, req, res);
        });
    }
    // Override DELETE to ensure only creator can delete
    del(req, res) {
        const _super = Object.create(null, {
            del: { get: () => super.del }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const id = req.params.id;
            try {
                const like = yield this.model.findById(id);
                if (!like) {
                    res.status(404).send("Like not found");
                    return;
                }
                // // Check if the authenticated user is the creator of the like
                if (req.user && like.userID.toString() === req.user._id) {
                    _super.del.call(this, req, res);
                    return;
                }
                else {
                    res.status(403).send("Forbidden: You are not the creator of this like");
                    return;
                }
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error deleting like");
            }
        });
    }
    // Override update to prevent changing userId and ensure ownership
    update(req, res) {
        const _super = Object.create(null, {
            update: { get: () => super.update }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const id = req.params.id;
            try {
                const like = yield this.model.findById(id);
                if (!like) {
                    res.status(404).send("Like not found");
                    return;
                }
                // Check if the authenticated user is the creator of the like
                if (!req.user || like.userID.toString() !== req.user._id) {
                    res.status(403).send("Forbidden: You are not the creator of this like");
                    return;
                }
                // Prevent changing userId field
                if (req.body.userID && req.body.userID !== like.userID.toString()) {
                    res.status(400).send("Cannot change creator of the like");
                    return;
                }
                _super.update.call(this, req, res);
                return;
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error updating comment");
            }
        });
    }
    // Get all likes for a specific post
    getByPostId(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const postID = req.params.postID;
            try {
                const likes = yield this.model.find({ postID: postID });
                res.json(likes);
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error retrieving likes for the post");
            }
        });
    }
    // Create a like for a specific post
    createByPostId(req, res) {
        const _super = Object.create(null, {
            create: { get: () => super.create }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const postID = req.params.postID;
            if (req.user) {
                req.body.userID = req.user._id; // Associate like with user ID from token
            }
            req.body.postID = postID; // Associate like with the post ID from the URL
            return _super.create.call(this, req, res);
        });
    }
    // Delete a like for a specific post by the authenticated user
    delByPostId(req, res) {
        const _super = Object.create(null, {
            del: { get: () => super.del }
        });
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const postID = req.params.postID;
            try {
                const like = yield this.model.findOne({
                    postID: postID,
                    userID: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
                });
                if (!like) {
                    res.status(404).send("Like not found for this post by the user");
                    return;
                }
                _super.del.call(this, req, res);
                return;
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error deleting like for the post");
            }
        });
    }
}
exports.default = new LikesController();
//# sourceMappingURL=likesController.js.map