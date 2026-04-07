import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import AcademicInfoPage from "./pages/AcademicInfoPage";
import Demo from "./pages/Chat";

export default function App() {
  const [user, setUser] = useState(null);

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
