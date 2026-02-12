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
 * /comment:
 *   get:
 *     tags:
 *       - Comments
 *     summary: Get all comments
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       500:
 *         description: Failed to retrieve comments
 */
router.get("/", commentsController_1.default.getAll.bind(commentsController_1.default));
/**
 * @openapi
 * /comment/{id}:
 *   get:
 *     tags:
 *       - Comments
 *     summary: Get a comment by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Failed to retrieve comment
 */
router.get("/:id", commentsController_1.default.getById.bind(commentsController_1.default));
/**
 * @openapi
 * /comment:
 *   post:
 *     tags:
 *       - Comments
 *     summary: Create a new comment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentCreate'
 *     responses:
 *       201:
 *         description: Created comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to create comment
 */
router.post("/", authMiddleware_1.authenticate, commentsController_1.default.create.bind(commentsController_1.default));
/**
 * @openapi
 * /comment/{id}:
 *   put:
 *     tags:
 *       - Comments
 *     summary: Update a comment
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
 *             $ref: '#/components/schemas/CommentUpdate'
 *     responses:
 *       200:
 *         description: Updated comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Failed to update comment
 */
router.put("/:id", authMiddleware_1.authenticate, commentsController_1.default.update.bind(commentsController_1.default));
/**
 * @openapi
 * /comment/{id}:
 *   delete:
 *     tags:
 *       - Comments
 *     summary: Delete a comment
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
 *         description: Deleted comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Failed to delete comment
 */
router.delete("/:id", authMiddleware_1.authenticate, commentsController_1.default.del.bind(commentsController_1.default));
exports.default = router;
//# sourceMappingURL=commentsRoute.js.map