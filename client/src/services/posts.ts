import api from "./api";
import type { Post, Like, Comment } from "../types/post";

// ── Posts ──

export type PaginatedPosts = {
  posts: Post[];
  page: number;
  totalPages: number;
  total: number;
};

export const getPosts = async (page = 1, limit?: number): Promise<PaginatedPosts> => {
  const params: Record<string, number> = { page };
  if (limit) params.limit = limit;
  const res = await api.get("/api/post", { params });
  return res.data;
};

export const getPostById = async (id: string): Promise<Post> => {
  const res = await api.get(`/api/post/${id}`);
  return res.data;
};

export const getPostsByUser = async (userId: string): Promise<Post[]> => {
  const res = await api.get(`/api/post/user/${userId}`);
  return res.data;
};

export const createPost = async (data: { title: string; body: string }): Promise<Post> => {
  const res = await api.post("/api/post", data);
  return res.data;
};

// ── Likes ──

export const getLikesForPost = async (postId: string): Promise<Like[]> => {
  const res = await api.get(`/api/like/post/${postId}`);
  return res.data;
};

export const likePost = async (postId: string): Promise<Like> => {
  const res = await api.post(`/api/like/post/${postId}`);
  return res.data;
};

export const unlikePost = async (postId: string): Promise<void> => {
  await api.delete(`/api/like/post/${postId}`);
};

// ── Comments ──

export const getCommentsForPost = async (postId: string): Promise<Comment[]> => {
  const res = await api.get(`/api/comment/post/${postId}`);
  return res.data;
};

export const addComment = async (postId: string, content: string): Promise<Comment> => {
  const res = await api.post(`/api/comment/post/${postId}`, { content });
  return res.data;
};

export const updateComment = async (
  postId: string,
  commentId: string,
  content: string
): Promise<Comment> => {
  const res = await api.put(`/api/comment/post/${postId}/${commentId}`, { content });
  return res.data;
};

export const deleteComment = async (
  postId: string,
  commentId: string
): Promise<void> => {
  await api.delete(`/api/comment/post/${postId}/${commentId}`);
};
