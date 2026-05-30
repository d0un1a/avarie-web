import { useState } from "react";
import Formulaire from "./pages/Formulaire";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [view, setView] = useState("home");

  // 🏠 MENU PRINCIPAL
  if (view === "home") {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Gestion des Avaries</h1>

        <button style={styles.btnPrimary} onClick={() => setView("form")}>
          ➕ Création Avarie
        </button>

        <button style={styles.btnSecondary} onClick={() => setView("list")}>
          📋 Liste des Avaries
        </button>
      </div>
    );
  }

  // ➕ FORMULAIRE
  if (view === "form") {
    return (
      <div>
        <div style={styles.topBar}>
          <button onClick={() => setView("home")}>⬅ Menu</button>
        </div>

        <Formulaire
          onSaved={() => setView("list")}
        />
      </div>
    );
  }

  // 📋 DASHBOARD
  return (
    <div>
      <div style={styles.topBar}>
        <button onClick={() => setView("home")}>⬅ Menu</button>
      </div>

      <Dashboard />
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    background: "#f4f4f4",
  },

  title: {
    fontSize: 28,
    marginBottom: 20,
  },

  btnPrimary: {
    padding: "16px 28px",
    fontSize: 16,
    cursor: "pointer",
    background: "#1a1a1a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    width: 250,
  },

  btnSecondary: {
    padding: "16px 28px",
    fontSize: 16,
    cursor: "pointer",
    background: "#e0e0e0",
    color: "#000",
    border: "none",
    borderRadius: 8,
    width: 250,
  },

  topBar: {
    padding: 10,
    background: "#fff",
    borderBottom: "1px solid #ddd",
  },
};