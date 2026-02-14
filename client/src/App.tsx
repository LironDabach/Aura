
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import React from "react";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
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
      <Route path="/" element={<RequireAuth><Layout><Home /></Layout></RequireAuth>} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/feed" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
