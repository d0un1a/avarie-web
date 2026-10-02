import { useEffect, useRef, useState } from "react";
import { supabase } from "../api/supabase";

export default function AppNavbar({
  user,
  activeProfile,
  isMobile = false,
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // ==========================================================
  // FERMETURE DU MENU
  // ==========================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = async () => {
    setUserMenuOpen(false);

    await supabase.auth.signOut();

    localStorage.removeItem("COMPANY_PROFILE");

    window.location.href = "/login";
  };

  // ==========================================================
  // PROTECTION
  // ==========================================================

  if (!activeProfile) {
    return null;
  }

  return (
  <div
    style={{
      ...styles.navbar,
      padding: isMobile
        ? "10px 16px"
        : "12px 30px",
    }}
  >

    {/* ==================================================
        LOGO ENTREPRISE
    ================================================== */}

    <div style={styles.navLogo}>
      <img
        src={activeProfile.logo}
        alt={activeProfile.name}
        style={{
          ...styles.logoImg,
          width: isMobile ? 90 : 110,
          height: isMobile ? 38 : 48,
        }}
      />
    </div>

    {/* ==================================================
        MENU UTILISATEUR
    ================================================== */}

    <div
      ref={userMenuRef}
      style={{
        ...styles.userMenuWrapper,
        marginLeft: "auto",
      }}
    >
        <button
          type="button"
          aria-label="Ouvrir le menu utilisateur"
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
          onClick={() =>
            setUserMenuOpen((open) => !open)
          }
          style={{
            ...styles.userMenuButton,
            padding: isMobile
              ? "6px 7px"
              : "7px 9px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "rgba(255,255,255,0.11)";
            e.currentTarget.style.borderColor =
              "rgba(255,255,255,0.20)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              "rgba(255,255,255,0.06)";
            e.currentTarget.style.borderColor =
              "rgba(255,255,255,0.12)";
          }}
        >
          <span style={styles.userAvatar}>
            {user?.email?.charAt(0)?.toUpperCase() || "U"}
          </span>

          <span
            style={{
              ...styles.chevron,
              transform: userMenuOpen
                ? "rotate(180deg)"
                : "rotate(0deg)",
            }}
          >
            ▾
          </span>
        </button>

        {/* ================================================== */}
        {/* DROPDOWN */}
        {/* ================================================== */}

        {userMenuOpen && (
          <div
            role="menu"
            style={{
              ...styles.userDropdown,
              minWidth: isMobile ? 250 : 285,
            }}
          >
            {/* INFORMATIONS UTILISATEUR */}

            <div style={styles.userInfo}>
              <div style={styles.dropdownAvatar}>
                {user?.email?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div style={styles.userInfoText}>
                <div style={styles.userInfoLabel}>
                  Utilisateur connecté
                </div>

                <div style={styles.userInfoEmail}>
                  {user?.email || "Email indisponible"}
                </div>

               <div style={styles.userCompany}>
                {activeProfile?.id === "somaca"
                ? "Flux Somaca"
                : activeProfile?.name}
               </div>
              </div>
            </div>

            <div style={styles.dropdownDivider} />

            {/* DECONNEXION */}

            <button
              type="button"
              role="menuitem"
              onClick={logout}
              style={styles.dropdownLogout}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "rgba(248,113,113,0.10)";
                e.currentTarget.style.color =
                  "#fca5a5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "transparent";
                e.currentTarget.style.color =
                  "#cbd5e1";
              }}
            >
              <span style={styles.logoutIcon}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M10 4H6.5C5.67 4 5 4.67 5 5.5V18.5C5 19.33 5.67 20 6.5 20H10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />

                  <path
                    d="M13 8L17 12L13 16"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <path
                    d="M9 12H17"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <span>
                Déconnexion
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
    navbar: {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxSizing: "border-box",
  background: "transparent",
  color: "#fff",
},

  navLogo: {
    display: "flex",
    alignItems: "center",
  },

  logoImg: {
    objectFit: "contain",
    borderRadius: 6,
    background: "#fff",
    padding: "4px 8px",
  },

  userMenuWrapper: {
    position: "relative",
    marginLeft: "auto",
  },

  userMenuButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    border:
      "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    background:
      "rgba(255,255,255,0.06)",
    color: "#fff",
    cursor: "pointer",
    transition:
      "background 0.2s, border-color 0.2s",
    fontWeight: 600,
  },

  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },

  chevron: {
    fontSize: 15,
    opacity: 0.65,
    lineHeight: 1,
    transition: "transform 0.2s",
  },

  userDropdown: {
  position: "absolute",
  top: "calc(100% + 10px)",
  right: 0,
  zIndex: 1000,

  background: "#0f172a",

  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,

  boxShadow: "0 18px 45px rgba(0,0,0,0.35)",

  overflow: "hidden",
},

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "15px 16px",
  },

  dropdownAvatar: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    flexShrink: 0,
  },

  userInfoText: {
    minWidth: 0,
  },

  userInfoLabel: {
    fontSize: 11,
    color:
      "rgba(255,255,255,0.5)",
    marginBottom: 3,
  },

  userInfoEmail: {
    fontSize: 13,
    color: "#fff",
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 215,
  },

  userCompany: {
    fontSize: 11,
    color:
      "rgba(255,255,255,0.55)",
    marginTop: 4,
  },

  dropdownDivider: {
    height: 1,
    background:
      "rgba(255,255,255,0.08)",
  },

  dropdownLogout: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    border: "none",
    background: "transparent",
    color: "#cbd5e1",
    cursor: "pointer",
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "left",
    transition:
      "background 0.2s, color 0.2s",
  },

  logoutIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(148,163,184,0.10)",
    color: "#94a3b8",
    flexShrink: 0,
    transition:
      "background 0.2s, color 0.2s",
  },
};