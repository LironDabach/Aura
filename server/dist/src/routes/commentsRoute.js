"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const commentsController_1 = __importDefault(require("../controllers/commentsController"));
const router = express_1.default.Router();
/**
 * @openapi
 * /api/comment/post/{postId}:
 *   get:
 *     tags:
 *       - Comments
 *     summary: Get all comments for a post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *     responses:
 *       200:
 *         description: Array of comments (with user info populated)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       500:
 *         description: Internal server error
 */
router.get("/post/:postId", commentsController_1.default.getByPostId.bind(commentsController_1.default));
/**
 * @openapi
 * /api/comment/post/{postId}:
 *   post:
 *     tags:
 *       - Comments
 *     summary: Add a comment to a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Great post!"
 *             required:
 *               - content
 *     responses:
 *       201:
 *         description: Comment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/post/:postId", authMiddleware_1.authenticate, commentsController_1.default.createByPostId.bind(commentsController_1.default));
/**
 * @openapi
 * /api/comment/post/{postId}/{commentId}:
 *   put:
 *     tags:
 *       - Comments
 *     summary: Update a comment on a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentUpdate'
 *     responses:
 *       200:
 *         description: Comment updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Cannot change creator or date
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the creator
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.put("/post/:postId/:commentId", authMiddleware_1.authenticate, commentsController_1.default.updateByPostId.bind(commentsController_1.default));
/**
 * @openapi
 * /api/comment/post/{postId}/{commentId}:
 *   delete:
 *     tags:
 *       - Comments
 *     summary: Delete a comment from a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The comment ID
 *     responses:
 *       200:
 *         description: Comment deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the creator
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.delete("/post/:postId/:commentId", authMiddleware_1.authenticate, commentsController_1.default.delByPostId.bind(commentsController_1.default));
exports.default = router;
//# sourceMappingURL=commentsRoute.js.map