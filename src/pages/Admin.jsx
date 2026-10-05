import { useEffect, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import Footer from "../components/Footer";
import { supabase } from "../api/supabase";
import { profiles } from "../config/profiles";

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

export default function Admin() {
  const isMobile = useIsMobile();

  // ==========================================================
  // UTILISATEUR / ROLE
  // ==========================================================

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  // ==========================================================
  // CREATION UTILISATEUR
  // ==========================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] =
    useState(false);
  const [profile, setProfile] = useState("omsan");
  const [newUserRole, setNewUserRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);

  // ==========================================================
  // LISTE UTILISATEURS
  // ==========================================================

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");

  // Filtres
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Tri
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  // ==========================================================
  // MODIFICATION UTILISATEUR
  // ==========================================================

  const [editingUser, setEditingUser] = useState(null);
  const [editCompany, setEditCompany] = useState("omsan");
  const [editRole, setEditRole] = useState("user");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // ==========================================================
  // SUPPRESSION UTILISATEUR
  // ==========================================================

  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ==========================================================
  // PROFIL ACTUEL
  // ==========================================================

  const [activeProfile, setActiveProfile] = useState(null);

  // ==========================================================
  // CHARGEMENT UTILISATEUR
  // ==========================================================

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
          return;
        }

        if (!userData) {
          console.error(
            "Utilisateur introuvable dans public.users"
          );
          return;
        }

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

        const profileData = profiles[userCompany];

        if (!profileData) {
          console.error(
            "Profil société introuvable :",
            userCompany
          );
          return;
        }

        setActiveProfile(profileData);

        localStorage.setItem(
          "COMPANY_PROFILE",
          userCompany
        );

        console.log(
          "🏢 Profil entreprise :",
          userCompany
        );
      } catch (error) {
        console.error(
          "Erreur chargement utilisateur :",
          error
        );
      }
    };

    loadUser();
  }, []);

  // ==========================================================
  // CHARGEMENT DES UTILISATEURS
  // ==========================================================

  const loadUsers = async () => {
    setLoadingUsers(true);
    setUsersError("");

    try {
      const {
        data,
        error,
      } = await supabase.functions.invoke("list-users");

      if (error) {
        console.error(
          "❌ Erreur Edge Function list-users :",
          error
        );

        throw error;
      }

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Impossible de récupérer les utilisateurs."
        );
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error(
        "❌ Erreur chargement utilisateurs :",
        error
      );

      setUsersError(
        error?.message ||
          "Impossible de récupérer les utilisateurs."
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  // ==========================================================
  // EFFACER LE MESSAGE DE CRÉATION
  // ==========================================================

  const clearCreateMessage = () => {
    setMessage("");
    setMessageType("");
  };

  // ==========================================================
  // CHARGER LA LISTE SI ADMIN
  // ==========================================================

  useEffect(() => {
    if (user && role === "admin") {
      loadUsers();
    }
  }, [user, role]);

  // ==========================================================
  // TRI
  // ==========================================================

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) =>
        prev === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // ==========================================================
  // UTILISATEURS FILTRÉS
  // ==========================================================

  const filteredUsers = users.filter((item) => {
    const cleanSearch = search.trim().toLowerCase();

    const matchesSearch =
      !cleanSearch ||
      (item.email || "")
        .toLowerCase()
        .includes(cleanSearch);

    const matchesCompany =
      companyFilter === "all" ||
      (item.company || "").toLowerCase() ===
        companyFilter;

    const matchesRole =
      roleFilter === "all" ||
      (item.role || "user") === roleFilter;

    return (
      matchesSearch &&
      matchesCompany &&
      matchesRole
    );
  });

  // ==========================================================
  // UTILISATEURS TRIÉS
  // ==========================================================

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortField) {
      return 0;
    }

    let valueA = "";
    let valueB = "";

    if (sortField === "email") {
      valueA = (a.email || "").toLowerCase();
      valueB = (b.email || "").toLowerCase();
    }

    if (sortField === "company") {
      valueA = (a.company || "").toLowerCase();
      valueB = (b.company || "").toLowerCase();
    }

    if (sortField === "role") {
      valueA = (a.role || "user").toLowerCase();
      valueB = (b.role || "user").toLowerCase();
    }

    if (sortField === "created_at") {
      valueA = a.created_at
        ? new Date(a.created_at).getTime()
        : 0;

      valueB = b.created_at
        ? new Date(b.created_at).getTime()
        : 0;
    }

    if (valueA < valueB) {
      return sortDirection === "asc" ? -1 : 1;
    }

    if (valueA > valueB) {
      return sortDirection === "asc" ? 1 : -1;
    }

    return 0;
  });

  // ==========================================================
  // OUVRIR MODIFICATION
  // ==========================================================

  const handleEditUser = (item) => {
    clearCreateMessage();
    setEditSuccess("");

    setEditingUser(item);

    setEditCompany(
      item.company?.toLowerCase() === "somaca"
        ? "somaca"
        : "omsan"
    );

    setEditRole(
      item.role === "admin"
        ? "admin"
        : "user"
    );

    setEditError("");
  };

  // ==========================================================
  // FERMER MODIFICATION
  // ==========================================================

  const handleCloseEdit = () => {
    if (savingEdit) {
      return;
    }

    setEditingUser(null);
    setEditError("");
  };

  // ==========================================================
  // ENREGISTRER MODIFICATION
  // ==========================================================

  const handleSaveEdit = async () => {
    if (!editingUser) {
      return;
    }

    setSavingEdit(true);
    setEditError("");
    setEditSuccess("");

    try {
      const {
        data,
        error,
      } = await supabase.functions.invoke(
        "update-user-profile",
        {
          body: {
            userId: editingUser.id,
            company: editCompany,
            role: editRole,
          },
        }
      );

      if (error) {
        console.error(
          "❌ Erreur Edge Function modification :",
          error
        );

        let serverMessage = "";

        try {
          if (error.context) {
            const errorBody =
              await error.context.json();

            serverMessage =
              errorBody?.message ||
              errorBody?.error ||
              "";
          }
        } catch (parseError) {
          console.error(
            "❌ Impossible de lire la réponse de l'Edge Function :",
            parseError
          );
        }

        throw new Error(
          serverMessage ||
            error.message ||
            "Impossible de modifier l'utilisateur."
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Impossible de modifier l'utilisateur."
        );
      }

      // Mise à jour immédiate du profil si
      // l'utilisateur modifié est l'utilisateur connecté
      if (editingUser.id === user?.id) {
        const newCompany = editCompany?.toLowerCase();
        const newProfile = profiles[newCompany];

        if (newProfile) {
          setActiveProfile(newProfile);

          localStorage.setItem(
            "COMPANY_PROFILE",
            newCompany
          );
        }
      }

      setEditingUser(null);

      await loadUsers();

      setEditSuccess(
        "Utilisateur modifié avec succès."
      );

      setTimeout(() => {
        setEditSuccess("");
      }, 4000);
    } catch (error) {
      console.error(
        "❌ Erreur modification utilisateur :",
        error
      );

      setEditError(
        error?.message ||
          "Impossible de modifier l'utilisateur."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // ==========================================================
  // SUPPRIMER UTILISATEUR
  // ==========================================================

  const handleDeleteUser = async (item) => {
    if (!item) {
      return;
    }

    clearCreateMessage();

    if (item.id === user?.id) {
      alert(
        "Vous ne pouvez pas supprimer votre propre compte."
      );
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer l'utilisateur "${item.email}" ?\n\nCette action est définitive.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingUser(item);
    setDeleting(true);
    setDeleteMessage("");

    try {
      const {
        data,
        error,
      } = await supabase.functions.invoke(
        "delete-user",
        {
          body: {
            userId: item.id,
          },
        }
      );

      if (error) {
        console.error(
          "❌ Erreur Edge Function suppression :",
          error
        );

        throw error;
      }

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Impossible de supprimer l'utilisateur."
        );
      }

      setDeletingUser(null);

      await loadUsers();

      setDeleteMessage(
        `Utilisateur supprimé avec succès : ${item.email}`
      );

      setTimeout(() => {
        setDeleteMessage("");
      }, 4000);
    } catch (error) {
      console.error(
        "❌ Erreur suppression utilisateur :",
        error
      );

      alert(
        error?.message ||
          "Impossible de supprimer l'utilisateur."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================================
  // CRÉATION UTILISATEUR
  // ==========================================================

  const handleCreateUser = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setMessage(
        "L'email et le mot de passe sont obligatoires."
      );
      setMessageType("error");
      return;
    }

    if (cleanPassword.length < 6) {
      setMessage(
        "Le mot de passe doit contenir au moins 6 caractères."
      );
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const {
        data,
        error,
      } = await supabase.functions.invoke("create-user", {
        body: {
          email: cleanEmail,
          password: cleanPassword,
          company: profile,
          role: newUserRole,
        },
      });

      if (error) {
        console.error(
          "❌ Erreur Edge Function :",
          error
        );

        setMessage(
          error.message ||
            "Impossible de créer l'utilisateur."
        );
        setMessageType("error");
        return;
      }

      if (!data?.success) {
        setMessage(
          data?.error ||
            "Impossible de créer l'utilisateur."
        );
        setMessageType("error");
        return;
      }

      setMessage(
        `Utilisateur créé avec succès : ${cleanEmail} — ${profile.toUpperCase()} — ${
          newUserRole === "admin"
            ? "Administrateur"
            : "Utilisateur"
        }`
      );

      setMessageType("success");

      setEmail("");
      setPassword("");
      setShowCreatePassword(false);
      setProfile("omsan");
      setNewUserRole("user");

      loadUsers();
    } catch (error) {
      console.error(
        "❌ Erreur création utilisateur :",
        error
      );

      setMessage(
        "Une erreur inattendue est survenue."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // PROTECTION
  // ==========================================================

  if (!user) {
    return null;
  }

  if (role !== "admin") {
    return (
      <div style={styles.page}>
        <AppNavbar
          user={user}
          role={role}
          activeProfile={activeProfile}
          isMobile={isMobile}
        />

        <main style={styles.main}>
          <div style={styles.container}>
            <div style={styles.card}>
              <h1 style={styles.title}>
                Accès refusé
              </h1>

              <p style={styles.subtitle}>
                Cette page est réservée aux administrateurs.
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // ==========================================================
  // ADMIN
  // ==========================================================

  return (
    <div style={styles.page}>
      <AppNavbar
        user={user}
        role={role}
        activeProfile={activeProfile}
        isMobile={isMobile}
      />

      <main style={styles.main}>
        <div style={styles.container}>

          {/* =================================================
              HEADER
          ================================================= */}

          <div
            style={{
              ...styles.header,
              padding: isMobile
                ? "18px 16px 28px"
                : "18px 0 30px",
            }}
          >
            <div>
              <div style={styles.badge}>
                ADMINISTRATION
              </div>

              <h1
                style={{
                  ...styles.title,
                  fontSize: isMobile ? 27 : 30,
                }}
              >
                Gestion des utilisateurs
              </h1>

              <p style={styles.subtitle}>
                Créer et gérer les utilisateurs de
                l'application.
              </p>
            </div>
          </div>

          {/* =================================================
              CARTES PRINCIPALES
          ================================================= */}

          <div
            style={{
              ...styles.grid,
              gridTemplateColumns: "1fr",
              gap: isMobile ? 14 : 18,
              padding: isMobile ? "0 16px" : "0 0",
            }}
          >

            {/* =================================================
                CRÉER UN UTILISATEUR
            ================================================= */}

            <div
              style={styles.actionCard}
              onClick={(e) => {
                if (
                  e.target.closest(
                    "button, input, select, textarea, form, a, table, th, td"
                  )
                ) {
                  return;
                }

                setCreateUserOpen((prev) => !prev);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) {
                  return;
                }

                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setCreateUserOpen((prev) => !prev);
                }
              }}
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
                  Créer un utilisateur
                </h2>

                <p
  style={{
    ...styles.actionText,
    whiteSpace: isMobile ? "normal" : "nowrap",
    overflowWrap: "anywhere",
  }}
>
                  Ajouter un nouvel utilisateur à
                  l'application et définir son profil,
                  sa société et son rôle.
                </p>
              </div>

              <div style={styles.actionFooter}>
                <span>
                  {createUserOpen
                    ? "Fermer la création"
                    : "Ajouter un utilisateur"}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCreateUserOpen((prev) => !prev)
                  }
                  style={styles.actionToggle}
                  aria-label={
                    createUserOpen
                      ? "Fermer la création d'utilisateur"
                      : "Ouvrir la création d'utilisateur"
                  }
                >
                  {createUserOpen ? "−" : "→"}
                </button>
              </div>

              {/* =================================================
                  FORMULAIRE
              ================================================= */}

              {createUserOpen && (
                <div style={styles.expandedContent}>
                  <div style={styles.innerDivider} />

                  <form onSubmit={handleCreateUser}>
                    <div style={styles.field}>
                      <label style={styles.label}>
                        Email
                      </label>

                      <input
                        type="email"
                        placeholder="exemple@email.com"
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        style={styles.input}
                        disabled={loading}
                        autoComplete="off"
                      />
                    </div>

                    <div style={styles.field}>
                      <label style={styles.label}>
                        Mot de passe
                      </label>

                      <div style={styles.passwordWrap}>
                        <input
                          type="text"
                          inputMode="text"
                          value={password}
                          onChange={(e) =>
                            setPassword(e.target.value)
                          }
                          placeholder="Mot de passe"
                          style={{
                            ...styles.passwordInput,
                            WebkitTextSecurity:
                              showCreatePassword
                                ? "none"
                                : "disc",
                          }}
                          disabled={loading}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          data-form-type="other"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowCreatePassword(
                              (prev) => !prev
                            )
                          }
                          style={styles.eyeButton}
                          aria-label={
                            showCreatePassword
                              ? "Masquer le mot de passe"
                              : "Afficher le mot de passe"
                          }
                        >
                          {showCreatePassword ? (
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

                    <div style={styles.field}>
                      <label style={styles.label}>
                        Profil
                      </label>

                      <select
                        value={profile}
                        onChange={(e) =>
                          setProfile(e.target.value)
                        }
                        style={styles.input}
                        disabled={loading}
                      >
                        <option value="omsan">
                          OMSAN
                        </option>

                        <option value="somaca">
                          SOMACA
                        </option>
                      </select>
                    </div>

                    <div style={styles.field}>
                      <label style={styles.label}>
                        Rôle
                      </label>

                      <select
                        value={newUserRole}
                        onChange={(e) =>
                          setNewUserRole(e.target.value)
                        }
                        style={styles.input}
                        disabled={loading}
                      >
                        <option value="user">
                          Utilisateur
                        </option>

                        <option value="admin">
                          Administrateur
                        </option>
                      </select>
                    </div>

                    {message && (
                      <div
                        style={{
                          ...styles.message,
                          ...(messageType === "success"
                            ? styles.successMessage
                            : styles.errorMessage),
                        }}
                      >
                        {message}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        ...styles.button,
                        opacity: loading ? 0.7 : 1,
                        cursor: loading
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      {loading
                        ? "Création en cours..."
                        : "Créer l'utilisateur"}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* =================================================
                UTILISATEURS
            ================================================= */}

            <div
              style={{
                ...styles.actionCard,
                ...(usersOpen
                  ? styles.actionCardOpen
                  : {}),
              }}
              onClick={(e) => {
                if (
                  e.target.closest(
                    "button, input, select, textarea, form, a, table, th, td"
                  )
                ) {
                  return;
                }

                setUsersOpen((prev) => !prev);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) {
                  return;
                }

                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setUsersOpen((prev) => !prev);
                }
              }}
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
                  Utilisateurs
                </h2>

                <p
  style={{
    ...styles.actionText,
    whiteSpace: isMobile ? "normal" : "nowrap",
    overflowWrap: "anywhere",
  }}
>
                  Consultez, recherchez, modifiez et
                  supprimez les comptes utilisateurs
                  de l'application.
                </p>

                {usersOpen && (
                  <p style={styles.cardCount}>
                    {filteredUsers.length} utilisateur
                    {filteredUsers.length > 1
                      ? "s"
                      : ""}{" "}
                    affiché
                    {filteredUsers.length > 1
                      ? "s"
                      : ""}{" "}
                    sur {users.length}
                  </p>
                )}
              </div>

              <div style={styles.actionFooter}>
                <span>
                  {usersOpen
                    ? "Fermer la liste"
                    : "Voir les utilisateurs"}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setUsersOpen((prev) => !prev)
                  }
                  style={{
                    ...styles.actionToggle,
                    color: "#fff",
                  }}
                  aria-label={
                    usersOpen
                      ? "Fermer la liste des utilisateurs"
                      : "Ouvrir la liste des utilisateurs"
                  }
                >
                  {usersOpen ? "−" : "→"}
                </button>
              </div>

              {/* =================================================
                  LISTE
              ================================================= */}

              {usersOpen && (
                <div style={styles.expandedContent}>
                  <div style={styles.innerDivider} />

                  {editSuccess && (
                    <div
                      style={{
                        ...styles.message,
                        ...styles.successMessage,
                      }}
                    >
                      {editSuccess}
                    </div>
                  )}

                  <div style={styles.filters}>
                    <div style={styles.searchWrapper}>
                      <span style={styles.searchIcon}>
                        🔎
                      </span>

                      <input
                        type="text"
                        placeholder="Rechercher par email..."
                        value={search}
                        onChange={(e) => {
                          clearCreateMessage();
                          setSearch(e.target.value);
                        }}
                        style={styles.searchInput}
                      />
                    </div>

                    <select
                      value={companyFilter}
                      onChange={(e) => {
                        clearCreateMessage();
                        setCompanyFilter(e.target.value);
                      }}
                      style={styles.filterSelect}
                    >
                      <option value="all">
                        Toutes les sociétés
                      </option>

                      <option value="omsan">
                        OMSAN
                      </option>

                      <option value="somaca">
                        SOMACA
                      </option>
                    </select>

                    <select
                      value={roleFilter}
                      onChange={(e) => {
                        clearCreateMessage();
                        setRoleFilter(e.target.value);
                      }}
                      style={styles.filterSelect}
                    >
                      <option value="all">
                        Tous les rôles
                      </option>

                      <option value="user">
                        Utilisateurs
                      </option>

                      <option value="admin">
                        Administrateurs
                      </option>
                    </select>
                  </div>

                  <div style={styles.listTools}>
                    <div>
                      {deleteMessage && (
                        <div
                          style={{
                            ...styles.message,
                            ...styles.successMessage,
                          }}
                        >
                          {deleteMessage}
                        </div>
                      )}

                      {usersError && (
                        <div style={styles.errorMessage}>
                          {usersError}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={loadUsers}
                      disabled={loadingUsers}
                      style={{
                        ...styles.refreshButton,
                        opacity: loadingUsers ? 0.6 : 1,
                        cursor: loadingUsers
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      {loadingUsers ? "..." : "↻"}
                    </button>
                  </div>

                  {loadingUsers ? (
                    <div style={styles.emptyState}>
                      Chargement...
                    </div>
                  ) : users.length === 0 ? (
                    <div style={styles.emptyState}>
                      Aucun utilisateur trouvé.
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div style={styles.emptyState}>
                      Aucun utilisateur ne correspond aux
                      filtres.
                    </div>
                  ) : (
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th
                              style={styles.th}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSort("email");
                              }}
                            >
                              <div
                                style={
                                  styles.sortableHeader
                                }
                              >
                                Utilisateur
                                {sortField === "email" &&
                                  (sortDirection === "asc"
                                    ? " ↑"
                                    : " ↓")}
                              </div>
                            </th>

                            <th
                              style={styles.th}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSort("company");
                              }}
                            >
                              <div
                                style={
                                  styles.sortableHeader
                                }
                              >
                                Société
                                {sortField === "company" &&
                                  (sortDirection === "asc"
                                    ? " ↑"
                                    : " ↓")}
                              </div>
                            </th>

                            <th
                              style={styles.th}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSort("role");
                              }}
                            >
                              <div
                                style={
                                  styles.sortableHeader
                                }
                              >
                                Rôle
                                {sortField === "role" &&
                                  (sortDirection === "asc"
                                    ? " ↑"
                                    : " ↓")}
                              </div>
                            </th>

                            <th
                              style={styles.th}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSort("created_at");
                              }}
                            >
                              <div
                                style={
                                  styles.sortableHeader
                                }
                              >
                                Création
                                {sortField ===
                                  "created_at" &&
                                  (sortDirection === "asc"
                                    ? " ↑"
                                    : " ↓")}
                              </div>
                            </th>

                            <th style={styles.th}>
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {sortedUsers.map((item) => (
                            <tr key={item.id}>
                              <td style={styles.td}>
                                <div
                                  style={
                                    styles.userCell
                                  }
                                >
                                  <div
                                    style={styles.avatar}
                                  >
                                    {(item.email || "?")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>

                                  <span>
                                    {item.email || "—"}
                                  </span>
                                </div>
                              </td>

                              <td style={styles.td}>
                                <span
                                  style={
                                    styles.companyText
                                  }
                                >
                                  {item.company
                                    ? item.company.toUpperCase()
                                    : "—"}
                                </span>
                              </td>

                              <td style={styles.td}>
                                <span
                                  style={
                                    item.role === "admin"
                                      ? styles.adminBadge
                                      : styles.userBadge
                                  }
                                >
                                  {item.role === "admin"
                                    ? "Admin"
                                    : "Utilisateur"}
                                </span>
                              </td>

                              <td style={styles.td}>
                                {item.created_at
                                  ? new Date(
                                      item.created_at
                                    ).toLocaleDateString(
                                      "fr-FR"
                                    )
                                  : "—"}
                              </td>

                              <td style={styles.td}>
                                <div
                                  style={
                                    styles.actionButtons
                                  }
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleEditUser(item)
                                    }
                                    style={
                                      styles.editButton
                                    }
                                  >
                                    Modifier
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteUser(
                                        item
                                      )
                                    }
                                    disabled={
                                      deleting &&
                                      deletingUser?.id ===
                                        item.id
                                    }
                                    style={{
                                      ...styles.deleteButton,
                                      opacity:
                                        deleting &&
                                        deletingUser?.id ===
                                          item.id
                                          ? 0.6
                                          : 1,
                                      cursor:
                                        deleting &&
                                        deletingUser?.id ===
                                          item.id
                                          ? "not-allowed"
                                          : "pointer",
                                    }}
                                  >
                                    {deleting &&
                                    deletingUser?.id ===
                                      item.id
                                      ? "..."
                                      : "Supprimer"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* =====================================================
          FENÊTRE MODIFICATION
      ===================================================== */}

      {editingUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  Modifier l'utilisateur
                </h2>

                <p style={styles.modalSubtitle}>
                  {editingUser.email}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={savingEdit}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Société
              </label>

              <select
                value={editCompany}
                onChange={(e) =>
                  setEditCompany(e.target.value)
                }
                style={styles.input}
                disabled={savingEdit}
              >
                <option value="omsan">
                  OMSAN
                </option>

                <option value="somaca">
                  SOMACA
                </option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Rôle
              </label>

              <select
                value={editRole}
                onChange={(e) =>
                  setEditRole(e.target.value)
                }
                style={styles.input}
                disabled={savingEdit}
              >
                <option value="user">
                  Utilisateur
                </option>

                <option value="admin">
                  Administrateur
                </option>
              </select>
            </div>

            {editError && (
              <div style={styles.errorMessage}>
                {editError}
              </div>
            )}

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={savingEdit}
                style={styles.cancelButton}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                style={{
                  ...styles.saveButton,
                  opacity: savingEdit ? 0.7 : 1,
                  cursor: savingEdit
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {savingEdit
                  ? "Enregistrement..."
                  : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background:
      "linear-gradient(135deg, #0f172a, #1e293b)",
    color: "#fff",
    fontFamily: "Arial",
    boxSizing: "border-box",
  },

  main: {
    flex: 1,
    width: "100%",
    boxSizing: "border-box",
    padding: "20px 20px 40px",
  },

  container: {
    width: "100%",
    maxWidth: 900,
    margin: "0 auto",
    boxSizing: "border-box",
  },

  header: {
    width: "100%",
    boxSizing: "border-box",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 11px",
    borderRadius: 999,
    background: "rgba(139,92,246,0.09)",
    border:
      "1px solid rgba(139,92,246,0.18)",
    color: "#c4b5fd",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 12,
  },

  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 700,
    color: "#fff",
    lineHeight: 1.15,
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 0,
    color:
      "rgba(255,255,255,0.55)",
    fontSize: 14,
  },

  // ==========================================================
  // GRILLE COMME HOME
  // ==========================================================

  grid: {
    display: "grid",
    width: "100%",
    maxWidth: 850,
    boxSizing: "border-box",
    margin: "0 auto 20px",
  },

  // ==========================================================
  // CARTE COMME HOME
  // ==========================================================

  actionCard: {
    minHeight: 220,
    minWidth: 0,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    padding: 24,
    background:
      "rgba(255,255,255,0.06)",
    border:
      "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    transition:
      "transform 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.2s",
    textAlign: "left",
    backdropFilter: "blur(12px)",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.12)",
    color: "#fff",
    fontFamily: "inherit",
  },

  actionCardOpen: {
    minHeight: 220,
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
    whiteSpace: "nowrap",
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

  actionToggle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: 20,
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  },

  expandedContent: {
    marginTop: 4,
    width: "100%",
    boxSizing: "border-box",
  },

  innerDivider: {
    width: "100%",
    height: 1,
    background:
      "rgba(255,255,255,0.08)",
    marginBottom: 22,
  },

  // ==========================================================
  // ANCIENNE CARD CONSERVÉE POUR L'ACCÈS REFUSÉ
  // ==========================================================

  card: {
    background:
      "rgba(255,255,255,0.06)",
    border:
      "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 28,
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.35)",
    backdropFilter: "blur(14px)",
    marginBottom: 24,
  },

  cardCount: {
    margin: "8px 0 0",
    fontSize: 11,
    color:
      "rgba(255,255,255,0.38)",
  },

  field: {
    marginBottom: 18,
  },

  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color:
      "rgba(255,255,255,0.7)",
    marginBottom: 7,
  },

  input: {
    width: "100%",
    padding: "12px 13px",
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
    padding: "12px 44px 12px 13px",
    borderRadius: 8,
    border:
      "1px solid rgba(255,255,255,0.15)",
    background:
      "rgba(0,0,0,0.25)",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    WebkitAppearance: "none",
    appearance: "none",
    WebkitUserModify: "read-write",
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
    zIndex: 2,
  },

  message: {
    marginBottom: 16,
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 13,
  },

  successMessage: {
    background:
      "rgba(34,197,94,0.10)",
    border:
      "1px solid rgba(34,197,94,0.25)",
    color: "#86efac",
  },

  errorMessage: {
    background:
      "rgba(239,68,68,0.10)",
    border:
      "1px solid rgba(239,68,68,0.25)",
    color: "#fca5a5",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 13,
  },

  button: {
    width: "100%",
    padding: 13,
    borderRadius: 8,
    border: "none",
    background:
      "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    marginTop: 5,
  },

  listTools: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 4,
  },

  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    border:
      "1px solid rgba(255,255,255,0.15)",
    background:
      "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  filters: {
    display: "grid",
    gridTemplateColumns:
      "minmax(180px, 1fr)",
    gap: 10,
    marginBottom: 18,
  },

  searchWrapper: {
    position: "relative",
    width: "100%",
  },

  searchIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 14,
    opacity: 0.6,
    pointerEvents: "none",
  },

  searchInput: {
    width: "100%",
    padding: "10px 12px 10px 36px",
    borderRadius: 8,
    border:
      "1px solid rgba(255,255,255,0.12)",
    background:
      "rgba(0,0,0,0.20)",
    color: "#fff",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  },

  filterSelect: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border:
      "1px solid rgba(255,255,255,0.12)",
    background:
      "#172033",
    color: "#fff",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  },

  emptyState: {
    padding: "30px 20px",
    textAlign: "center",
    color:
      "rgba(255,255,255,0.5)",
    fontSize: 14,
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },

  th: {
    padding: "11px 13px",
    textAlign: "left",
    background:
      "rgba(255,255,255,0.035)",
    color:
      "rgba(255,255,255,0.55)",
    fontWeight: 600,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap",
  },

  sortableHeader: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
    userSelect: "none",
  },

  td: {
    padding: "11px 13px",
    color:
      "rgba(255,255,255,0.82)",
    borderBottom:
      "1px solid rgba(255,255,255,0.05)",
    whiteSpace: "nowrap",
  },

  userCell: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(59,130,246,0.15)",
    border:
      "1px solid rgba(59,130,246,0.20)",
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },

  companyText: {
    fontSize: 12,
    fontWeight: 600,
    color:
      "rgba(255,255,255,0.65)",
  },

  adminBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    background:
      "rgba(59,130,246,0.12)",
    border:
      "1px solid rgba(59,130,246,0.20)",
    color: "#93c5fd",
    fontSize: 10,
    fontWeight: 700,
  },

  userBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    background:
      "rgba(255,255,255,0.05)",
    border:
      "1px solid rgba(255,255,255,0.09)",
    color:
      "rgba(255,255,255,0.60)",
    fontSize: 10,
    fontWeight: 600,
  },

  actionButtons: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  editButton: {
    padding: "6px 10px",
    borderRadius: 7,
    border:
      "1px solid rgba(59,130,246,0.25)",
    background:
      "rgba(59,130,246,0.10)",
    color: "#93c5fd",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },

  deleteButton: {
    padding: "6px 10px",
    borderRadius: 7,
    border:
      "1px solid rgba(239,68,68,0.25)",
    background:
      "rgba(239,68,68,0.10)",
    color: "#fca5a5",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background:
      "rgba(0,0,0,0.65)",
    backdropFilter: "blur(5px)",
  },

  modal: {
    width: "100%",
    maxWidth: 430,
    background:
      "#172033",
    border:
      "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 24,
    boxShadow:
      "0 25px 80px rgba(0,0,0,0.55)",
  },

  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 24,
  },

  modalTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },

  modalSubtitle: {
    margin: "5px 0 0",
    color:
      "rgba(255,255,255,0.50)",
    fontSize: 12,
    wordBreak: "break-all",
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 7,
    border:
      "1px solid rgba(255,255,255,0.10)",
    background:
      "rgba(255,255,255,0.05)",
    color:
      "rgba(255,255,255,0.70)",
    fontSize: 22,
    lineHeight: 1,
    cursor: "pointer",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },

  cancelButton: {
    padding: "10px 15px",
    borderRadius: 8,
    border:
      "1px solid rgba(255,255,255,0.12)",
    background:
      "rgba(255,255,255,0.05)",
    color:
      "rgba(255,255,255,0.70)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },

  saveButton: {
    padding: "10px 17px",
    borderRadius: 8,
    border: "none",
    background:
      "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
  },
};