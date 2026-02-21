
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import React from "react";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Create from "./pages/Create";
import NotFound from "./components/NotFound";
import Layout from "./components/Layout";

function App() {

  const location = useLocation();
  const RequireAuth = ({ children }: { children: React.ReactElement }) => {
    const isAuth = Boolean(localStorage.getItem("token"));
    if (!isAuth) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/feed" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><Layout><Profile /></Layout></RequireAuth>} />
      <Route path="/create" element={<RequireAuth><Layout><Create /></Layout></RequireAuth>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
