import { useState, useEffect } from "react";
import { supabase } from "../api/supabase";
import { profiles } from "../config/profiles";
import AppNavbar from "../components/AppNavbar";
import Footer from "../components/Footer";

// Pages Omsan
import FormulairOmsan from "./omsan/FormulairOmsan";
import DashboardOmsan from "./omsan/DashboardOmsan";

// Pages Somaca
import FormulairSomaca from "./somaca/FormulairSomaca";
import DashboardSomaca from "./somaca/DashboardSomaca";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined"
      ? window.innerWidth < 480
      : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 480);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
}

export default function Home() {
  const isMobile = useIsMobile();

  const [view, setView] = useState("home");
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [role, setRole] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          window.location.href = "/login";
          return;
        }

        setUser(session.user);

        // ======================================================
        // RÉCUPÉRATION UTILISATEUR
        // ======================================================

        const { data: userData, error } = await supabase
          .from("users")
          .select("id, company, role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error(
            "Erreur récupération utilisateur :",
            error
          );

          setLoadingProfile(false);
          return;
        }

        if (!userData) {
          console.error(
            "Utilisateur introuvable dans public.users"
          );

          setLoadingProfile(false);
          return;
        }

        // ======================================================
        // ROLE
        // ======================================================

        setRole(userData.role || "user");

        console.log(
          "🔐 Role utilisateur :",
          userData.role
        );

        // ======================================================
        // PROFIL / ENTREPRISE
        // ======================================================

        const userCompany =
          userData.company?.toLowerCase();

        if (
          userCompany !== "somaca" &&
          userCompany !== "omsan"
        ) {
          setCompany(null);
          setLoadingProfile(false);
          return;
        }

        localStorage.setItem(
          "COMPANY_PROFILE",
          userCompany
        );

        setCompany(userCompany);

        console.log(
          "🏢 Profil entreprise :",
          userCompany
        );
      } catch (error) {
        console.error(
          "Erreur chargement profil :",
          error
        );
      } finally {
        setLoadingProfile(false);
      }
    };

    loadUser();
  }, []);

  // ==========================================================
  // PROFIL ACTIF
  // ==========================================================

  const activeCompany = company;

  const activeProfile = activeCompany
    ? profiles[activeCompany]
    : null;

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = async () => {
    await supabase.auth.signOut();

    localStorage.removeItem("COMPANY_PROFILE");

    window.location.href = "/login";
  };

  // ==========================================================
  // CHARGEMENT
  // ==========================================================

  if (loadingProfile) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingText}>
          Chargement...
        </div>
      </div>
    );
  }

  // ==========================================================
  // PROFIL INVALIDE
  // ==========================================================

  if (!activeProfile) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.errorBox}>
          <div style={styles.errorTitle}>
            Profil entreprise introuvable
          </div>

          <div style={styles.errorText}>
            Votre compte n'est associé à aucune
            entreprise autorisée.
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // DASHBOARD
  // ==========================================================

  if (view === "dashboard") {
    if (activeCompany === "somaca") {
      return <DashboardSomaca />;
    }

    return <DashboardOmsan />;
  }

  // ==========================================================
  // CREATION
  // ==========================================================

  if (view === "create") {
    if (activeCompany === "somaca") {
      return (
        <FormulairSomaca
          onSaved={() => setView("dashboard")}
        />
      );
    }

    return (
      <FormulairOmsan
        onSaved={() => setView("dashboard")}
      />
    );
  }

  // ==========================================================
  // HOME
  // ==========================================================

  return (
    <div style={styles.page}>

      {/* ==================================================
          NAVBAR
      ================================================== */}

      <AppNavbar
        user={user}
        role={role}
        activeProfile={activeProfile}
        isMobile={isMobile}
      />

      {/* ==================================================
          HERO
      ================================================== */}

      <div
        style={{
          ...styles.hero,
          padding: isMobile
            ? "38px 18px 28px"
            : "58px 20px 36px",
        }}
      >
        <div style={styles.eyebrow}>
          {activeProfile.id === "somaca"
            ? "Flux Somaca · GESTION DES AVARIES"
            : `${activeProfile.name.toUpperCase()} · GESTION DES AVARIES`}
        </div>

        <h1
          style={{
            ...styles.title,
            fontSize: isMobile ? 28 : 40,
            marginBottom: isMobile ? 12 : 14,
          }}
        >
          Gérez vos avaries
          <br />
          simplement et rapidement
        </h1>

        <p
          style={{
            ...styles.text,
            fontSize: isMobile ? 13 : 15,
          }}
        >
          Centralisez les dégâts, photos, cotations et
          informations véhicules dans un seul outil.
        </p>
      </div>

      {/* ==================================================
          ACTIONS
      ================================================== */}

      <div
        style={{
          ...styles.grid,
          gridTemplateColumns: isMobile
            ? "1fr"
            : "repeat(2, minmax(0, 1fr))",
          gap: isMobile ? 14 : 18,
          padding: isMobile ? "0 16px" : "0 20px",
        }}
      >

        {/* ==================================================
            CRÉER UNE AVARIE
        ================================================== */}

        <button
          type="button"
          onClick={() => setView("create")}
          style={styles.actionCard}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform =
              "translateY(-4px)";

            e.currentTarget.style.background =
              "rgba(255,255,255,0.085)";

            e.currentTarget.style.borderColor =
              "rgba(139,92,246,0.35)";

            e.currentTarget.style.boxShadow =
              "0 18px 40px rgba(0,0,0,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform =
              "translateY(0)";

            e.currentTarget.style.background =
              "rgba(255,255,255,0.06)";

            e.currentTarget.style.borderColor =
              "rgba(255,255,255,0.12)";

            e.currentTarget.style.boxShadow =
              "0 10px 30px rgba(0,0,0,0.12)";
          }}
        >
          <div style={styles.actionTop}>
            <div
              style={{
                ...styles.actionIcon,
                background:
                  "linear-gradient(135deg,#8b5cf6,#6366f1)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </div>

            <span style={styles.actionBadge}>
              Nouvelle saisie
            </span>
          </div>

          <div style={styles.actionContent}>
            <h2
              style={{
                ...styles.actionTitle,
                fontSize: isMobile ? 19 : 21,
              }}
            >
              Créer une avarie
            </h2>

            <p style={styles.actionText}>
              Enregistrez rapidement une nouvelle avarie,
              ajoutez les informations du véhicule, les dégâts,
              les photos et la cotation.
            </p>
          </div>

          <div style={styles.actionFooter}>
            <span>
              Commencer une nouvelle saisie
            </span>

            <span style={styles.actionArrow}>
              →
            </span>
          </div>
        </button>

        {/* ==================================================
            VOIR LA LISTE
        ================================================== */}

        <button
          type="button"
          onClick={() => setView("dashboard")}
          style={styles.actionCard}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform =
              "translateY(-4px)";

            e.currentTarget.style.background =
              "rgba(255,255,255,0.085)";

            e.currentTarget.style.borderColor =
              "rgba(59,130,246,0.35)";

            e.currentTarget.style.boxShadow =
              "0 18px 40px rgba(0,0,0,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform =
              "translateY(0)";

            e.currentTarget.style.background =
              "rgba(255,255,255,0.06)";

            e.currentTarget.style.borderColor =
              "rgba(255,255,255,0.12)";

            e.currentTarget.style.boxShadow =
              "0 10px 30px rgba(0,0,0,0.12)";
          }}
        >
          <div style={styles.actionTop}>
            <div
              style={{
                ...styles.actionIcon,
                background:
                  "linear-gradient(135deg,#3b82f6,#2563eb)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3h18v18H3z" />
                <path d="M8 8h8" />
                <path d="M8 12h8" />
                <path d="M8 16h5" />
              </svg>
            </div>

            <span
              style={{
                ...styles.actionBadge,
                color: "#93c5fd",
                background:
                  "rgba(59,130,246,0.10)",
                borderColor:
                  "rgba(59,130,246,0.20)",
              }}
            >
              Consultation
            </span>
          </div>

          <div style={styles.actionContent}>
            <h2
              style={{
                ...styles.actionTitle,
                fontSize: isMobile ? 19 : 21,
              }}
            >
              Voir la liste
            </h2>

            <p style={styles.actionText}>
              Consultez les dossiers enregistrés, recherchez
              une avarie et accédez rapidement aux informations
              de chaque véhicule.
            </p>
          </div>

          <div style={styles.actionFooter}>
            <span>
              Accéder aux dossiers
            </span>

            <span style={styles.actionArrow}>
              →
            </span>
          </div>
        </button>
      </div>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <Footer />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #0f172a, #1e293b)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "Arial",
    boxSizing: "border-box",
  },

  hero: {
    textAlign: "center",
    maxWidth: 760,
    width: "100%",
    boxSizing: "border-box",
  },

  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 11px",
    borderRadius: 999,
    background: "rgba(139,92,246,0.09)",
    border: "1px solid rgba(139,92,246,0.18)",
    color: "#c4b5fd",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 16,
  },

  title: {
    lineHeight: 1.15,
    fontWeight: 700,
    marginTop: 0,
    color: "#fff",
    letterSpacing: -0.6,
  },

  text: {
    opacity: 0.62,
    lineHeight: 1.6,
    margin: 0,
    color: "rgba(255,255,255,0.72)",
  },

  grid: {
    display: "grid",
    width: "100%",
    maxWidth: 850,
    boxSizing: "border-box",
    marginBottom: 20,
  },

  actionCard: {
    minHeight: 220,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 24,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    cursor: "pointer",
    transition:
      "transform 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.2s",
    textAlign: "left",
    backdropFilter: "blur(12px)",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.12)",
    color: "#fff",
    fontFamily: "inherit",
  },

  actionTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    flexShrink: 0,
    boxShadow:
      "0 8px 20px rgba(0,0,0,0.18)",
  },

  actionBadge: {
    padding: "6px 9px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
    color: "#c4b5fd",
    background:
      "rgba(139,92,246,0.10)",
    border:
      "1px solid rgba(139,92,246,0.20)",
    whiteSpace: "nowrap",
  },

  actionContent: {
    marginTop: 20,
  },

  actionTitle: {
    margin: 0,
    color: "#fff",
    fontWeight: 700,
  },

  actionText: {
    margin: "8px 0 0",
    fontSize: 13,
    lineHeight: 1.6,
    color:
      "rgba(255,255,255,0.58)",
    maxWidth: 360,
  },

  actionFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 22,
    paddingTop: 14,
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
    fontSize: 12,
    fontWeight: 600,
    color:
      "rgba(255,255,255,0.65)",
  },

  actionArrow: {
    fontSize: 20,
    color: "#fff",
    lineHeight: 1,
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #0f172a, #1e293b)",
    color: "#fff",
    fontFamily: "Arial",
  },

  loadingText: {
    fontSize: 14,
    opacity: 0.7,
  },

  errorBox: {
    width: "90%",
    maxWidth: 450,
    padding: 28,
    borderRadius: 16,
    background:
      "rgba(255,255,255,0.06)",
    border:
      "1px solid rgba(255,255,255,0.12)",
    textAlign: "center",
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 10,
  },

  errorText: {
    fontSize: 13,
    lineHeight: 1.6,
    color:
      "rgba(255,255,255,0.6)",
  },
};

