"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const commentsController_1 = __importDefault(require("../controllers/commentsController"));
const router = express_1.default.Router();
// get comments for a specific post
router.get("/post/:postId", commentsController_1.default.getByPostId.bind(commentsController_1.default));
// post a comment to a specific post
router.post("/post/:postId", authMiddleware_1.authenticate, commentsController_1.default.createByPostId.bind(commentsController_1.default));
// update a comment for a specific post
router.put("/post/:postId/:commentId", authMiddleware_1.authenticate, commentsController_1.default.updateByPostId.bind(commentsController_1.default));
// delete a comment from a specific post
router.delete("/post/:postId/:commentId", authMiddleware_1.authenticate, commentsController_1.default.delByPostId.bind(commentsController_1.default));
exports.default = router;
//# sourceMappingURL=commentsRoute.js.map