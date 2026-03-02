import { useState, useRef, useEffect, useCallback } from "react";
import PostCard from "../components/PostCard";
import CommentsSidebar from "../components/CommentsSidebar";
import { searchPostsAi, getLikesForPost, getCommentsForPost } from "../services/posts";
import type { Post } from "../types/post";
import "../styles/search.css";

// suggestions that appear before the user searches
const suggestions = [
  "Show me the most liked posts",
  "Posts about technology",
  "Posts from last week with comments",
  "Posts mentioning travel",
];

function Search() {
  // search input & results
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);

  // tells us if the results came from the AI or from regex fallback
  const [source, setSource] = useState<"llm" | "fallback" | null>(null);

  // likes & comments count for each post
  const [meta, setMeta] = useState<Record<string, {
    likeCount: number;
    commentCount: number;
    isLikedByMe: boolean;
  }>>({});

  // which post's comments sidebar is open (null = closed)
  const [sidebarPostId, setSidebarPostId] = useState<string | null>(null);

  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const activeQuery = useRef(""); // keeps track of the current query for pagination

  // auto-focus the search input on page load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * For each post, fetch its likes and comments from the server
   * and figure out if the current user already liked it
   */
  const fetchMeta = async (postsToFetch: Post[]) => {
    const userRaw = localStorage.getItem("user");
    const currentUserId = userRaw ? JSON.parse(userRaw)?._id : null;

    const results: Record<string, { likeCount: number; commentCount: number; isLikedByMe: boolean }> = {};

    for (const post of postsToFetch) {
      try {
        const [likes, comments] = await Promise.all([
          getLikesForPost(post._id),
          getCommentsForPost(post._id),
        ]);

        const didILike = currentUserId
          ? likes.some((like) => like.senderID === currentUserId)
          : false;

        results[post._id] = {
          likeCount: likes.length,
          commentCount: comments.length,
          isLikedByMe: didILike,
        };
      } catch {
        // if fetching meta fails for a post, just use zeros
        results[post._id] = { likeCount: 0, commentCount: 0, isLikedByMe: false };
      }
    }

    return results;
  };

  /**
   * Main search function - calls the AI search endpoint
   * If append=true, it adds the results to the existing list (for pagination)
   */
  const doSearch = async (searchQuery: string, pageNum = 1, append = false) => {
    if (!searchQuery.trim()) return;

    // reset state for a new search
    if (!append) {
      setLoading(true);
      setPosts([]);
      setMeta({});
      setError("");
      setSearched(true);
      activeQuery.current = searchQuery;
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await searchPostsAi(searchQuery, pageNum);

      // either append to existing posts or set new ones
      if (append) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }

      setPage(data.page);
      setHasMore(data.page < data.totalPages);
      setTotal(data.total);
      setSource(data.source);

      // fetch likes/comments for the new posts
      const newMeta = await fetchMeta(data.posts);
      if (append) {
        setMeta((prev) => ({ ...prev, ...newMeta }));
      } else {
        setMeta(newMeta);
      }
    } catch (err: any) {
      const msg = err?.response?.data || err?.message || "Something went wrong";
      setError(typeof msg === "string" ? msg : "Search failed");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query, 1);
  };

  // when user clicks a suggestion chip
  const handleSuggestion = (text: string) => {
    setQuery(text);
    doSearch(text, 1);
  };

  // load the next page of results
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    doSearch(activeQuery.current, page + 1, true);
  }, [page, loadingMore, hasMore]);

  // infinite scroll: when the sentinel div becomes visible, load more
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
        { rootMargin: "200px" },
      );
      observerRef.current.observe(node);
    },
    [hasMore, loadingMore, loadMore],
  );

  // open/close the comments sidebar
  const handleToggleComments = (postId: string) => {
    setSidebarPostId((prev) => (prev === postId ? null : postId));
  };

  // update comment count when a comment is added/deleted in the sidebar
  const handleCommentCountChange = (postId: string, delta: number) => {
    setMeta((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        commentCount: Math.max(0, (prev[postId]?.commentCount ?? 0) + delta),
      },
    }));
  };

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="search-page">

      {/* Hero section - shows title & suggestions before searching */}
      <div className={`search-hero ${searched ? "compact" : ""}`}>

        {!searched && (
          <>
            <div className="search-ai-badge">
              <span className="ai-sparkle">✦</span> AI Powered Search
            </div>
            <h1 className="search-title">Ask anything about posts</h1>
            <p className="search-subtitle">
              Use natural language to find posts try "most liked posts" or
              "posts about travel from last week"
            </p>
          </>
        )}

        {/* Search bar */}
        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
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
              <button type="button" className="search-clear-btn"
                onClick={() => setQuery("")} aria-label="Clear">
                ×
              </button>
            )}
          </div>

          <button type="submit" className="search-submit-btn"
            disabled={!query.trim() || loading}>
            {loading ? (
              <span className="search-spinner" />
            ) : (
              <><span className="ai-sparkle">✦</span> Search</>
            )}
          </button>
        </form>

        {/* Suggestion chips - only shown before first search */}
        {!searched && (
          <div className="search-suggestions">
            {suggestions.map((s) => (
              <button key={s} className="search-suggestion-chip"
                onClick={() => handleSuggestion(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results section - only shown after searching */}
      {searched && (
        <div className="search-results">

          {/* How many results + source badge */}
          {!loading && !error && posts.length > 0 && (
            <div className="search-results-info">
              <span>{total} result{total !== 1 ? "s" : ""}</span>
              {source && (
                <span className={`search-source-badge ${source}`}>
                  {source === "llm" ? "✦ AI ranked" : "Text match"}
                </span>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="search-error">
              <p>{error}</p>
            </div>
          )}

          {/* Loading skeleton (placeholder cards) */}
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

          {/* Empty state */}
          {!loading && !error && posts.length === 0 && (
            <div className="search-empty">
              <div className="search-empty-icon">🔍</div>
              <h3>No posts found</h3>
              <p>Try a different query or use broader terms</p>
            </div>
          )}

          {/* Post cards list */}
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

              {/* Sentinel div for infinite scroll */}
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
}

export default Search;
