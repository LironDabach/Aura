import likesModel from "../models/likesModel";
import { Request, Response } from "express";
import baseController from "./baseController";
import { AuthRequest } from "../middleware/authMiddleware";

class LikesController extends baseController {
  constructor() {
    super(likesModel);
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
    if (!req.body) req.body = {};
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
