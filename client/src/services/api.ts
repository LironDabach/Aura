import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:3000" });

export type AuthTokens = { token: string; refreshToken: string };

export const register = async (data: { username: string; email: string; password: string }): Promise<AuthTokens> => {
  const res = await api.post("/api/auth/register", data);
  return res.data;
};

export const login = async (data: { username: string; password: string }): Promise<AuthTokens> => {
  const res = await api.post("/api/auth/login", data);
  return res.data;
};

export default api;
