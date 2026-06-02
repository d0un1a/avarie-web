import { useState, useEffect } from "react";
import { supabase } from "../api/supabase";
import Dashboard from "./Dashboard";
import Formulaire from "./Formulaire";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 480);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function Home() {
  const isMobile = useIsMobile();
  const [view, setView] = useState("home");
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (view === "dashboard") return <Dashboard />;
  if (view === "create") return <Formulaire onSaved={() => setView("dashboard")} />;

  return (
    <div style={styles.page}>

      {/* NAVBAR */}
      <div style={{
        ...styles.navbar,
        padding: isMobile ? "10px 16px" : "12px 30px",
      }}>
        <div style={styles.navLogo}>
          <img src="/Logo_Omsan.jpeg" alt="Omsan Logistics" style={{
            ...styles.logoImg,
            height: isMobile ? 32 : 40,
          }} />
        </div>

        <div style={styles.navRight}>
          {user && !isMobile && (
            <span style={styles.userEmail}>👤 {user.email}</span>
          )}
          <button style={{
            ...styles.logoutBtn,
            fontSize: isMobile ? 12 : 13,
            padding: isMobile ? "6px 10px" : "8px 14px",
          }} onClick={logout}>
            🚪 {isMobile ? "Exit" : "Deconnexion"}
          </button>
        </div>
      </div>

      {/* HERO */}
      <section style={{
        ...styles.hero,
        padding: isMobile ? "36px 16px 28px" : "60px 20px 40px",
      }}>
        <div style={styles.subtitle}>Gestion intelligente des avaries vehicules</div>
        <h1 style={{
          ...styles.title,
          fontSize: isMobile ? 22 : 34,
          marginBottom: isMobile ? 10 : 14,
        }}>
          Gerez vos avaries simplement et rapidement
        </h1>
        <p style={{ ...styles.text, fontSize: isMobile ? 14 : 16 }}>
          Centralisez les degats, photos, cotations et informations vehicules dans un seul outil.
        </p>
      </section>

      {/* ACTIONS */}
      <section style={{
        ...styles.grid,
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))",
        gap: isMobile ? 12 : 20,
        padding: isMobile ? "0 16px" : "0 20px",
      }}>
        <div
          style={{ ...styles.card, padding: isMobile ? 20 : 25 }}
          onClick={() => setView("create")}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.13)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
        >
          <div style={{ ...styles.icon, fontSize: isMobile ? 26 : 30 }}>➕</div>
          <h3 style={{ fontSize: isMobile ? 16 : 18, margin:"8px 0 6px" }}>Creer une avarie</h3>
          <p style={{ fontSize: isMobile ? 13 : 14, opacity:0.7, margin:0 }}>
            Ajouter un nouveau dossier avec photos et cotation
          </p>
        </div>

        <div
          style={{ ...styles.card, padding: isMobile ? 20 : 25 }}
          onClick={() => setView("dashboard")}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.13)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
        >
          <div style={{ ...styles.icon, fontSize: isMobile ? 26 : 30 }}>📋</div>
          <h3 style={{ fontSize: isMobile ? 16 : 18, margin:"8px 0 6px" }}>Voir la liste</h3>
          <p style={{ fontSize: isMobile ? 13 : 14, opacity:0.7, margin:0 }}>
            Consulter, modifier et exporter les avaries
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} Omsan Logistics - Avaries Manager</p>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "Arial",
  },
  navbar: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxSizing: "border-box",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(10px)",
  },
  navLogo: { display:"flex", alignItems:"center" },
  logoImg: {
    objectFit: "contain", borderRadius: 6,
    background: "#fff", padding: "4px 8px",
  },
  navRight: { display:"flex", alignItems:"center", gap:12 },
  userEmail: { fontSize:13, color:"rgba(255,255,255,0.7)" },
  logoutBtn: {
    border: "none", borderRadius: 8,
    background: "#e74c3c", color: "#fff",
    cursor: "pointer", fontWeight: 600,
  },
  hero: {
    textAlign: "center",
    maxWidth: 700,
    width: "100%",
    boxSizing: "border-box",
  },
  subtitle: { opacity:0.6, fontSize:14, marginBottom:12 },
  title: { lineHeight:1.3, fontWeight:700 },
  text: { opacity:0.8 },
  grid: {
    display: "grid",
    width: "100%",
    maxWidth: 800,
    boxSizing: "border-box",
  },
  card: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 16,
    cursor: "pointer",
    transition: "background 0.2s",
    textAlign: "center",
    backdropFilter: "blur(10px)",
  },
  icon: { marginBottom:8 },
  footer: { marginTop:"auto", padding:20, opacity:0.5, fontSize:12 },
};
