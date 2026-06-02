import { useState, useEffect } from "react";
import { supabase } from "../api/supabase";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 480);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function Login() {
  const isMobile = useIsMobile();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleLogin() {
    setError("");
    const emailVal    = email.trim();
    const passwordVal = password.trim();
    if (!emailVal || !passwordVal) return setError("Email et mot de passe obligatoires");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailVal, password: passwordVal,
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (data?.session) {
      setTimeout(() => window.location.replace("/"), 500);
    } else {
      setError("Connexion echouee, reessayez.");
    }
  }

  return (
    <div style={styles.page}>
      <div style={{
        ...styles.card,
        padding:   isMobile ? 20 : 36,
        maxWidth:  isMobile ? "100%" : 420,
        borderRadius: isMobile ? 12 : 16,
        margin: isMobile ? 12 : 0,
      }}>

        {/* LOGO */}
        <div style={{ ...styles.logoWrap, marginBottom: isMobile ? 20 : 28 }}>
          <img
            src="/Logo_Omsan.jpeg"
            alt="Omsan Logistics"
            style={{ ...styles.logoImg, height: isMobile ? 44 : 55 }}
          />
          <div style={{ ...styles.logoTitle, fontSize: isMobile ? 18 : 22 }}>
            Gestion des Avaries
          </div>
          <div style={styles.logoSub}>Connectez-vous pour continuer</div>
        </div>

        {/* ERREUR */}
        {error && (
          <div style={styles.errorBox}>⚠️ {error}</div>
        )}

        {/* EMAIL */}
        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="exemple@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        {/* MOT DE PASSE */}
        <div style={styles.field}>
          <label style={styles.label}>Mot de passe</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        {/* BOUTON */}
        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1, fontSize: isMobile ? 14 : 15 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial",
    padding: 16,
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    color: "#fff",
    boxSizing: "border-box",
  },
  card: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    backdropFilter: "blur(14px)",
  },
  logoWrap: { textAlign: "center" },
  logoImg: {
    objectFit: "contain", borderRadius: 8,
    background: "#fff", padding: "6px 12px", marginBottom: 14,
  },
  logoTitle: { fontWeight: 700, color: "#fff", marginBottom: 6 },
  logoSub:   { fontSize: 13, color: "rgba(255,255,255,0.5)" },
  errorBox: {
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: 8, padding: "10px 14px",
    color: "#fca5a5", fontSize: 13, marginBottom: 16,
  },
  field: { marginBottom: 16 },
  label: {
    display: "block", fontSize: 13, fontWeight: 600,
    color: "rgba(255,255,255,0.7)", marginBottom: 6,
  },
  input: {
    width: "100%", padding: 11, borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(0,0,0,0.25)", color: "#fff",
    fontSize: 14, outline: "none", boxSizing: "border-box",
  },
  btn: {
    width: "100%", padding: 12, borderRadius: 8, border: "none",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#fff", fontWeight: 700, cursor: "pointer",
    marginTop: 8, transition: "0.2s",
  },
};
