import { useState, type FormEvent } from "react";
import { login, googleLogin } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import "../auth.css";
import logo from "../assets/logo.svg";

// Login page with username/password and Google OAuth
function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await login({ username, password });
      localStorage.setItem("token", response.token);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.user));
      navigate("/feed");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError(null);
    setLoading(true);
    try {
      const response = await googleLogin(credentialResponse.credential);
      localStorage.setItem("token", response.token);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.user));
      navigate("/feed");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed");
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
              <div className="google-btn-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  width="100%"
                  text="signin_with"
                  shape="rectangular"
                />
              </div>
            </div>

            {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

            <div className="alt">Don't have an account? <Link to="/register">Register</Link></div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
