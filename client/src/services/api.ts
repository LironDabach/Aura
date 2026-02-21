import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:3000" });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const { data } = await axios.post("http://localhost:3000/api/auth/refresh-token", { refreshToken });
          localStorage.setItem("token", data.token);
          localStorage.setItem("refreshToken", data.refreshToken);
          original.headers.Authorization = `Bearer ${data.token}`;
          return api(original);
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export type AuthTokens = { token: string; refreshToken: string };

export type GoogleAuthResponse = AuthTokens & {
  user: {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string;
  };
};

export const register = async (data: { username: string; email: string; password: string }): Promise<AuthTokens> => {
  const res = await api.post("/api/auth/register", data);
  return res.data;
};

export const login = async (data: { username: string; password: string }): Promise<AuthTokens> => {
  const res = await api.post("/api/auth/login", data);
  return res.data;
};

export const googleLogin = async (credential: string): Promise<GoogleAuthResponse> => {
  const res = await api.post("/api/auth/google", { credential });
  return res.data;
};

export const logout = async (): Promise<void> => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (refreshToken) {
    try {
      await api.post("/api/auth/logout", { refreshToken });
    } catch (err) {
      // Ignore errors on logout
    }
  }
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

export default api;
