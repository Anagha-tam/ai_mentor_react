import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import AcademicInfoPage from "./pages/AcademicInfoPage";
import Demo from "./pages/Chat";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [adminToken, setAdminToken] = useState(
    () => localStorage.getItem('ai_mentor_admin_token') || ''
  );

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user data from localStorage:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Helper to check if onboarding is complete
  const isProfileComplete = (u) => {
    return u && (u.stream || u.class);
  };

  const handleProfileComplete = (academicData) => {
    setUser(prev => {
      const updatedUser = { ...prev, ...academicData };
      localStorage.setItem("user", JSON.stringify(updatedUser)); // Persist the completion!
      return updatedUser;
    });
  };

  return (
    <Routes>

      {/* Login */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={isProfileComplete(user) ? "/chat" : "/academic-info"} />
          ) : (
            <LoginPage onLoginSuccess={(u) => setUser(u)} />
          )
        }
      />

      {/* Signup */}
      <Route
        path="/signup"
        element={
          user ? (
            <Navigate to={isProfileComplete(user) ? "/chat" : "/academic-info"} />
          ) : (
            <SignUpPage />
          )
        }
      />

      {/* Academic Info */}
      <Route
        path="/academic-info"
        element={
          user ? (
            isProfileComplete(user) ? (
              <Navigate to="/chat" />
            ) : (
              <AcademicInfoPage 
                user={user} 
                onProfileComplete={handleProfileComplete} 
              />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* Chat */}
      <Route
        path="/chat"
        element={
          user ? (
            isProfileComplete(user) ? (
              <Demo user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/academic-info" />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* Admin Login */}
      <Route
        path="/admin"
        element={
          adminToken
            ? <Navigate to="/admin/dashboard" />
            : <AdminLoginPage onLoginSuccess={(t) => {
                localStorage.setItem('ai_mentor_admin_token', t);
                setAdminToken(t);
              }} />
        }
      />

      {/* Admin Dashboard */}
      <Route
        path="/admin/dashboard"
        element={
          adminToken
            ? <AdminDashboardPage onLogout={() => {
                localStorage.removeItem('ai_mentor_admin_token');
                setAdminToken('');
              }} />
            : <Navigate to="/admin" />
        }
      />

      {/* Default */}
      <Route
        path="*"
        element={
          <Navigate
            to={
              user
                ? (isProfileComplete(user) ? "/chat" : "/academic-info")
                : "/login"
            }
          />
        }
      />

    </Routes>
  );
}
