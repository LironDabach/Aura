import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import commentsController from "../controllers/commentsController";

const router = express.Router();

// get comments for a specific post
router.get("/post/:postId", commentsController.getByPostId.bind(commentsController));

// post a comment to a specific post
router.post("/post/:postId", authenticate, commentsController.createByPostId.bind(commentsController));

// update a comment for a specific post
router.put("/post/:postId/:commentId", authenticate, commentsController.updateByPostId.bind(commentsController));

// delete a comment from a specific post
router.delete("/post/:postId/:commentId", authenticate, commentsController.delByPostId.bind(commentsController));

export default router;
