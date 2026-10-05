import { useEffect, useRef, useState } from "react";
import { supabase } from "../api/supabase";

export default function AppNavbar({
  user,
  role,
  activeProfile,
  isMobile = false,
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
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

  const goToHome = () => {
    window.location.href = "/";
  };

  const goToAdmin = () => {
    setUserMenuOpen(false);
    window.location.href = "/admin";
  };

  const handleLogout = async () => {
    try {
      setUserMenuOpen(false);

      await supabase.auth.signOut();

      localStorage.removeItem("COMPANY_PROFILE");

      window.location.href = "/login";
    } catch (error) {
      console.error("❌ Erreur déconnexion :", error);
    }
  };

  const userEmail = user?.email || "Utilisateur";
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <header style={styles.navbar}>
      <div style={styles.navbarInner}>

        {/* =====================================================
            LOGO / TITRE
        ===================================================== */}
        <button
          type="button"
          onClick={goToHome}
          style={styles.brand}
        >
          <div style={styles.logoBox}>
            <img
              src="/Logo_Navbar.jpg"
              alt="Gestion des Avaries"
              style={styles.logo}
            />
          </div>

          <div style={styles.brandText}>
            <div style={styles.appName}>
              Gestion des Avaries
            </div>

            <div style={styles.companyName}>
  {activeProfile?.name?.trim().toUpperCase() === "SOMACA"
    ? "Flux Somaca"
    : activeProfile?.name || "OMSAN"}
</div>
          </div>
        </button>

        {/* =====================================================
            PARTIE DROITE
        ===================================================== */}
        <div style={styles.rightSection}>

          {/* PROFIL */}
          <div
            ref={menuRef}
            style={styles.userContainer}
          >
            <button
              type="button"
              onClick={() =>
                setUserMenuOpen(!userMenuOpen)
              }
              style={styles.userButton}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-controls="user-menu"
              aria-label="Menu utilisateur"
            >
              {/* AVATAR */}
              <div style={styles.avatar}>
                {userInitial}
              </div>

              {/* FLECHE */}
              <span
                style={{
                  ...styles.arrow,
                  transform: userMenuOpen
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                }}
              >
                ▼
              </span>
            </button>

            {/* =================================================
                MENU UTILISATEUR
            ================================================= */}
            {userMenuOpen && (
              <div
                id="user-menu"
                style={styles.dropdown}
                role="menu"
                aria-label="Menu utilisateur"
              >

                {/* INFORMATIONS UTILISATEUR */}
                <div style={styles.dropdownHeader}>
                  <div style={styles.dropdownAvatar}>
                    {userInitial}
                  </div>

                  <div style={styles.dropdownUserInfo}>
                    <div style={styles.dropdownEmail}>
                      {userEmail}
                    </div>

                    <div style={styles.dropdownRole}>
                      {role === "admin"
                        ? "Administrateur"
                        : "Utilisateur"}
                    </div>
                  </div>
                </div>

                <div style={styles.divider} />

                {/* =================================================
                    ACCUEIL
                ================================================= */}
                <button
  type="button"
  onClick={goToHome}
  style={styles.dropdownItem}
  role="menuitem"
  onMouseEnter={(e) => {
    e.currentTarget.style.background =
      "rgba(59,130,246,0.10)";
    e.currentTarget.style.color = "#93c5fd";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.color =
      "rgba(255,255,255,0.85)";
  }}
>
  <span style={styles.itemIcon}>
    <HomeIcon />
  </span>

  <span>
    Accueil
  </span>
</button>

                {/* =================================================
                    ADMINISTRATION
                ================================================= */}
                {role === "admin" && (
                  <>
                    <button
  type="button"
  onClick={goToAdmin}
  style={styles.dropdownAdmin}
  role="menuitem"
  onMouseEnter={(e) => {
    e.currentTarget.style.background =
      "rgba(59,130,246,0.10)";
    e.currentTarget.style.color = "#93c5fd";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.color =
      "rgba(255,255,255,0.85)";
  }}
>
  <span style={styles.itemIcon}>
    <SettingsIcon />
  </span>

  <span>
    Administration
  </span>
</button>

                    <div style={styles.divider} />
                  </>
                )}

                {/* =================================================
                    DECONNEXION
                ================================================= */}
                <button
  type="button"
  onClick={handleLogout}
  style={styles.dropdownLogout}
  role="menuitem"
  onMouseEnter={(e) => {
    e.currentTarget.style.background =
      "rgba(239,68,68,0.10)";
    e.currentTarget.style.color = "#fca5a5";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.color =
      "rgba(255,255,255,0.85)";
  }}
>
  <span style={styles.itemIcon}>
    <LogoutIcon />
  </span>

  <span>
    Déconnexion
  </span>
</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* =============================================================
   ICONES SVG
============================================================= */

function HomeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M9 21V14H15V21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M19.4 15C19.5 14.7 19.7 14.4 19.8 14.1L21 13L19.5 10.4L17.9 10.8C17.6 10.5 17.3 10.3 16.9 10.1L16.7 8.5L13.7 8L12.8 9.3C12.5 9.3 12.2 9.3 11.9 9.3L11 8L8 8.5L7.8 10.1C7.4 10.3 7.1 10.5 6.8 10.8L5.2 10.4L3.7 13L4.9 14.1C5 14.4 5.2 14.7 5.3 15L4.7 16.5L7.2 18L8.4 17C8.7 17.1 9.1 17.3 9.4 17.4L9.8 19H14.2L14.6 17.4C14.9 17.3 15.3 17.1 15.6 17L16.8 18L19.3 16.5L19.4 15Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 5H6C5.45 5 5 5.45 5 6V18C5 18.55 5.45 19 6 19H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M13 8L17 12L13 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M17 12H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =============================================================
   STYLES
============================================================= */

const styles = {
  /* =========================================================
     NAVBAR
  ========================================================= */

  navbar: {
    width: "100%",
    background: "rgba(15, 23, 42, 0.97)",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(14px)",
    position: "relative",
    zIndex: 1000,
  },

  navbarInner: {
    width: "100%",
    minHeight: 82,
    padding: "8px 20px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  /* =========================================================
     BRAND
  ========================================================= */

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    border: "none",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    padding: 0,
    textAlign: "left",
    minWidth: 0,
  },

  /* =========================================================
     LOGO
  ========================================================= */

logoBox: {
  width: 48,
  height: 48,
  borderRadius: "50%",
  overflow: "hidden",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
},

logo: {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  objectPosition: "center",
  display: "block",
},



  /* =========================================================
     TEXTE
  ========================================================= */

  brandText: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0,
  },

  appName: {
    fontSize: 17,
    fontWeight: 700,
    color: "#ffffff",
    whiteSpace: "nowrap",
  },

  companyName: {
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
    letterSpacing: 1,
    whiteSpace: "nowrap",
  },

  /* =========================================================
     PARTIE DROITE
  ========================================================= */

  rightSection: {
    display: "flex",
    alignItems: "center",
  },

  userContainer: {
    position: "relative",
  },

  userButton: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    border: "none",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    padding: "6px 4px",
    borderRadius: 10,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background:
      "linear-gradient(135deg, #3b82f6, #2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
  },

  arrow: {
    fontSize: 9,
    color: "rgba(255,255,255,0.45)",
    transition: "transform 0.2s ease",
    marginLeft: 2,
  },

  /* =========================================================
     DROPDOWN
  ========================================================= */

  dropdown: {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    width: 260,
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
    overflow: "hidden",
    padding: 8,
  },

  dropdownHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 8px",
  },

  dropdownAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background:
      "linear-gradient(135deg, #3b82f6, #2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },

  dropdownUserInfo: {
    minWidth: 0,
    flex: 1,
  },

  dropdownEmail: {
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  dropdownRole: {
    fontSize: 11,
    marginTop: 3,
    color: "rgba(255,255,255,0.45)",
  },

  divider: {
    height: 1,
    background: "rgba(255,255,255,0.08)",
    margin: "6px 0",
  },

  /* =========================================================
     MENU ITEMS
  ========================================================= */

  dropdownItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 10px",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "rgba(255,255,255,0.85)",
    cursor: "pointer",
    fontSize: 13,
    textAlign: "left",
  },

  dropdownAdmin: {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "11px 10px",
  border: "none",
  borderRadius: 8,
  background: "transparent",
  color: "rgba(255,255,255,0.85)",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  textAlign: "left",
},

  dropdownLogout: {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "11px 10px",
  border: "none",
  borderRadius: 8,
  background: "transparent",
  color: "rgba(255,255,255,0.85)",
  cursor: "pointer",
  fontSize: 13,
  textAlign: "left",
},

  itemIcon: {
    width: 22,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
};