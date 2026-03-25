import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import Demo from "./pages/Chat";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <Routes>

      {/* Login */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/chat" />
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
            <Navigate to="/chat" />
          ) : (
            <SignUpPage />
          )
        }
      />

      {/* Chat */}
      <Route
        path="/chat"
        element={
          user ? (
            <Demo user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* Default */}
      <Route
        path="*"
        element={<Navigate to={user ? "/chat" : "/login"} />}
      />

    </Routes>
  );
}