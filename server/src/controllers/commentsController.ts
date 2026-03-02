import commentsModel from "../models/commentsModel";
import { Request, Response } from "express";
import baseController from "./baseController";
import { AuthRequest } from "../middleware/authMiddleware";

class CommentsController extends baseController {
  constructor() {
    super(commentsModel);
  }


  // Get comments for a specific post
  async getByPostId(req: Request, res: Response) {
    const postId = req.params.postId;
    try {
      const comments = await this.model
        .find({ postID: postId })
        .populate("userID", "username"); // Populate user info (e.g., username)
      res.status(200).json(comments);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error fetching comments for the post");
    }
  }

  //Post a comment to a specific post
  async createByPostId(req: AuthRequest, res: Response) {
    const postId = req.params.postId;
    if (req.user) {
      req.body.userID = req.user._id; // Associate comment with user ID from token
    }
    req.body.postID = postId; // Associate comment with the post ID from URL
    
    try {
      const newComment = await this.model.create(req.body);
      // Populate user info before returning
      const populatedComment = await this.model
        .findById(newComment._id)
        .populate("userID", "username");
      res.status(201).json(populatedComment);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error creating comment");
    }
  }

  // Update a comment for a specific post
  async updateByPostId(req: AuthRequest, res: Response) {
    const commentId = req.params.commentId;
    const postId = req.params.postId;
    try {
      const comment = await this.model.findById(commentId);
      if (!comment) {
        res.status(404).send("Comment not found");
        return;
      }
      // Check if the authenticated user is the creator of the comment
      if (!req.user || comment.userID.toString() !== req.user._id) {
        res
          .status(403)
          .send("Forbidden: You are not the creator of this comment");
        return;
      }
      // Prevent changing userID, postID and date fields
      if (
        (req.body.userID && req.body.userID !== comment.userID.toString()) ||
        (req.body.postID && req.body.postID !== comment.postID.toString()) ||
        (req.body.date &&
          new Date(req.body.date).getTime() !== new Date(comment.date).getTime())
      ) {
        res
          .status(400)
          .send(
            "Cannot change creator, associated post, or created date of the comment",
          );
        return;
      }
      
      // Update and populate user info before returning
      const updatedComment = await this.model
        .findByIdAndUpdate(commentId, req.body, { new: true })
        .populate("userID", "username");
      
      if (!updatedComment) {
        res.status(404).send("Comment not found");
        return;
      }
      
      res.status(200).json(updatedComment);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).send("Error updating comment");
    }
  }

  // Delete a comment from a specific post
  async delByPostId(req: AuthRequest, res: Response) {
    const commentId = req.params.commentId;
    const postId = req.params.postId;
    try {
      const comment = await this.model.findById(commentId);
      if (!comment) {
        res.status(404).send("Comment not found");
        return;
      }
      // Check if the authenticated user is the creator of the comment
      if (!req.user || comment.userID.toString() !== req.user._id) {
        res
          .status(403)
          .send("Forbidden: You are not the creator of this comment");
        return;
      }
      req.params.id = commentId;
      super.del(req, res);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting comment");
    }
  }
}

export default new CommentsController();
