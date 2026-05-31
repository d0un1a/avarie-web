import { useState } from "react";
import Dashboard from "./Dashboard";
import Formulaire from "./Formulaire";

export default function Home() {
  const [view, setView] = useState("home");

  if (view === "dashboard") return <Dashboard />;
  if (view === "create")
    return <Formulaire onSaved={() => setView("dashboard")} />;

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.logo}>🚗 Avaries Manager</div>
        <div style={styles.subtitle}>Gestion intelligente des avaries véhicules</div>
      </header>

      {/* HERO */}
      <section style={styles.hero}>
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
        <p>© {new Date().getFullYear()} Avaries Manager</p>
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
    padding: "40px 20px",
    fontFamily: "Arial",
  },

  header: {
    textAlign: "center",
    marginBottom: 40,
  },

  logo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },

  subtitle: {
    opacity: 0.7,
  },

  hero: {
    textAlign: "center",
    maxWidth: 700,
    marginBottom: 50,
  },

  title: {
    fontSize: 34,
    marginBottom: 10,
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
    marginTop: 60,
    opacity: 0.5,
    fontSize: 12,
  },
};