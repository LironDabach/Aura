import { type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../services/api";
import "../styles/layout.css";
import logo from "../assets/logo.svg";

// Main layout wrapper — shows the navbar on all pages except login/register
function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const hideNav = location.pathname === "/login" || location.pathname === "/register";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div>
      {!hideNav && (
        <nav className="navbar">
          <Link to="/feed" className="navbar-brand">
            <div
              className="navbar-logo"
              style={{
                background: "#0075FF",
                borderRadius: "0%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img src={logo} alt="aura" style={{ width: 20, height: 20 }} />
            </div>
            <div className="navbar-brand-text">
              <span className="navbar-brand-name">aura</span>
              <span className="navbar-brand-tagline">Your moment to shine</span>
            </div>
          </Link>

          <div className="navbar-links">
            <NavLink to="/feed" className={({ isActive }) => isActive ? "active" : ""}>
              Feed
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""}>
              Profile
            </NavLink>
            <NavLink to="/create" className={({ isActive }) => isActive ? "active" : ""}>
              Create
            </NavLink>
            <NavLink to="/search" className={({ isActive }) => isActive ? "active" : ""}>
              <span className="ai-icon">✦</span>Search with AI
            </NavLink>
          </div>

          <div className="navbar-actions">
            <button className="navbar-logout-btn" onClick={handleLogout} title="Logout" aria-label="Logout">
              {/* אייקון יציאה (דלת עם חץ) */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </nav>
      )}
      <div className="page-shell">{children}</div>
    </div>
  );
}

export default Layout;
