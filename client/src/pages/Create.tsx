import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPost } from "../services/posts";
import "../styles/create.css";

const Create: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !body.trim()) {
      setError("Both title and content are required.");
      return;
    }

    setSubmitting(true);
    try {
      await createPost({ title: title.trim(), body: body.trim() });
      navigate("/feed");
    } catch (err: any) {
      setError(err.response?.data || "Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Live image preview if body is an image URL
  const isImage =
    /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(body) ||
    /^https?:\/\/.*\/(photo|image|img|media)\b/i.test(body);

  return (
    <div className="create-page">
      <form className="create-form" onSubmit={handleSubmit}>
        <h2 className="create-heading">Create Post</h2>

        {error && <div className="create-error">{error}</div>}

        <label className="create-label" htmlFor="create-title">
          Title
        </label>
        <input
          id="create-title"
          className="create-input"
          type="text"
          placeholder="Give your post a title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          autoFocus
        />

        <label className="create-label" htmlFor="create-body">
          Content
        </label>
        <textarea
          id="create-body"
          className="create-textarea"
          placeholder="Write something or paste an image URL…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
        />

        {/* Live image preview */}
        {isImage && (
          <div className="create-preview">
            <span className="create-preview-label">Image preview</span>
            <img src={body} alt="Preview" className="create-preview-img" />
          </div>
        )}

        <button
          type="submit"
          className="create-submit"
          disabled={submitting || !title.trim() || !body.trim()}
        >
          {submitting ? "Publishing…" : "Publish"}
        </button>
      </form>
    </div>
  );
};

export default Create;
