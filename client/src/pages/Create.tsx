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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !body.trim()) {
      setError("Both title and content are required.");
      return;
    }

    if (!imageFile) {
      setError("Please select an image file.");
      return;
    }

    setSubmitting(true);
    try {
      await createPost({
        title: title.trim(),
        body: body.trim(),
        image: imageFile,
      });
      navigate("/feed");
    } catch (err: any) {
      setError(err.response?.data || "Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
          placeholder="Write something about your post…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
        />

        <label className="create-label" htmlFor="create-image">
          Image
        </label>
        <div className="create-file-input">
          <input
            type="file"
            id="create-image"
            accept="image/*"
            onChange={handleFileChange}
            className="create-input-file"
          />
          <label htmlFor="create-image" className="create-file-label">
            {imageFile ? imageFile.name : "Choose an image file"}
          </label>
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div className="create-preview">
            <span className="create-preview-label">Image preview</span>
            <img src={imagePreview} alt="Preview" className="create-preview-img" />
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
