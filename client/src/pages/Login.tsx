import React, { useState } from "react";
import { login } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../auth.css";
import logo from "../assets/logo.svg";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // backend expects username + email; reuse email as username for now
      const tokens = await login({ username: email, email, password } as any);
      localStorage.setItem("token", tokens.token);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      navigate("/feed");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="left-panel">
        <div className="left-inner">
          <img src={logo} className="brand-logo" alt="aura" />
        </div>
      </div>
      <div className="right-panel">
        <div className="auth-card">
          <h2>Login</h2>
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="actions">
              <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
              <button type="button" className="btn-google">Login with Google</button>
            </div>

            {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

            <div className="alt">Don't have user? <a href="/register">Subscribe</a></div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
