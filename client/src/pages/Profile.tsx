import { useEffect, useState, useRef, type ChangeEvent } from "react";
import { getUserById, updateUser, getPostsByUser, updatePost, deletePost, getLikesForPost, getCommentsForPost, likePost, unlikePost } from "../services/posts";
import CommentsSidebar from "../components/CommentsSidebar";
import type { User } from "../types/user";
import type { Post } from "../types/post";
import "../styles/profile.css";

type PostMeta = {
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
};

// Profile page — shows user info, avatar management, and their posts
function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [savingPic, setSavingPic] = useState(false);
  const picInputRef = useRef<HTMLInputElement>(null);

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [savingPost, setSavingPost] = useState(false);

  const [error, setError] = useState("");
  const [meta, setMeta] = useState<Record<string, PostMeta>>({});
  const [sidebarPostId, setSidebarPostId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const currentUserId = (() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw)?._id : null;
  })();

  useEffect(() => {
    if (!currentUserId) return;
    const fetchData = async () => {
      try {
        const [userData, userPosts] = await Promise.all([
          getUserById(currentUserId),
          getPostsByUser(currentUserId),
        ]);
        setUser(userData);
        setPosts(userPosts);

        const metaEntries = await Promise.all(
          userPosts.map(async (p: Post) => {
            const [likes, comments] = await Promise.all([
              getLikesForPost(p._id).catch(() => []),
              getCommentsForPost(p._id).catch(() => []),
            ]);
            const isLikedByMe = likes.some((l) => l.senderID === currentUserId);
            return [
              p._id,
              { likeCount: likes.length, commentCount: comments.length, isLikedByMe },
            ] as const;
          })
        );
        setMeta(Object.fromEntries(metaEntries));
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUserId]);

  const handlePicChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSavingPic(true);
    setError("");
    try {
      const updated = await updateUser(user._id, { profilePicture: file });
      setUser(updated);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      stored.profilePicture = updated.profilePicture;
      localStorage.setItem("user", JSON.stringify(stored));
    } catch (err: any) {
      setError(err.response?.data || "Failed to update profile picture.");
    } finally {
      setSavingPic(false);
    }
  };

  const handleRemovePic = async () => {
    if (!user) return;
    setSavingPic(true);
    setError("");
    try {
      const updated = await updateUser(user._id, { removeProfilePicture: true });
      setUser(updated);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      delete stored.profilePicture;
      localStorage.setItem("user", JSON.stringify(stored));
    } catch (err: any) {
      setError(err.response?.data || "Failed to remove profile picture.");
    } finally {
      setSavingPic(false);
    }
  };

  const handleEditPostStart = (post: Post) => {
    setEditingPostId(post._id);
    setEditTitle(post.title);
    setEditBody(post.body);
    setEditImage(null);
    setEditImagePreview(post.imageUrl || null);
  };

  const handleEditPostImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEditPostSave = async () => {
    if (!editingPostId) return;
    setSavingPost(true);
    setError("");
    try {
      const data: { title?: string; body?: string; image?: File } = {};
      if (editTitle.trim()) data.title = editTitle.trim();
      if (editBody.trim()) data.body = editBody.trim();
      if (editImage) data.image = editImage;
      const updated = await updatePost(editingPostId, data);
      setPosts((prev) => prev.map((p) => (p._id === editingPostId ? updated : p)));
      setEditingPostId(null);
    } catch (err: any) {
      setError(err.response?.data || "Failed to update post.");
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirmDeleteId) return;
    try {
      await deletePost(confirmDeleteId);
      setPosts((prev) => prev.filter((p) => p._id !== confirmDeleteId));
    } catch (err: any) {
      setError(err.response?.data || "Failed to delete post.");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleLike = async (postId: string) => {
    const m = meta[postId];
    if (!m) return;
    try {
      if (m.isLikedByMe) {
        await unlikePost(postId);
        setMeta((prev) => ({
          ...prev,
          [postId]: { ...prev[postId], isLikedByMe: false, likeCount: Math.max(0, prev[postId].likeCount - 1) },
        }));
      } else {
        await likePost(postId);
        setMeta((prev) => ({
          ...prev,
          [postId]: { ...prev[postId], isLikedByMe: true, likeCount: prev[postId].likeCount + 1 },
        }));
      }
    } catch (err) {
      console.error("Like toggle failed", err);
    }
  };

  const handleCommentCountChange = (postId: string, delta: number) => {
    setMeta((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        commentCount: Math.max(0, (prev[postId]?.commentCount ?? 0) + delta),
      },
    }));
  };

  if (loading) {
    return <div className="profile-loading">Loading profile…</div>;
  }

  if (!user) {
    return <div className="profile-loading">User not found.</div>;
  }

  return (
    <div className="profile-page">
      {error && <div className="profile-error">{error}</div>}

      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper" onClick={() => picInputRef.current?.click()}>
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.username} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="profile-avatar-overlay">
              {savingPic ? "…" : "✎"}
            </div>
            <input
              ref={picInputRef}
              type="file"
              accept="image/*"
              onChange={handlePicChange}
              style={{ display: "none" }}
            />
          </div>
          {user.profilePicture && (
            <button
              className="profile-remove-pic-btn"
              onClick={handleRemovePic}
              disabled={savingPic}
              title="Remove profile picture"
            >
              Remove photo
            </button>
          )}
        </div>

        <div className="profile-info">
          <div className="profile-name-row">
            <h2 className="profile-username">{user.username}</h2>
          </div>
          <span className="profile-email">{user.email}</span>
          <span className="profile-post-count">{posts.length} post{posts.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <h3 className="profile-section-title">My Posts ({posts.length})</h3>

      {posts.length === 0 ? (
        <p className="profile-no-posts">You haven't posted anything yet.</p>
      ) : (
        <div className="profile-posts-grid">
          {posts.map((post) => (
            <div key={post._id} className="profile-post-card">
              {editingPostId === post._id ? (
                <div className="profile-post-edit">
                  <input
                    className="profile-post-edit-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Title"
                  />
                  <textarea
                    className="profile-post-edit-textarea"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    placeholder="Content"
                    rows={3}
                  />
                  <div className="profile-post-edit-image">
                    <label className="profile-post-edit-file-label">
                      Change image
                      <input type="file" accept="image/*" onChange={handleEditPostImageChange} style={{ display: "none" }} />
                    </label>
                  </div>
                  {editImagePreview && (
                    <img src={editImagePreview} alt="Preview" className="profile-post-edit-preview" />
                  )}
                  <div className="profile-post-edit-actions">
                    <button className="profile-btn-save" onClick={handleEditPostSave} disabled={savingPost}>
                      {savingPost ? "Saving…" : "Save"}
                    </button>
                    <button className="profile-btn-cancel" onClick={() => setEditingPostId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt={post.title} className="profile-post-image" loading="lazy" />
                  )}
                  <div className="profile-post-content">
                    <h4 className="profile-post-title">{post.title}</h4>
                    <p className="profile-post-body">{post.body}</p>
                    <span className="profile-post-date">
                      {new Date(post.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                  </div>

                  <div className="profile-post-footer">
                    <button
                      className={`profile-post-like-btn ${meta[post._id]?.isLikedByMe ? "liked" : ""}`}
                      onClick={() => handleLike(post._id)}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        {meta[post._id]?.isLikedByMe ? (
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#e74c6f" />
                        ) : (
                          <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" fill="#9ca3af" />
                        )}
                      </svg>
                      <span>{meta[post._id]?.likeCount ?? 0}</span>
                    </button>
                    <button
                      className="profile-post-comment-btn"
                      onClick={() => setSidebarPostId((prev) => prev === post._id ? null : post._id)}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{meta[post._id]?.commentCount ?? 0}</span>
                    </button>
                  </div>

                  <div className="profile-post-actions">
                    <button className="profile-post-action-btn edit" onClick={() => handleEditPostStart(post)} title="Edit post">
                      ✎
                    </button>
                    <button className="profile-post-action-btn delete" onClick={() => setConfirmDeleteId(post._id)} title="Delete post">
                      ✕
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {sidebarPostId && (
        <CommentsSidebar
          postId={sidebarPostId}
          open={!!sidebarPostId}
          onClose={() => setSidebarPostId(null)}
          onCommentCountChange={handleCommentCountChange}
        />
      )}

      {confirmDeleteId && (
        <div className="confirm-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">Delete Post</h3>
            <p className="confirm-text">Are you sure you want to delete this post? This cannot be undone.</p>
            <div className="confirm-buttons">
              <button className="confirm-btn cancel" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="confirm-btn delete" onClick={handleDeletePost}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
