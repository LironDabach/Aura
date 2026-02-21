import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import likesController from "../controllers/likesController";

const router = express.Router();

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
router.get("/post/:postID", likesController.getByPostId.bind(likesController));

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
router.post("/post/:postID", authenticate, likesController.createByPostId.bind(likesController));

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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Like not found for this post by the user
 *       500:
 *         description: Internal server error
 */
router.delete("/post/:postID", authenticate, likesController.delByPostId.bind(likesController));


export default router;
