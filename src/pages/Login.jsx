import { useState, useEffect } from "react";
import { supabase } from "../api/supabase";
import Footer from "../components/Footer";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" &&
      window.innerWidth < 480
  );

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < 480);
    };

    window.addEventListener("resize", handler);

    return () => {
      window.removeEventListener("resize", handler);
    };
  }, []);

  return isMobile;
}

export default function Login() {
  const isMobile = useIsMobile();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");

    const emailVal = email.trim();
    const passwordVal = password.trim();

    if (!emailVal || !passwordVal) {
      return setError(
        "Email et mot de passe obligatoires"
      );
    }

    setLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: emailVal,
        password: passwordVal,
      });

    setLoading(false);

    if (error) {
      return setError(error.message);
    }

    if (data?.session) {
      setTimeout(
        () => window.location.replace("/"),
        500
      );
    } else {
      setError(
        "Connexion echouee, reessayez."
      );
    }
  }

  return (
    <div style={styles.page}>

      {/* MASQUER L'OEIL NATIF DU NAVIGATEUR */}
      <style>
        {`
          input[type="password"]::-ms-reveal,
          input[type="password"]::-ms-clear {
            display: none;
          }

          input[type="password"]::-webkit-textfield-decoration-container {
            display: none;
          }
        `}
      </style>

      {/* ZONE LOGIN */}
      <div style={styles.loginArea}>
        <div
          style={{
            ...styles.card,
            padding: isMobile ? 20 : 36,
            maxWidth: isMobile ? "100%" : 420,
            borderRadius: isMobile ? 12 : 16,
            margin: isMobile ? 12 : 0,
          }}
        >

          {/* LOGO */}
          <div
            style={{
              ...styles.logoWrap,
              marginBottom: isMobile ? 20 : 28,
            }}
          >
            <img
              src="/Logo_Omsan.jpeg"
              alt="Omsan Logistics"
              style={{
                ...styles.logoImg,
                height: isMobile ? 44 : 55,
              }}
            />

            <div
              style={{
                ...styles.logoTitle,
                fontSize: isMobile ? 18 : 22,
              }}
            >
              Gestion des Avaries
            </div>



            <div style={styles.logoSub}>
              Connectez-vous pour continuer
            </div>
          </div>


          {/* ERREUR */}
          {error && (
            <div style={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          {/* EMAIL */}
          <div style={styles.field}>
            <label style={styles.label}>
              Email
            </label>

            <input
              style={styles.input}
              type="email"
              placeholder="exemple@email.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                handleLogin()
              }
            />
          </div>

          {/* MOT DE PASSE */}
          <div style={styles.field}>
            <label style={styles.label}>
              Mot de passe
            </label>

            <div style={styles.passwordWrap}>
              <input
                style={styles.passwordInput}
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="••••••••"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  handleLogin()
                }
              />

              {/* OEIL */}
              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (prev) => !prev
                  )
                }
                style={styles.eyeButton}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showPassword ? (
                  /* OEIL OUVERT */
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                    <circle
                      cx="12"
                      cy="12"
                      r="2.5"
                    />
                  </svg>
                ) : (
                  /* OEIL FERME */
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4 10 8-0.6 1.7-1.5 3.1-2.7 4.3" />
                    <path d="M6.2 6.2C4.6 6.8 3.4 8.7 2 12c1.5 4 5 8 10 8 1.7 0 3.2-.4 4.5-1.1" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* BOUTON */}
          <button
            style={{
              ...styles.btn,
              opacity: loading ? 0.7 : 1,
              fontSize: isMobile ? 14 : 15,
            }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading
              ? "Connexion..."
              : "Se connecter"}
          </button>

        </div>
      </div>

      {/* FOOTER */}
      <Footer />

    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",

    display: "flex",

    flexDirection: "column",

    fontFamily: "Arial",

    padding: 16,

    background:
      "linear-gradient(135deg, #0f172a, #1e293b)",

    color: "#fff",

    boxSizing: "border-box",
  },

  loginArea: {
    flex: 1,

    width: "100%",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",
  },

  card: {
    background:
      "rgba(255,255,255,0.06)",

    border:
      "1px solid rgba(255,255,255,0.12)",

    width: "100%",

    boxShadow:
      "0 20px 60px rgba(0,0,0,0.4)",

    backdropFilter: "blur(14px)",
  },

  logoWrap: {
    textAlign: "center",
  },

  logoImg: {
    objectFit: "contain",

    borderRadius: 8,

    background: "#fff",

    padding: "6px 12px",

    marginBottom: 14,
  },

 logoTitle: {
  fontWeight: 700,
  color: "#fff",
  lineHeight: 1.3,
  marginTop: 4,
  marginBottom: 10,
},

logoSub: {
  fontSize: 13,
  lineHeight: 1.5,
  color: "rgba(255,255,255,0.62)",
  textAlign: "center",
},

  errorBox: {
    background:
      "rgba(239,68,68,0.15)",

    border:
      "1px solid rgba(239,68,68,0.4)",

    borderRadius: 8,

    padding: "10px 14px",

    color: "#fca5a5",

    fontSize: 13,

    marginBottom: 16,
  },

  field: {
    marginBottom: 16,
  },

  label: {
    display: "block",

    fontSize: 13,

    fontWeight: 600,

    color:
      "rgba(255,255,255,0.7)",

    marginBottom: 6,
  },

  input: {
    width: "100%",

    padding: 11,

    borderRadius: 8,

    border:
      "1px solid rgba(255,255,255,0.15)",

    background:
      "rgba(0,0,0,0.25)",

    color: "#fff",

    fontSize: 14,

    outline: "none",

    boxSizing: "border-box",
  },

  passwordWrap: {
    position: "relative",

    width: "100%",
  },

  passwordInput: {
    width: "100%",

    padding: "11px 44px 11px 11px",

    borderRadius: 8,

    border:
      "1px solid rgba(255,255,255,0.15)",

    background:
      "rgba(0,0,0,0.25)",

    color: "#fff",

    fontSize: 14,

    outline: "none",

    boxSizing: "border-box",
  },

  eyeButton: {
    position: "absolute",

    right: 0,

    top: 0,

    height: "100%",

    width: 44,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    border: "none",

    background: "transparent",

    color: "#fff",

    cursor: "pointer",

    padding: 0,
  },

  btn: {
    width: "100%",

    padding: 12,

    borderRadius: 8,

    border: "none",

    background:
      "linear-gradient(135deg, #3b82f6, #2563eb)",

    color: "#fff",

    fontWeight: 700,

    cursor: "pointer",

    marginTop: 8,

    transition: "0.2s",
  },
};