import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import postsController from "../controllers/postsController";

const router = express.Router();


router.get("/", postsController.getAll.bind(postsController));

router.get("/:id", postsController.getById.bind(postsController));

router.get("/user/:userId", postsController.getByUserId.bind(postsController));

router.post("/", authenticate, postsController.create.bind(postsController));

router.put("/:id", authenticate, postsController.update.bind(postsController));

router.delete("/:id", authenticate, postsController.del.bind(postsController));

export default router;
