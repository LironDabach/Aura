import React, { useEffect, useState, useRef, useCallback } from "react";
import PostCard from "../components/PostCard";
import CommentsSidebar from "../components/CommentsSidebar";
import {
  getPosts,
  getLikesForPost,
  getCommentsForPost,
} from "../services/posts";
import type { Post } from "../types/post";
import "../styles/feed.css";

type PostMeta = {
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
};

const Dashboard: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<Record<string, PostMeta>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sidebarPostId, setSidebarPostId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchMeta = async (newPosts: Post[]) => {
    const userRaw = localStorage.getItem("user");
    const currentUserId = userRaw ? JSON.parse(userRaw)?._id : null;

    const metaEntries = await Promise.all(
      newPosts.map(async (p) => {
        const [likes, comments] = await Promise.all([
          getLikesForPost(p._id).catch(() => []),
          getCommentsForPost(p._id).catch(() => []),
        ]);
        const isLikedByMe = currentUserId
          ? likes.some((l) => l.senderID === currentUserId)
          : false;
        return [
          p._id,
          { likeCount: likes.length, commentCount: comments.length, isLikedByMe },
        ] as const;
      })
    );
    return Object.fromEntries(metaEntries);
  };

  // Initial load
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const data = await getPosts(1);
        setPosts(data.posts);
        setHasMore(data.page < data.totalPages);
        const newMeta = await fetchMeta(data.posts);
        setMeta(newMeta);
      } catch (err) {
        console.error("Failed to load feed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  // Load next page
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getPosts(nextPage);
      setPosts((prev) => [...prev, ...data.posts]);
      setPage(nextPage);
      setHasMore(data.page < data.totalPages);
      const newMeta = await fetchMeta(data.posts);
      setMeta((prev) => ({ ...prev, ...newMeta }));
    } catch (err) {
      console.error("Failed to load more posts", err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore]);

  // Sentinel ref for infinite scroll
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingMore) {
            loadMore();
          }
        },
        { rootMargin: "200px" }
      );
      observerRef.current.observe(node);
    },
    [hasMore, loadingMore, loadMore]
  );

  const handleToggleComments = (postId: string) => {
    setSidebarPostId((prev) => (prev === postId ? null : postId));
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
    return <div className="feed-loading">Loading feed…</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="feed-empty">
        <p>No posts yet. Be the first to share something!</p>
      </div>
    );
  }

  return (
    <div className="feed-container">
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          likeCount={meta[post._id]?.likeCount ?? 0}
          commentCount={meta[post._id]?.commentCount ?? 0}
          isLikedByMe={meta[post._id]?.isLikedByMe ?? false}
          onToggleComments={() => handleToggleComments(post._id)}
        />
      ))}

      {/* Sentinel element for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} className="feed-loading-more">
          {loadingMore && "Loading more…"}
        </div>
      )}

      {/* Comments sidebar */}
      {sidebarPostId && (
        <CommentsSidebar
          postId={sidebarPostId}
          open={!!sidebarPostId}
          onClose={() => setSidebarPostId(null)}
          onCommentCountChange={handleCommentCountChange}
        />
      )}
    </div>
  );
};

export default Dashboard;
