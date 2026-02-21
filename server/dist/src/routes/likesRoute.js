"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const likesController_1 = __importDefault(require("../controllers/likesController"));
const router = express_1.default.Router();
/**
 * @openapi
 * /api/like/post/{postID}:
 *   get:
 *     tags:
 *       - Likes
 *     summary: Get all likes for a post
 *     parameters:
 *       - in: path
 *         name: postID
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *     responses:
 *       200:
 *         description: Array of likes for the post
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Like'
 *       500:
 *         description: Internal server error
 */
router.get("/post/:postID", likesController_1.default.getByPostId.bind(likesController_1.default));
/**
 * @openapi
 * /api/like/post/{postID}:
 *   post:
 *     tags:
 *       - Likes
 *     summary: Like a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postID
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID to like
 *     responses:
 *       201:
 *         description: Like created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Like'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/post/:postID", authMiddleware_1.authenticate, likesController_1.default.createByPostId.bind(likesController_1.default));
/**
 * @openapi
 * /api/like/post/{postID}:
 *   delete:
 *     tags:
 *       - Likes
 *     summary: Unlike a post
 *     description: Removes the authenticated user's like from the post.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postID
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID to unlike
 *     responses:
 *       200:
 *         description: Like removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Like'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Like not found for this post by the user
 *       500:
 *         description: Internal server error
 */
router.delete("/post/:postID", authMiddleware_1.authenticate, likesController_1.default.delByPostId.bind(likesController_1.default));
exports.default = router;
//# sourceMappingURL=likesRoute.js.map