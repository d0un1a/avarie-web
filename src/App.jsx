import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./api/supabase";
import { initProfile } from "./config/appConfig"; // ✅ Initialiser le profil au démarrage
import Home from "./pages/Home";
import Login from "./pages/Login";

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a, #1e293b)",
      color: "#fff",
      fontSize: 18,
      fontFamily: "Arial",
      gap: 12,
    }}>
      <span style={{ fontSize: 28 }}>🚗</span>
      Chargement...
    </div>
  );
}

function PrivateRoute({ children, user, loading }) {
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children, user, loading }) {
  if (loading) return <LoadingScreen />;
  return !user ? children : <Navigate to="/" replace />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Initialiser le profil au démarrage
    const company = initProfile();
    console.log(`🏢 Profil actif: ${company}`);

    // ✅ Écoute les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // ✅ Vérifie la session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/login"
          element={
            <PublicRoute user={user} loading={loading}>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/"
          element={
            <PrivateRoute user={user} loading={loading}>
              <Home />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
