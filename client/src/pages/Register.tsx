import { useState, type FormEvent } from "react";
import { register, googleLogin } from "../services/api";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import "../auth.css";
import logo from "../assets/logo.svg";

// Registration page with Google OAuth option
function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate username: only English letters and numbers, no spaces
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setError("Username can only contain English letters and numbers (no spaces or special characters)");
      return;
    }
    
    setLoading(true);
    try {
      const response = await register({ username, email, password });
      localStorage.setItem("token", response.token);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.user));
      navigate("/feed");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
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
      setError(err?.response?.data?.message || "Google sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign up failed");
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
              <div className="google-btn-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  width="100%"
                  text="signup_with"
                  shape="rectangular"
                />
              </div>
            </div>

            {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

            <div className="alt">Already have an account? <a href="/login">Login</a></div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
