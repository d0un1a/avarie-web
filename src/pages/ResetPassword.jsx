import { useState } from "react";
import { supabase } from "../api/supabase";
import Footer from "../components/Footer";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function translateAuthError(errorMessage) {
    const translations = {
      "New password should be different from the old password.":
        "Le nouveau mot de passe doit être différent de l'ancien.",

      "Password should be at least 6 characters.":
        "Le mot de passe doit contenir au moins 6 caractères.",

      "Password should be at least 6 characters long.":
        "Le mot de passe doit contenir au moins 6 caractères.",

      "New password is required":
        "Le nouveau mot de passe est obligatoire.",

      "Auth session missing!":
        "La session de réinitialisation a expiré. Veuillez refaire une demande de réinitialisation.",

      "Invalid or expired token":
        "Le lien de réinitialisation est invalide ou a expiré.",

      "Token has expired or is invalid":
        "Le lien de réinitialisation est invalide ou a expiré.",
    };

    return (
      translations[errorMessage] ||
      "Une erreur est survenue. Veuillez réessayer."
    );
  }

  async function handleResetPassword() {
    setError("");
    setMessage("");

    if (!password || !confirmPassword) {
      return setError(
        "Veuillez renseigner les deux champs."
      );
    }

    if (password !== confirmPassword) {
      return setError(
        "Les mots de passe ne correspondent pas."
      );
    }

    if (password.length < 6) {
      return setError(
        "Le mot de passe doit contenir au moins 6 caractères."
      );
    }

    setLoading(true);

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    setLoading(false);

    if (error) {
      return setError(
        translateAuthError(error.message)
      );
    }

    setMessage(
      "Votre mot de passe a été modifié avec succès."
    );

    await supabase.auth.signOut();

    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
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

      <div style={styles.resetArea}>
        <div style={styles.card}>

          {/* LOGO */}
          <div style={styles.logoWrap}>
            <img
              src="/Logo_Omsan.jpeg"
              alt="Omsan Logistics"
              style={styles.logoImg}
            />

            <div style={styles.logoTitle}>
              Gestion des Avaries
            </div>

            <div style={styles.logoSub}>
              Réinitialisation du mot de passe
            </div>
          </div>

          {/* ERREUR */}
          {error && (
            <div style={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          {/* SUCCÈS */}
          {message && (
            <div style={styles.successBox}>
              ✅ {message}
            </div>
          )}

          {/* NOUVEAU MOT DE PASSE */}
          <div style={styles.field}>
            <label style={styles.label}>
              Nouveau mot de passe
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
              />

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

          {/* CONFIRMATION */}
          <div style={styles.field}>
            <label style={styles.label}>
              Confirmer le mot de passe
            </label>

            <div style={styles.passwordWrap}>
              <input
                style={styles.passwordInput}
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (prev) => !prev
                  )
                }
                style={styles.eyeButton}
                aria-label={
                  showConfirmPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showConfirmPassword ? (
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
            }}
            onClick={handleResetPassword}
            disabled={loading}
          >
            {loading
              ? "Modification..."
              : "Modifier le mot de passe"}
          </button>

        </div>
      </div>

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

  resetArea: {
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
    maxWidth: 420,
    padding: 36,
    borderRadius: 16,
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.4)",
    backdropFilter: "blur(14px)",
  },

  logoWrap: {
    textAlign: "center",
    marginBottom: 28,
  },

  logoImg: {
    height: 55,
    objectFit: "contain",
    borderRadius: 8,
    background: "#fff",
    padding: "6px 12px",
    marginBottom: 14,
  },

  logoTitle: {
    fontSize: 22,
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

  successBox: {
    background:
      "rgba(34,197,94,0.15)",
    border:
      "1px solid rgba(34,197,94,0.4)",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#86efac",
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