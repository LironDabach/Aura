import React, { useState, useRef, useEffect, useCallback } from "react";
import PostCard from "../components/PostCard";
import CommentsSidebar from "../components/CommentsSidebar";
import {
  searchPostsAi,
  getLikesForPost,
  getCommentsForPost,
} from "../services/posts";
import type { Post } from "../types/post";
import "../styles/search.css";

type PostMeta = {
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
};

const SUGGESTIONS = [
  "Show me the most liked posts",
  "Posts about technology",
  "Posts from last week with comments",
  "Posts mentioning travel",
];

const Search: React.FC = () => {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<Record<string, PostMeta>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [source, setSource] = useState<"llm" | "fallback" | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarPostId, setSidebarPostId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const activeQuery = useRef("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const fetchMeta = async (newPosts: Post[]) => {
    const userRaw = localStorage.getItem("user");
    const currentUserId = userRaw ? JSON.parse(userRaw)?._id : null;

    const entries = await Promise.all(
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
    return Object.fromEntries(entries);
  };

  const doSearch = async (q: string, pageNum = 1, append = false) => {
    if (!q.trim()) return;

    if (!append) {
      setLoading(true);
      setPosts([]);
      setMeta({});
      setError(null);
      setSearched(true);
      activeQuery.current = q;
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await searchPostsAi(q, pageNum);
      const newPosts = data.posts;

      if (append) {
        setPosts((prev) => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setPage(data.page);
      setHasMore(data.page < data.totalPages);
      setTotal(data.total);
      setSource(data.source);

      const newMeta = await fetchMeta(newPosts);
      setMeta((prev) => (append ? { ...prev, ...newMeta } : newMeta));
    } catch (err: any) {
      const message =
        err?.response?.data || err?.message || "Something went wrong";
      setError(typeof message === "string" ? message : "Search failed");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query, 1);
  };

  const handleSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    doSearch(suggestion, 1);
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    doSearch(activeQuery.current, page + 1, true);
  }, [page, loadingMore, hasMore]);

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

  return (
    <div className="search-page">
      {/* ── Hero / Search bar ── */}
      <div className={`search-hero ${searched ? "compact" : ""}`}>
        {!searched && (
          <>
            <div className="search-ai-badge">
              <span className="ai-sparkle">✦</span> AI-Powered Search
            </div>
            <h1 className="search-title">Ask anything about posts</h1>
            <p className="search-subtitle">
              Use natural language to find posts — try "most liked posts" or
              "posts about travel from last week"
            </p>
          </>
        )}

        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-input-wrapper">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              className="search-input"
              type="text"
              placeholder="Search posts with AI…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setQuery("")}
                aria-label="Clear"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="submit"
            className="search-submit-btn"
            disabled={!query.trim() || loading}
          >
            {loading ? (
              <span className="search-spinner" />
            ) : (
              <>
                <span className="ai-sparkle">✦</span> Search
              </>
            )}
          </button>
        </form>

        {!searched && (
          <div className="search-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="search-suggestion-chip"
                onClick={() => handleSuggestion(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {searched && (
        <div className="search-results">
          {/* Result info bar */}
          {!loading && !error && posts.length > 0 && (
            <div className="search-results-info">
              <span>
                {total} result{total !== 1 ? "s" : ""}
              </span>
              {source && (
                <span className={`search-source-badge ${source}`}>
                  {source === "llm" ? "✦ AI ranked" : "Text match"}
                </span>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="search-error">
              <p>{error}</p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="search-skeleton-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="search-skeleton-card">
                  <div className="skeleton-header">
                    <div className="skeleton-avatar" />
                    <div className="skeleton-lines">
                      <div className="skeleton-line short" />
                      <div className="skeleton-line shorter" />
                    </div>
                  </div>
                  <div className="skeleton-body">
                    <div className="skeleton-line" />
                    <div className="skeleton-line medium" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && !error && posts.length === 0 && (
            <div className="search-empty">
              <div className="search-empty-icon">🔍</div>
              <h3>No posts found</h3>
              <p>Try a different query or use broader terms</p>
            </div>
          )}

          {/* Post cards */}
          {!loading && posts.length > 0 && (
            <div className="search-posts-list">
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

              {hasMore && (
                <div ref={sentinelRef} className="search-loading-more">
                  {loadingMore && "Loading more…"}
                </div>
              )}
            </div>
          )}
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

export default Search;
