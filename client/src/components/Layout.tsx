import React from "react";
import { Link, useLocation } from "react-router-dom";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideNav = location.pathname === "/login" || location.pathname === "/register";
  return (
    <div>
      {!hideNav && (
        <nav style={{ display: "flex", gap: 12, padding: 12 }}>
          <Link to="/">Home</Link>
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
          <Link to="/feed">Feed</Link>
        </nav>
      )}
      {children}
    </div>
  );
};

export default Layout;
