// File: src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import ARDashboardLayout from './layouts/ARDashboardLayout';
import ARRequestorDashboard from './pages/ARRequestorDashboard';
import UploadJDPage from './pages/uploadJDPage';
import ResumeToJDPage from './pages/ResumeToJDPage';
import RecruiterDashboard from './pages/RecruiterDashboard';
import OneToOneMatchSection from './components/OneToOneMatchSection';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import ViewSingleJD from './pages/ViewSingleJD';
import ViewJDMatches from './components/ViewJDMatches';

const App = () => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    window.location.href = "/";
  };

  return (

      <Routes>
        <Route path="/" element={<LoginPage />} />
         <Route path="/frontman" element={<AdminLoginPage />} />
         <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />



        <Route
          path="/recruiter-dashboard"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <RecruiterDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ar-dashboard"
          element={
            <ProtectedRoute requiredRole="ar">
              <ARRequestorDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload-jd"
          element={
            <ProtectedRoute requiredRole="ar">
              
                <UploadJDPage />
              
            </ProtectedRoute>
          }
        />

        <Route
          path="/resume-to-jd"
          element={
            <ProtectedRoute requiredRole="ar">
              <ARDashboardLayout>
                <ResumeToJDPage />
              </ARDashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/one-to-one-match"
          element={
            <ProtectedRoute requiredRole="ar">
              <ARDashboardLayout>
                <OneToOneMatchSection />
              </ARDashboardLayout>
            </ProtectedRoute>
          }
        />
      <Route path="/recruiter" element={
  <ProtectedRoute requiredRole="recruiter">
    <RecruiterDashboard />
  </ProtectedRoute>
}>
  <Route path="view-jds" element={<ViewJDMatches />} />
</Route>
 
<Route
  path="/recruiter/view-jd/:id"
  element={
    <ProtectedRoute requiredRole="recruiter">
      <ViewSingleJD />
    </ProtectedRoute>
  }
/>
        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
   
  );
};

export default App;
