// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase(); // normalize casing
  const expected = (requiredRole || "").toLowerCase(); // normalize

  // Debug log
  console.log("[ProtectedRoute] token:", token, "role:", role, "required:", expected);

  if (!token) {
    console.warn("No token found. Redirecting to login.");
    return <Navigate to="/" replace />;
  }

  if (expected && role !== expected) {
    console.warn("Role mismatch. Access denied.");
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
