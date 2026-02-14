import likesModel from "../models/likesModel";
import { Request, Response } from "express";
import baseController from "./baseController";
import { AuthRequest } from "../middleware/authMiddleware";

class LikesController extends baseController {
  constructor() {
    super(likesModel);
  }

  // Override create method to associate like with authenticated user
  async create(req: AuthRequest, res: Response) {
    if (req.user) {
      req.body.senderID = req.user._id; // Associate like with user ID from token
    }
    return super.create(req, res);
  }

  // Override DELETE to ensure only creator can delete
  async del(req: AuthRequest, res: Response) {
    const id = req.params.id;
    try {
      const like = await this.model.findById(id);
      if (!like) {
        res.status(404).send("Like not found");
        return;
      }
      // // Check if the authenticated user is the creator of the like
      if (req.user && like.senderID.toString() === req.user._id) {
        super.del(req, res);
        return;
      } else {
        res.status(403).send("Forbidden: You are not the creator of this like");
        return;
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting like");
    }
  }

  // Override update to prevent changing userId and ensure ownership
  async update(req: AuthRequest, res: Response) {
    const id = req.params.id;
    try {
      const like = await this.model.findById(id);
      if (!like) {
        res.status(404).send("Like not found");
        return;
      }
      // Check if the authenticated user is the creator of the like
      if (!req.user || like.senderID.toString() !== req.user._id) {
        res.status(403).send("Forbidden: You are not the creator of this like");
        return;
      }
      // Prevent changing userId field
      if (
        req.body.senderID &&
        req.body.senderID !== like.senderID.toString()
      ) {
        res.status(400).send("Cannot change creator of the like");
        return;
      }
      super.update(req, res);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).send("Error updating comment");
    }
  }

  // Get all likes for a specific post
  async getByPostId(req: Request, res: Response) {
    const postID = req.params.postID;
    try {
      const likes = await this.model.find({ postID: postID });
      res.json(likes);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error retrieving likes for the post");
    }
  }

  // Create a like for a specific post
  async createByPostId(req: AuthRequest, res: Response) {
    const postID = req.params.postID;
    if (req.user) {
      req.body.senderID = req.user._id; // Associate like with user ID from token
    }
    req.body.postID = postID; // Associate like with the post ID from the URL
    return super.create(req, res);
  }

  // Delete a like for a specific post by the authenticated user
  async delByPostId(req: AuthRequest, res: Response) {
    const postID = req.params.postID;
    try {
      const like = await this.model.findOne({
        postID: postID,
        senderID: req.user?._id,
      });
      if (!like) {
        res.status(404).send("Like not found for this post by the user");
        return;
      }
      await this.model.findByIdAndDelete(like._id);
      res.status(200).json(like);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting like for the post");
    }
  }
}

export default new LikesController();
