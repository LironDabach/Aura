import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import likesController from "../controllers/likesController";

const router = express.Router();

//get all likes for a post
router.get("/post/:postID", likesController.getByPostId.bind(likesController));

//post a like for a post
router.post("/post/:postID", authenticate, likesController.createByPostId.bind(likesController));

//delete a like for a post
router.delete("/post/:postID", authenticate, likesController.delByPostId.bind(likesController));


export default router;
