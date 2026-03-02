import api from "./api";
import type { Post, Like, Comment } from "../types/post";
import type { User } from "../types/user";

// ── Users ──

export const getUserById = async (userId: string): Promise<User> => {
  const res = await api.get(`/api/user/${userId}`);
  return res.data;
};

export const updateUser = async (
  userId: string,
  data: { username?: string; profilePicture?: File; removeProfilePicture?: boolean }
): Promise<User> => {
  const formData = new FormData();
  if (data.username) formData.append("username", data.username);
  if (data.profilePicture) formData.append("file", data.profilePicture);
  if (data.removeProfilePicture) formData.append("removeProfilePicture", "true");
  const res = await api.put(`/api/user/${userId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updatePost = async (
  postId: string,
  data: { title?: string; body?: string; image?: File }
): Promise<Post> => {
  const formData = new FormData();
  if (data.title) formData.append("title", data.title);
  if (data.body) formData.append("body", data.body);
  if (data.image) formData.append("file", data.image);
  const res = await api.put(`/api/post/${postId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deletePost = async (postId: string): Promise<void> => {
  await api.delete(`/api/post/${postId}`);
};

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
