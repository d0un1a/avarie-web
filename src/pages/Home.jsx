import { useState, useEffect } from "react";
import { supabase } from "../api/supabase";
import Dashboard from "./Dashboard";
import Formulaire from "./Formulaire";

export default function Home() {
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
  if (view === "create")
    return <Formulaire onSaved={() => setView("dashboard")} />;

  return (
    <div style={styles.page}>

      {/* NAVBAR */}
      <div style={styles.navbar}>

        {/* LOGO OMSAN — depuis public/ */}
        <div style={styles.navLogo}>
          <img
            src="/Logo_Omsan.jpeg"
            alt="Omsan Logistics"
            style={styles.logoImg}
          />
        </div>

        {/* RIGHT */}
        <div style={styles.navRight}>
          {user && (
            <span style={styles.userEmail}>👤 {user.email}</span>
          )}
          <button style={styles.logoutBtn} onClick={logout}>
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.subtitle}>Gestion intelligente des avaries véhicules</div>
        <h1 style={styles.title}>Gérez vos avaries simplement et rapidement</h1>
        <p style={styles.text}>
          Centralisez les dégâts, photos, cotations et informations véhicules dans un seul outil.
        </p>
      </section>

      {/* ACTIONS */}
      <section style={styles.grid}>
        <div style={styles.card} onClick={() => setView("create")}>
          <div style={styles.icon}>➕</div>
          <h3>Créer une avarie</h3>
          <p>Ajouter un nouveau dossier avec photos et cotation</p>
        </div>

        <div style={styles.card} onClick={() => setView("dashboard")}>
          <div style={styles.icon}>📋</div>
          <h3>Voir la liste</h3>
          <p>Consulter, modifier et exporter les avaries</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} Omsan Logistics — Avaries Manager</p>
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
    padding: "12px 30px",
    boxSizing: "border-box",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(10px)",
  },
  navLogo: {
    display: "flex",
    alignItems: "center",
  },
  logoImg: {
    height: 40,
    objectFit: "contain",
    borderRadius: 6,
    background: "#fff",
    padding: "4px 8px",
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  userEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  logoutBtn: {
    padding: "8px 14px",
    border: "none",
    borderRadius: 8,
    background: "#e74c3c",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  hero: {
    textAlign: "center",
    maxWidth: 700,
    padding: "60px 20px 40px",
  },
  subtitle: {
    opacity: 0.6,
    fontSize: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 34,
    marginBottom: 14,
    lineHeight: 1.3,
  },
  text: {
    fontSize: 16,
    opacity: 0.8,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
    width: "100%",
    maxWidth: 800,
    padding: "0 20px",
    boxSizing: "border-box",
  },
  card: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    padding: 25,
    borderRadius: 16,
    cursor: "pointer",
    transition: "0.3s",
    textAlign: "center",
    backdropFilter: "blur(10px)",
  },
  icon: {
    fontSize: 30,
    marginBottom: 10,
  },
  footer: {
    marginTop: "auto",
    padding: 20,
    opacity: 0.5,
    fontSize: 12,
  },
};