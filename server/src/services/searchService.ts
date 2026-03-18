import postsModel from "../models/postsModel";
import commentsModel from "../models/commentsModel";
import likesModel from "../models/likesModel";
import llmService, { LlmService } from "./llmService";

export class SearchValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SearchValidationError";
  }
}

type SearchResult = {
  posts: any[];
  page: number;
  totalPages: number;
  total: number;
  source: "llm" | "fallback";
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class SearchService {
  private postModel: typeof postsModel;
  private llm: LlmService;
  private likes = likesModel;
  private comments = commentsModel;

  constructor(postModel = postsModel, llm = llmService) {
    this.postModel = postModel;
    this.llm = llm;
  }

  private normalizeInput(query: string) {
    const safe = (query || "")
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return safe.slice(0, 300);
  }

  private parseHumanConstraints(query: string) {
    const normalized = this.normalizeInput(query);
    const lower = normalized.toLowerCase();
    const quotedKeywordMatch = normalized.match(/["']([^"']{1,120})["']/);
    const explicitKeyword = quotedKeywordMatch?.[1]?.trim();
    const wantsMostLiked =
      /\b(?:most liked|top liked|highest liked|most likes|highest likes)\b/.test(lower);
    const wantsMostCommented =
      /\b(?:most commented|top commented|most comments|highest comments)\b/.test(lower);

    const minLikesMatch = lower.match(/(?:at least|min)\s+(\d+)\s+likes?/) ||
      lower.match(/(\d+)\s*\+?\s*likes?/);
    const minCommentsMatch =
      lower.match(/(?:at least|min)\s+(\d+)\s+comments?/) ||
      lower.match(/(\d+)\s*\+?\s*comments?/);
    const lastXMatch = lower.match(/last\s+(\d+)\s+(day|days|week|weeks|month|months)/);
    const hasLastWeek = /\blast\s+week\b/.test(lower);
    const hasLastMonth = /\blast\s+month\b/.test(lower);

    const minLikes = minLikesMatch ? Number(minLikesMatch[1]) : 0;
    let minComments = minCommentsMatch ? Number(minCommentsMatch[1]) : 0;
    let earliestDate: Date | undefined;

    // If user asks for "likes and comment" without an explicit comment number,
    // interpret it as at least one comment.
    if (!minComments && /\bcomments?\b/.test(lower) && /\blikes?\b/.test(lower)) {
      minComments = 1;
    }

    if (lastXMatch) {
      const amount = Number(lastXMatch[1]);
      const unit = lastXMatch[2];
      const dayMultiplier = unit.startsWith("week") ? 7 : unit.startsWith("month") ? 30 : 1;
      earliestDate = new Date(Date.now() - amount * dayMultiplier * 24 * 60 * 60 * 1000);
    } else if (hasLastWeek) {
      earliestDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (hasLastMonth) {
      earliestDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const withoutCountPhrases = lower
      .replace(/(?:at least|min)\s+\d+\s+likes?/g, " ")
      .replace(/(?:at least|min)\s+\d+\s+comments?/g, " ")
      .replace(/\d+\s*\+?\s*likes?/g, " ")
      .replace(/\d+\s*\+?\s*comments?/g, " ")
      .replace(/last\s+\d+\s+(?:day|days|week|weeks|month|months)/g, " ")
      .replace(/\blast\s+week\b/g, " ")
      .replace(/\blast\s+month\b/g, " ")
      .replace(/["'][^"']{1,120}["']/g, " ")
      .replace(
        /\b(?:please|search|for|posts?|post|that|contains?|with|and|the|a|an|likes?|comments?|from|last|day|days|week|weeks|month|months|mention|mentions|in|body|title|keyword)\b/g,
        " ",
      )
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      normalizedQuery: normalized,
      textQuery: explicitKeyword || withoutCountPhrases,
      explicitKeyword,
      minLikes,
      minComments,
      earliestDate,
      wantsMostLiked,
      wantsMostCommented,
    };
  }

  private buildExactKeywordRegex(keyword: string) {
    const escaped = escapeRegex(keyword.trim());
    if (!escaped) {
      return null;
    }

    if (!/\s/.test(keyword.trim())) {
      return new RegExp(`\\b${escaped}\\b`, "i");
    }

    const normalizedPhrase = escaped.replace(/\s+/g, "\\s+");
    return new RegExp(normalizedPhrase, "i");
  }

  private sortCandidates(
    posts: any[],
    countsByPostId: Map<string, { likes: number; comments: number }>,
    mode: "mostLiked" | "mostCommented" | "signals" | "recent"
  ) {
    const getCounts = (post: any) =>
      countsByPostId.get(post._id.toString()) || { likes: 0, comments: 0 };

    return [...posts].sort((a, b) => {
      const aCounts = getCounts(a);
      const bCounts = getCounts(b);

      if (mode === "mostLiked") {
        if (bCounts.likes !== aCounts.likes) {
          return bCounts.likes - aCounts.likes;
        }
        if (bCounts.comments !== aCounts.comments) {
          return bCounts.comments - aCounts.comments;
        }
      } else if (mode === "mostCommented") {
        if (bCounts.comments !== aCounts.comments) {
          return bCounts.comments - aCounts.comments;
        }
        if (bCounts.likes !== aCounts.likes) {
          return bCounts.likes - aCounts.likes;
        }
      } else if (mode === "signals") {
        if (bCounts.likes !== aCounts.likes) {
          return bCounts.likes - aCounts.likes;
        }
        if (bCounts.comments !== aCounts.comments) {
          return bCounts.comments - aCounts.comments;
        }
      }

      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  private buildPrompt(query: string, candidates: any[], countsByPostId: Map<string, { likes: number; comments: number }>) {
    const compactCandidates = candidates.map((post) => ({
      id: post._id.toString(),
      title: post.title,
      body: post.body,
      likes: countsByPostId.get(post._id.toString())?.likes || 0,
      comments: countsByPostId.get(post._id.toString())?.comments || 0,
    }));

    return [
      "You rank social media posts for search relevance.",
      `Query: "${query}"`,
      "Return strict JSON only, with schema:",
      '{"postIds":["id1","id2"]}',
      "Rules:",
      "1) Include only IDs from candidates.",
      "2) Sort by best match first.",
      "3) Return up to 20 ids.",
      `Candidates: ${JSON.stringify(compactCandidates)}`,
    ].join("\n");
  }

  private parseRankedIds(rawResponse: string, validIds: Set<string>) {
    const parsed = JSON.parse(rawResponse);
    const ids = Array.isArray(parsed?.postIds) ? parsed.postIds : [];
    const rankedIds: string[] = [];

    for (const id of ids) {
      if (typeof id !== "string") {
        continue;
      }
      if (!validIds.has(id) || rankedIds.includes(id)) {
        continue;
      }
      rankedIds.push(id);
    }

    return rankedIds;
  }

  private async regexFallback(
    query: string,
    page: number,
    limit: number,
    allowedPostIds: string[]
  ): Promise<SearchResult> {
    const regex = new RegExp(escapeRegex(query), "i");
    const filter: any = {
      _id: { $in: allowedPostIds },
      $or: [{ title: regex }, { body: regex }],
    };
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .populate("senderID", "username profilePicture")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      this.postModel.countDocuments(filter),
    ]);

    return {
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      source: "fallback",
    };
  }

  async searchPostsAi(query: string, page: number, limit: number): Promise<SearchResult> {
    const parsed = this.parseHumanConstraints(query);
    if (!parsed.normalizedQuery) {
      throw new SearchValidationError("Query is required");
    }
    if (!/[a-zA-Z0-9]/.test(parsed.normalizedQuery)) {
      throw new SearchValidationError("Query must include letters or numbers");
    }

    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.max(1, limit || 5);
    const allPosts = await this.postModel
      .find()
      .populate("senderID", "username profilePicture")
      .sort({ date: -1 });

    if (!allPosts.length) {
      return {
        posts: [],
        page: safePage,
        totalPages: 0,
        total: 0,
        source: "llm",
      };
    }

    const postIds = allPosts.map((post) => post._id);
    const [likesAgg, commentsAgg] = await Promise.all([
      this.likes.aggregate([
        { $match: { postID: { $in: postIds } } },
        { $group: { _id: "$postID", count: { $sum: 1 } } },
      ]),
      this.comments.aggregate([
        { $match: { postID: { $in: postIds } } },
        { $group: { _id: "$postID", count: { $sum: 1 } } },
      ]),
    ]);

    const likesByPostId = new Map<string, number>();
    likesAgg.forEach((row: any) => {
      likesByPostId.set(row._id.toString(), row.count);
    });
    const commentsByPostId = new Map<string, number>();
    commentsAgg.forEach((row: any) => {
      commentsByPostId.set(row._id.toString(), row.count);
    });

    const countsByPostId = new Map<string, { likes: number; comments: number }>();
    allPosts.forEach((post) => {
      const id = post._id.toString();
      countsByPostId.set(id, {
        likes: likesByPostId.get(id) || 0,
        comments: commentsByPostId.get(id) || 0,
      });
    });

    const exactKeywordRegex = parsed.explicitKeyword
      ? this.buildExactKeywordRegex(parsed.explicitKeyword)
      : null;

    const candidates = allPosts.filter((post) => {
      const counts = countsByPostId.get(post._id.toString()) || { likes: 0, comments: 0 };
      if (counts.likes < parsed.minLikes) {
        return false;
      }
      if (counts.comments < parsed.minComments) {
        return false;
      }
      if (parsed.earliestDate && new Date(post.date).getTime() < parsed.earliestDate.getTime()) {
        return false;
      }
      if (exactKeywordRegex) {
        const haystack = `${post.title || ""} ${post.body || ""}`;
        if (!exactKeywordRegex.test(haystack)) {
          return false;
        }
      }
      return true;
    });

    if (!candidates.length) {
      return {
        posts: [],
        page: safePage,
        totalPages: 0,
        total: 0,
        source: "fallback",
      };
    }

    if (
      parsed.wantsMostLiked ||
      parsed.wantsMostCommented ||
      parsed.minLikes > 0 ||
      parsed.minComments > 0 ||
      parsed.earliestDate ||
      parsed.explicitKeyword
    ) {
      let deterministicPosts = candidates;

      if (parsed.wantsMostLiked) {
        const maxLikes = Math.max(
          ...candidates.map((post) => countsByPostId.get(post._id.toString())?.likes || 0),
        );
        deterministicPosts = candidates.filter(
          (post) => (countsByPostId.get(post._id.toString())?.likes || 0) === maxLikes,
        );
      } else if (parsed.wantsMostCommented) {
        const maxComments = Math.max(
          ...candidates.map((post) => countsByPostId.get(post._id.toString())?.comments || 0),
        );
        deterministicPosts = candidates.filter(
          (post) => (countsByPostId.get(post._id.toString())?.comments || 0) === maxComments,
        );
      }

      const sortMode = parsed.wantsMostLiked
        ? "mostLiked"
        : parsed.wantsMostCommented
          ? "mostCommented"
          : parsed.minLikes > 0 || parsed.minComments > 0
            ? "signals"
            : "recent";
      const sortedPosts = this.sortCandidates(deterministicPosts, countsByPostId, sortMode);
      const total = sortedPosts.length;
      const start = (safePage - 1) * safeLimit;

      return {
        posts: sortedPosts.slice(start, start + safeLimit),
        page: safePage,
        totalPages: Math.ceil(total / safeLimit),
        total,
        source: "fallback",
      };
    }

    const validIds = new Set(candidates.map((post) => post._id.toString()));
    const prompt = this.buildPrompt(parsed.normalizedQuery, candidates, countsByPostId);

    try {
      const response = await this.llm.generate({
        prompt,
        format: "json",
        options: {
          temperature: 0.1,
          top_p: 0.9,
          num_predict: 300,
        },
      });

      const rankedIds = this.parseRankedIds(response.response, validIds);
      if (!rankedIds.length && parsed.textQuery) {
        return this.regexFallback(
          parsed.textQuery,
          safePage,
          safeLimit,
          candidates.map((post) => post._id.toString()),
        );
      }
      const rankedPosts = rankedIds
        .map((id) => candidates.find((post) => post._id.toString() === id))
        .filter(Boolean) as any[];

      const total = rankedPosts.length;
      const start = (safePage - 1) * safeLimit;
      const pagedPosts = rankedPosts.slice(start, start + safeLimit);

      return {
        posts: pagedPosts,
        page: safePage,
        totalPages: Math.ceil(total / safeLimit),
        total,
        source: "llm",
      };
    } catch (error) {
      if (!parsed.textQuery) {
        const total = candidates.length;
        const start = (safePage - 1) * safeLimit;
        return {
          posts: candidates.slice(start, start + safeLimit),
          page: safePage,
          totalPages: Math.ceil(total / safeLimit),
          total,
          source: "fallback",
        };
      }
      return this.regexFallback(
        parsed.textQuery,
        safePage,
        safeLimit,
        candidates.map((post) => post._id.toString()),
      );
    }
  }
}

export default new SearchService();
export { SearchService };
