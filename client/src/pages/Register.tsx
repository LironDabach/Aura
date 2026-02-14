import React, { useState } from "react";
import { register } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../auth.css";
import logo from "../assets/logo.svg";

const Register: React.FC = () => {
  const [username, setUsername] = useState("");
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
      await register({ username, email, password });
      navigate("/login");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="left-panel">
        <div className="left-inner">
          <img src={logo} className="brand-logo" alt="aura" />
          <div className="brand-title">aura</div>
        </div>
      </div>
      <div className="right-panel">
        <div className="auth-card">
          <h2>Register</h2>
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="actions">
              <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Registering..." : "Register"}</button>
            </div>

            {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

            <div className="alt">Already have an account? <a href="/login">Login</a></div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
