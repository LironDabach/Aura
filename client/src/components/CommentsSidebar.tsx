import React, { useEffect, useState, useRef } from "react";
import type { Comment } from "../types/post";
import {
  getCommentsForPost,
  addComment,
  deleteComment,
  updateComment,
} from "../services/posts";
import "../styles/comments-sidebar.css";
import sendIcon from "../assets/send_icon.svg";

type Props = {
  postId: string;
  open: boolean;
  onClose: () => void;
  onCommentCountChange?: (postId: string, delta: number) => void;
};

const CommentsSidebar: React.FC<Props> = ({
  postId,
  open,
  onClose,
  onCommentCountChange,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newText, setNewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const currentUserId = (() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw)?._id : null;
  })();

  // Fetch comments when sidebar opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getCommentsForPost(postId)
      .then((data) => setComments(data))
      .catch((err) => console.error("Failed to load comments", err))
      .finally(() => setLoading(false));
  }, [open, postId]);

  // Scroll to bottom when new comment is added
  const scrollToBottom = () => {
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newText.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    try {
      const created = await addComment(postId, text);
      setComments((prev) => [...prev, created]);
      setNewText("");
      onCommentCountChange?.(postId, 1);
      scrollToBottom();
    } catch (err) {
      console.error("Failed to add comment", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(postId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      onCommentCountChange?.(postId, -1);
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  const handleEditStart = (comment: Comment) => {
    setEditingId(comment._id);
    setEditText(comment.content);
  };

  const handleEditSave = async (commentId: string) => {
    const text = editText.trim();
    if (!text) return;

    try {
      const updated = await updateComment(postId, commentId, text);
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? updated : c))
      );
      setEditingId(null);
      setEditText("");
    } catch (err) {
      console.error("Failed to update comment", err);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText("");
  };

  const getCommentUsername = (comment: Comment) => {
    if (typeof comment.userID === "object") return comment.userID.username;
    return "unknown";
  };

  const getCommentUserId = (comment: Comment) => {
    if (typeof comment.userID === "object") return comment.userID._id;
    return comment.userID;
  };

  const isMyComment = (comment: Comment) =>
    currentUserId && getCommentUserId(comment) === currentUserId;

  return (
    <>
      {/* Overlay */}
      <div
        className={`sidebar-overlay ${open ? "visible" : ""}`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside className={`comments-sidebar ${open ? "open" : ""}`}>
        <header className="comments-sidebar-header">
          <h3>Comments</h3>
          <button className="comments-sidebar-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        {/* Comments list */}
        <div className="comments-sidebar-list" ref={listRef}>
          {loading ? (
            <p className="comments-sidebar-empty">Loading…</p>
          ) : comments.length === 0 ? (
            <p className="comments-sidebar-empty">
              No comments yet. Be the first!
            </p>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="comment-item">
                <div className="comment-item-header">
                  <span className="comment-avatar">
                    {getCommentUsername(c).charAt(0).toUpperCase()}
                  </span>
                  <div className="comment-meta">
                    <span className="comment-username">
                      {getCommentUsername(c)}
                    </span>
                    <span className="comment-date">
                      {new Date(c.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}{" "}
                      ·{" "}
                      {new Date(c.date).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {isMyComment(c) && editingId !== c._id && (
                    <div className="comment-actions">
                      <button
                        className="comment-action-btn"
                        onClick={() => handleEditStart(c)}
                        title="Edit"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14">
                          <path
                            d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                          />
                          <path
                            d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                      <button
                        className="comment-action-btn delete"
                        onClick={() => handleDelete(c._id)}
                        title="Delete"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14">
                          <path
                            d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {editingId === c._id ? (
                  <div className="comment-edit-form">
                    <input
                      className="comment-edit-input"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditSave(c._id);
                        if (e.key === "Escape") handleEditCancel();
                      }}
                      autoFocus
                    />
                    <div className="comment-edit-btns">
                      <button
                        className="comment-edit-save"
                        onClick={() => handleEditSave(c._id)}
                      >
                        Save
                      </button>
                      <button
                        className="comment-edit-cancel"
                        onClick={handleEditCancel}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="comment-content">{c.content}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* New comment form */}
        <form className="comments-sidebar-form" onSubmit={handleSubmit}>
          <input
            className="comments-sidebar-input"
            placeholder="Write a comment…"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            disabled={submitting}
          />
          <button
            className="comments-sidebar-send"
            type="submit"
            disabled={submitting || !newText.trim()}
            title="Send"
          >
            <img src={sendIcon} alt="Send" width="20" height="20" />
          </button>
        </form>
      </aside>
    </>
  );
};

export default CommentsSidebar;
