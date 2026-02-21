"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const postsController_1 = __importDefault(require("../controllers/postsController"));
const router = express_1.default.Router();
/**
 * @openapi
 * /api/post:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get all posts (paginated)
 *     description: Returns posts sorted by date (newest first), with sender info populated. Supports pagination via query params.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Posts per page (defaults to POSTS_PER_PAGE env variable)
 *     responses:
 *       200:
 *         description: Paginated list of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 4
 *                 total:
 *                   type: integer
 *                   example: 18
 *       500:
 *         description: Internal server error
 */
router.get("/", postsController_1.default.getAll.bind(postsController_1.default));
/**
 * @openapi
 * /api/post/{id}:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get a post by ID
 *     description: Returns a single post with sender info populated.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *     responses:
 *       200:
 *         description: The post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", postsController_1.default.getById.bind(postsController_1.default));
/**
 * @openapi
 * /api/post/user/{userId}:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get all posts by a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: Array of posts by this user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Internal server error
 */
router.get("/user/:userId", postsController_1.default.getByUserId.bind(postsController_1.default));
/**
 * @openapi
 * /api/post:
 *   post:
 *     tags:
 *       - Posts
 *     summary: Create a new post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostCreate'
 *     responses:
 *       201:
 *         description: Post created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/", authMiddleware_1.authenticate, postsController_1.default.create.bind(postsController_1.default));
/**
 * @openapi
 * /api/post/{id}:
 *   put:
 *     tags:
 *       - Posts
 *     summary: Update a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostUpdate'
 *     responses:
 *       200:
 *         description: Post updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Cannot change creator or date
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the creator
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", authMiddleware_1.authenticate, postsController_1.default.update.bind(postsController_1.default));
/**
 * @openapi
 * /api/post/{id}:
 *   delete:
 *     tags:
 *       - Posts
 *     summary: Delete a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *     responses:
 *       200:
 *         description: Post deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the creator
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authMiddleware_1.authenticate, postsController_1.default.del.bind(postsController_1.default));
exports.default = router;
//# sourceMappingURL=postsRoute.js.map