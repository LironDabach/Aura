import { Link, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import React from "react";
import "./App.css";

const Home: React.FC = () => (
  <div style={{ padding: 20 }}>
    <h1>Welcome</h1>
    <p>
      Use the navigation to Register or Login. After logging in you'll be
      redirected to the feed.
    </p>
  </div>
);

const FeedPlaceholder: React.FC = () => (
  <div style={{ padding: 20 }}>
    <h2>Main Feed</h2>
    <p>Feed content will appear here.</p>
  </div>
);

function App() {
  const location = useLocation();
  const hideNav = location.pathname === "/login" || location.pathname === "/register";

  const RequireAuth = ({ children }: { children: JSX.Element }) => {
    const isAuth = Boolean(localStorage.getItem("token"));
    if (!isAuth) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
  };

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

      <Routes>
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/feed"
          element={
            <RequireAuth>
              <FeedPlaceholder />
            </RequireAuth>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
