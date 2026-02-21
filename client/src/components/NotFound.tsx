import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => (
  <div style={{
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8f8f8"
  }}>
    <h1 style={{ fontSize: 64, margin: 0, color: '#e74c3c' }}>404</h1>
    <h2 style={{ margin: 0 }}>Page Not Found</h2>
    <p style={{ margin: 12 }}>The page you are looking for does not exist.</p>
    <Link to="/feed" style={{ color: '#3498db', textDecoration: 'underline', fontSize: 18 }}>Go to Feed</Link>
  </div>
);

export default NotFound;
