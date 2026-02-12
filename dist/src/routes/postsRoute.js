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
 * /post:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get all posts
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Failed to retrieve posts
 */
router.get("/", postsController_1.default.getAll.bind(postsController_1.default));
/**
 * @openapi
 * /post/{id}:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get a post by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to retrieve post
 */
router.get("/:id", postsController_1.default.getById.bind(postsController_1.default));
/**
 * @openapi
 * /post:
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
 *         description: Created post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to create post
 */
router.post("/", authMiddleware_1.authenticate, postsController_1.default.create.bind(postsController_1.default));
/**
 * @openapi
 * /post/{id}:
 *   put:
 *     tags:
 *       - Posts
 *     summary: Update an existing post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostUpdate'
 *     responses:
 *       200:
 *         description: Updated post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to update post
 */
router.put("/:id", authMiddleware_1.authenticate, postsController_1.default.update.bind(postsController_1.default));
/**
 * @openapi
 * /post/{id}:
 *   delete:
 *     tags:
 *       - Posts
 *     summary: Delete a post by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to delete post
 */
router.delete("/:id", authMiddleware_1.authenticate, postsController_1.default.del.bind(postsController_1.default));
exports.default = router;
//# sourceMappingURL=postsRoute.js.map