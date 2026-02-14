import React, { useState } from "react";
import { login } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../auth.css";
import logo from "../assets/logo.svg";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const tokens = await login({ username, password });
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
              <label>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required />
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

            <div className="alt">Don't have an account? <Link to="/register">Register</Link></div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
