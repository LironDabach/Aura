import axios from "axios";

const api = axios.create({ baseURL: "/" });

export type AuthTokens = { token: string; refreshToken: string };

export const register = async (data: { username: string; email: string; password: string }): Promise<AuthTokens> => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

export const login = async (data: { username: string; email: string; password: string }): Promise<AuthTokens> => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

export default api;
