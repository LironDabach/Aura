"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = exports.SearchValidationError = void 0;
const postsModel_1 = __importDefault(require("../models/postsModel"));
const commentsModel_1 = __importDefault(require("../models/commentsModel"));
const likesModel_1 = __importDefault(require("../models/likesModel"));
const llmService_1 = __importDefault(require("./llmService"));
class SearchValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "SearchValidationError";
    }
}
exports.SearchValidationError = SearchValidationError;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
class SearchService {
    constructor(postModel = postsModel_1.default, llm = llmService_1.default) {
        this.likes = likesModel_1.default;
        this.comments = commentsModel_1.default;
        this.postModel = postModel;
        this.llm = llm;
    }
    normalizeInput(query) {
        const safe = (query || "")
            .replace(/[\u0000-\u001F\u007F]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        return safe.slice(0, 300);
    }
    parseHumanConstraints(query) {
        var _a;
        const normalized = this.normalizeInput(query);
        const lower = normalized.toLowerCase();
        const quotedKeywordMatch = normalized.match(/["']([^"']{1,120})["']/);
        const explicitKeyword = (_a = quotedKeywordMatch === null || quotedKeywordMatch === void 0 ? void 0 : quotedKeywordMatch[1]) === null || _a === void 0 ? void 0 : _a.trim();
        const minLikesMatch = lower.match(/(?:at least|min)\s+(\d+)\s+likes?/) ||
            lower.match(/(\d+)\s*\+?\s*likes?/);
        const minCommentsMatch = lower.match(/(?:at least|min)\s+(\d+)\s+comments?/) ||
            lower.match(/(\d+)\s*\+?\s*comments?/);
        const lastXMatch = lower.match(/last\s+(\d+)\s+(day|days|week|weeks|month|months)/);
        const hasLastWeek = /\blast\s+week\b/.test(lower);
        const hasLastMonth = /\blast\s+month\b/.test(lower);
        const minLikes = minLikesMatch ? Number(minLikesMatch[1]) : 0;
        let minComments = minCommentsMatch ? Number(minCommentsMatch[1]) : 0;
        let earliestDate;
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
        }
        else if (hasLastWeek) {
            earliestDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        }
        else if (hasLastMonth) {
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
            .replace(/\b(?:please|search|for|posts?|post|that|contains?|with|and|the|a|an|likes?|comments?|from|last|day|days|week|weeks|month|months|mention|mentions|in|body|title|keyword)\b/g, " ")
            .replace(/[^\w\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        return {
            normalizedQuery: normalized,
            textQuery: explicitKeyword || withoutCountPhrases,
            minLikes,
            minComments,
            earliestDate,
        };
    }
    buildPrompt(query, candidates, countsByPostId) {
        const compactCandidates = candidates.map((post) => {
            var _a, _b;
            return ({
                id: post._id.toString(),
                title: post.title,
                body: post.body,
                likes: ((_a = countsByPostId.get(post._id.toString())) === null || _a === void 0 ? void 0 : _a.likes) || 0,
                comments: ((_b = countsByPostId.get(post._id.toString())) === null || _b === void 0 ? void 0 : _b.comments) || 0,
            });
        });
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
    parseRankedIds(rawResponse, validIds) {
        const parsed = JSON.parse(rawResponse);
        const ids = Array.isArray(parsed === null || parsed === void 0 ? void 0 : parsed.postIds) ? parsed.postIds : [];
        const rankedIds = [];
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
    regexFallback(query, page, limit, allowedPostIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const regex = new RegExp(escapeRegex(query), "i");
            const filter = {
                _id: { $in: allowedPostIds },
                $or: [{ title: regex }, { body: regex }],
            };
            const skip = (page - 1) * limit;
            const [posts, total] = yield Promise.all([
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
        });
    }
    searchPostsAi(query, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const parsed = this.parseHumanConstraints(query);
            if (!parsed.normalizedQuery) {
                throw new SearchValidationError("Query is required");
            }
            if (!/[a-zA-Z0-9]/.test(parsed.normalizedQuery)) {
                throw new SearchValidationError("Query must include letters or numbers");
            }
            const safePage = Math.max(1, page || 1);
            const safeLimit = Math.max(1, limit || 5);
            const candidateLimit = Math.max(40, safeLimit * 8);
            const recentPosts = yield this.postModel
                .find()
                .populate("senderID", "username profilePicture")
                .sort({ date: -1 })
                .limit(candidateLimit);
            if (!recentPosts.length) {
                return {
                    posts: [],
                    page: safePage,
                    totalPages: 0,
                    total: 0,
                    source: "llm",
                };
            }
            const postIds = recentPosts.map((post) => post._id);
            const [likesAgg, commentsAgg] = yield Promise.all([
                this.likes.aggregate([
                    { $match: { postID: { $in: postIds } } },
                    { $group: { _id: "$postID", count: { $sum: 1 } } },
                ]),
                this.comments.aggregate([
                    { $match: { postID: { $in: postIds } } },
                    { $group: { _id: "$postID", count: { $sum: 1 } } },
                ]),
            ]);
            const likesByPostId = new Map();
            likesAgg.forEach((row) => {
                likesByPostId.set(row._id.toString(), row.count);
            });
            const commentsByPostId = new Map();
            commentsAgg.forEach((row) => {
                commentsByPostId.set(row._id.toString(), row.count);
            });
            const countsByPostId = new Map();
            recentPosts.forEach((post) => {
                const id = post._id.toString();
                countsByPostId.set(id, {
                    likes: likesByPostId.get(id) || 0,
                    comments: commentsByPostId.get(id) || 0,
                });
            });
            const candidates = recentPosts.filter((post) => {
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
            const validIds = new Set(candidates.map((post) => post._id.toString()));
            const prompt = this.buildPrompt(parsed.normalizedQuery, candidates, countsByPostId);
            try {
                const response = yield this.llm.generate({
                    prompt,
                    format: "json",
                    options: {
                        temperature: 0.1,
                        top_p: 0.9,
                        num_predict: 300,
                    },
                });
                const rankedIds = this.parseRankedIds(response.response, validIds);
                const rankedPosts = rankedIds
                    .map((id) => candidates.find((post) => post._id.toString() === id))
                    .filter(Boolean);
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
            }
            catch (error) {
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
                return this.regexFallback(parsed.textQuery, safePage, safeLimit, candidates.map((post) => post._id.toString()));
            }
        });
    }
}
exports.SearchService = SearchService;
exports.default = new SearchService();
//# sourceMappingURL=searchService.js.map