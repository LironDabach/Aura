import { useEffect, useState } from "react";
import type { Post } from "../types/post";
import { likePost, unlikePost } from "../services/posts";

type PostCardProps = {
  post: Post;
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
  onToggleComments?: () => void;
};

// Single post card with like/comment buttons
function PostCard({
  post,
  likeCount: initialLikeCount,
  commentCount,
  isLikedByMe: initialIsLiked,
  onToggleComments,
}: PostCardProps) {
  const [liked, setLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setLiked(initialIsLiked);
  }, [initialIsLiked]);

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  const sender = typeof post.senderID === "object" ? post.senderID : null;
  const username = sender?.username ?? "unknown";
  const avatar = sender?.profilePicture;

  const postDate = new Date(post.date);
  const formattedDate =
    postDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " · " +
    postDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const handleLike = async () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 350);

    try {
      if (liked) {
        await unlikePost(post._id);
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await likePost(post._id);
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch (err) {
      console.error("Like toggle failed", err);
    }
  };

  return (
    <article className="post-card">
      <header className="post-card-header">
        <div className="post-card-avatar">
          {avatar ? (
            <img src={avatar} alt={username} />
          ) : (
            <div className="post-card-avatar-placeholder">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="post-card-user-info">
          <span className="post-card-username">{username}</span>
          <span className="post-card-date">{formattedDate}</span>
        </div>
      </header>

      <div className="post-card-body">
        {post.imageUrl && (
          <img className="post-card-image" src={post.imageUrl} alt={post.title} loading="lazy" />
        )}
        {post.title && <h3 className="post-card-title">{post.title}</h3>}
        {post.body && <p className="post-card-text">{post.body}</p>}
      </div>

      <footer className="post-card-footer">
        <button
          className={`post-card-like-btn ${liked ? "liked" : ""} ${animating ? "pop" : ""}`}
          onClick={handleLike}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <svg
            className="post-card-heart-icon"
            viewBox="0 0 24 24"
            width="22"
            height="22"
          >
            {liked ? (
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                   2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                   C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
                   c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="#e74c6f"
              />
            ) : (
              <path
                d="M16.5 3c-1.74 0-3.41.81-4.5 2.09
                   C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5
                   c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32
                   C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55
                   l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5
                   4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87
                   C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5
                   0 2.89-3.14 5.74-7.9 10.05z"
                fill="#9ca3af"
              />
            )}
          </svg>
          <span className="post-card-count">{likeCount}</span>
        </button>

        <button className="post-card-comment-btn" onClick={onToggleComments} aria-label="Comments">
          <svg className="post-card-comment-icon" viewBox="0 0 24 24" width="22" height="22"
            fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="post-card-count">{commentCount}</span>
        </button>
      </footer>
    </article>
  );
}

export default PostCard;
