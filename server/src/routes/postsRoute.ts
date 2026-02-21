import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import postsController from "../controllers/postsController";
import { uploadSingle } from "../middleware/uploadMiddleware";

const router = express.Router();

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
router.get("/", postsController.getAll.bind(postsController));

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
router.get("/:id", postsController.getById.bind(postsController));

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
router.get("/user/:userId", postsController.getByUserId.bind(postsController));

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
 *         multipart/form-data:
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
router.post(
  "/",
  authenticate,
  uploadSingle,
  postsController.create.bind(postsController),
);

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
 *         multipart/form-data:
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
router.put(
  "/:id",
  authenticate,
  uploadSingle,
  postsController.update.bind(postsController),
);

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
router.delete("/:id", authenticate, postsController.del.bind(postsController));

export default router;
