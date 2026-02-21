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
const commentsModel_1 = __importDefault(require("../models/commentsModel"));
const baseController_1 = __importDefault(require("./baseController"));
class CommentsController extends baseController_1.default {
    constructor() {
        super(commentsModel_1.default);
    }
    // Get comments for a specific post
    getByPostId(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const postId = req.params.postId;
            try {
                const comments = yield this.model
                    .find({ postID: postId })
                    .populate("userID", "username"); // Populate user info (e.g., username)
                res.status(200).json(comments);
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error fetching comments for the post");
            }
        });
    }
    //Post a comment to a specific post
    createByPostId(req, res) {
        const _super = Object.create(null, {
            create: { get: () => super.create }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const postId = req.params.postId;
            if (req.user) {
                req.body.userID = req.user._id; // Associate comment with user ID from token
            }
            req.body.postID = postId; // Associate comment with the post ID from URL
            return _super.create.call(this, req, res);
        });
    }
    // Update a comment for a specific post
    updateByPostId(req, res) {
        const _super = Object.create(null, {
            update: { get: () => super.update }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const commentId = req.params.commentId;
            const postId = req.params.postId;
            try {
                const comment = yield this.model.findById(commentId);
                if (!comment) {
                    res.status(404).send("Comment not found");
                    return;
                }
                // Check if the authenticated user is the creator of the comment
                if (!req.user || comment.userID.toString() !== req.user._id) {
                    res
                        .status(403)
                        .send("Forbidden: You are not the creator of this comment");
                    return;
                }
                // Prevent changing userID, postID and date fields
                if ((req.body.userID && req.body.userID !== comment.userID.toString()) ||
                    (req.body.postID && req.body.postID !== comment.postID.toString()) ||
                    (req.body.date &&
                        new Date(req.body.date).getTime() !== new Date(comment.date).getTime())) {
                    res
                        .status(400)
                        .send("Cannot change creator, associated post, or created date of the comment");
                    return;
                }
                req.params.id = commentId;
                _super.update.call(this, req, res);
                return;
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error updating comment");
            }
        });
    }
    // Delete a comment from a specific post
    delByPostId(req, res) {
        const _super = Object.create(null, {
            del: { get: () => super.del }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const commentId = req.params.commentId;
            const postId = req.params.postId;
            try {
                const comment = yield this.model.findById(commentId);
                if (!comment) {
                    res.status(404).send("Comment not found");
                    return;
                }
                // Check if the authenticated user is the creator of the comment
                if (!req.user || comment.userID.toString() !== req.user._id) {
                    res
                        .status(403)
                        .send("Forbidden: You are not the creator of this comment");
                    return;
                }
                req.params.id = commentId;
                _super.del.call(this, req, res);
                return;
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Error deleting comment");
            }
        });
    }
}
exports.default = new CommentsController();
//# sourceMappingURL=commentsController.js.map