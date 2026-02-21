import { Request, Response } from "express";
import baseController from "./baseController";
import postsModel from "../models/postsModel";
import { AuthRequest } from "../middleware/authMiddleware";

class PostsController extends baseController {
  constructor() {
    super(postsModel);
  }

  // Override getAll to populate sender info + support pagination
  async getAll(req: Request, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const defaultLimit = parseInt(process.env.POSTS_PER_PAGE || "5");
      const limit = Math.max(1, parseInt(req.query.limit as string) || defaultLimit);
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        this.model
          .find()
          .populate("senderID", "username profilePicture")
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit),
        this.model.countDocuments(),
      ]);

      return res.json({
        posts,
        page,
        totalPages: Math.ceil(total / limit),
        total,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: Can't retrieve posts");
    }
  }

  // Override getById to populate sender info
  async getById(req: Request, res: Response) {
    const id = req.params.id;
    try {
      const post = await this.model
        .findById(id)
        .populate("senderID", "username profilePicture");
      if (!post) {
        return res.status(404).send("Error: Not found");
      }
      return res.json(post);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: Can't retrieve post by ID");
    }
  }

  async create(req: AuthRequest, res: Response) {
    if (req.user) {
      req.body.senderID = req.user._id; // Associate post with user ID from token
    }
    // Keep post date server-managed to prevent spoofing.
    req.body.date = new Date();
    return super.create(req, res);
  }

  async update(req: AuthRequest, res: Response) {
    const id = req.params.id;
    try {
      const post = await this.model.findById(id);
      if (!post) {
        res.status(404).send("Error: Post not found");
        return;
      }
      if (req.body.senderID && req.body.senderID !== post.senderID.toString()) {
        res.status(400).send("Error: Cannot change creator of the post");
        return;
      }
      if (req.body.date && req.body.date !== post.date.toISOString()) {
        res.status(400).send("Error: Cannot change post date");
        return;
      }
      if (req.user && post.senderID.toString() !== req.user._id) {
        res.status(403).send("Forbidden: Not the creator of the post");
        return;
      }
      super.update(req, res);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: Can't update post");
    }
  }

  async del(req: AuthRequest, res: Response) {
    const id = req.params.id;
    try {
      const post = await this.model.findById(id);
      if (!post) {
        res.status(404).send("Post not found");
        return;
      }
      if (req.user && post.senderID.toString() === req.user._id) {
        super.del(req, res);
        return;
      } else {
        console.log("req.user:", req.user);
        console.log("Forbidden delete attempt by user: " + req.user?._id);
        res.status(403).send("Forbidden: Not the creator of the post");
        return;
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: Can't delete post");
    }
  }

  async getByUserId(req: Request, res: Response) {
    const userId = req.params.userId;
    try {
      const posts = await this.model.find({ senderID: userId }).sort({ date: -1 });
      res.json(posts);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: Can't retrieve posts by user ID");
    }
  }
}

export default new PostsController();
