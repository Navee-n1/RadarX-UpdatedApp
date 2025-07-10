// File: src/pages/ARRequestorDashboard.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ARRequestorDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/upload-jd");
  }, [navigate]);

  return null;
}
