import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useEffect, useState } from "react";

import { supabase } from "./api/supabase";
import { initProfile } from "./config/appConfig";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";


// ============================================================
// LOADING
// ============================================================

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0f172a, #1e293b)",
        color: "#fff",
        fontSize: 18,
        fontFamily: "Arial",
      }}
    >
      <span
        style={{
          fontSize: 28,
          marginRight: 12,
        }}
      >
        🚗
      </span>

      Chargement...
    </div>
  );
}


// ============================================================
// ROUTE PRIVÉE
// ============================================================

function PrivateRoute({
  children,
  user,
  loading,
}) {
  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}


// ============================================================
// ROUTE ADMIN
// ============================================================

function AdminRoute({
  children,
  user,
  role,
  loading,
}) {
  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (role !== "admin") {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}


// ============================================================
// ROUTE PUBLIQUE
// ============================================================

function PublicRoute({
  children,
  user,
  loading,
  passwordRecovery,
}) {
  if (loading) {
    return <LoadingScreen />;
  }

  // ----------------------------------------------------------
  // IMPORTANT :
  // Une session PASSWORD_RECOVERY ne doit pas être considérée
  // comme une vraie connexion.
  // ----------------------------------------------------------

  if (passwordRecovery) {
    return children;
  }

  if (user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}


// ============================================================
// APP
// ============================================================

export default function App() {

  const [user, setUser] = useState(null);

  const [role, setRole] = useState(null);

  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------
  // Indique qu'une session sert à réinitialiser le mot de passe
  // ----------------------------------------------------------

  const [
    passwordRecovery,
    setPasswordRecovery,
  ] = useState(false);


  useEffect(() => {

    let mounted = true;


    // ========================================================
    // INITIALISATION
    // ========================================================

    const initialize = async () => {

      console.log(
        "🚀 App : initialisation..."
      );


      try {

        // ----------------------------------------------------
        // PROFIL APPLICATION
        // ----------------------------------------------------

        await initProfile();

        console.log(
          "✅ App : profil application initialisé"
        );


        // ----------------------------------------------------
        // SESSION SUPABASE
        // ----------------------------------------------------

        console.log(
          "🔐 App : récupération session..."
        );

        const {
          data,
          error,
        } =
          await supabase.auth.getSession();


        if (error) {

          console.error(
            "❌ App : erreur getSession :",
            error
          );

          if (mounted) {
            setUser(null);
            setRole(null);
          }

          return;
        }


        const authUser =
          data?.session?.user || null;


        // ----------------------------------------------------
        // PAS CONNECTÉ
        // ----------------------------------------------------

        if (!authUser) {

          console.log(
            "ℹ️ App : aucun utilisateur connecté"
          );

          if (mounted) {
            setUser(null);
            setRole(null);
          }

          return;
        }


        // ----------------------------------------------------
        // UTILISATEUR AUTH
        // ----------------------------------------------------

        console.log(
          "👤 App : utilisateur connecté :",
          authUser.email
        );

        console.log(
          "🆔 App : Auth ID :",
          authUser.id
        );


        if (mounted) {
          setUser(authUser);
        }


        // ----------------------------------------------------
        // PUBLIC.USERS
        // ----------------------------------------------------

        console.log(
          "🔎 App : recherche dans public.users..."
        );


        const {
          data: userData,
          error: userError,
        } =
          await supabase
            .from("users")
            .select(
              "id, company , role"
            )
            .eq(
              "id",
              authUser.id
            )
            .maybeSingle();


        if (userError) {

          console.error(
            "❌ App : erreur public.users :",
            userError
          );

          if (mounted) {
            setRole(null);
          }

          return;
        }


        // ----------------------------------------------------
        // UTILISATEUR ABSENT
        // ----------------------------------------------------

        if (!userData) {

          console.error(
            "❌ App : utilisateur absent de public.users"
          );

          console.error(
            "Auth ID :",
            authUser.id
          );

          console.error(
            "Vérifie que public.users.id = auth.users.id"
          );

          if (mounted) {
            setRole(null);
          }

          return;
        }


        // ----------------------------------------------------
        // UTILISATEUR TROUVÉ
        // ----------------------------------------------------

        console.log(
          "✅ App : utilisateur trouvé"
        );

        console.log(
          "🏢 Entreprise :",
          userData.company
        );

        console.log(
          "🔐 Role :",
          userData.role
        );


        if (mounted) {

          setRole(
            userData.role || "user"
          );

        }

      } catch (error) {

        console.error(
          "❌ App : erreur générale :",
          error
        );

        if (mounted) {
          setUser(null);
          setRole(null);
        }

      } finally {

        if (mounted) {

          console.log(
            "🏁 App : fin chargement"
          );

          setLoading(false);

        }

      }
    };


    // ========================================================
    // LANCEMENT INITIAL
    // ========================================================

    initialize();


    // ========================================================
    // AUTH STATE CHANGE
    // ========================================================

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {

          console.log(
            "🔄 App : Auth event :",
            event
          );


          // --------------------------------------------------
          // IMPORTANT :
          // PASSWORD_RECOVERY = réinitialisation du mot de passe
          // et NON une connexion normale.
          // --------------------------------------------------

          if (
            event === "PASSWORD_RECOVERY"
          ) {

            console.log(
              "🔑 App : mode réinitialisation du mot de passe"
            );

            if (mounted) {

              setPasswordRecovery(true);

              setLoading(false);

            }

            return;
          }


          // --------------------------------------------------
          // IMPORTANT :
          // On ignore INITIAL_SESSION car initialize()
          // s'en occupe déjà.
          // --------------------------------------------------

          if (
            event === "INITIAL_SESSION"
          ) {
            return;
          }


          // --------------------------------------------------
          // DÉCONNEXION
          // --------------------------------------------------

          if (
            event === "SIGNED_OUT"
          ) {

            if (mounted) {

              setUser(null);

              setRole(null);

              setPasswordRecovery(false);

              setLoading(false);

            }

            return;
          }


          // --------------------------------------------------
          // CONNEXION
          // --------------------------------------------------

          if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED"
          ) {

            // ------------------------------------------------
            // Si on est en récupération de mot de passe,
            // on ne traite PAS cet événement comme une
            // connexion normale.
            // ------------------------------------------------

            if (passwordRecovery) {

              console.log(
                "🔑 App : événement ignoré pendant la récupération du mot de passe"
              );

              return;
            }


            const authUser =
              session?.user || null;


            if (!authUser) {
              return;
            }


            console.log(
              "👤 Auth event utilisateur :",
              authUser.email
            );


            // ------------------------------------------------
            // IMPORTANT :
            // On ne fait PAS await Supabase directement
            // dans onAuthStateChange.
            // ------------------------------------------------

            setTimeout(
              async () => {

                if (!mounted) {
                  return;
                }


                try {

                  setUser(
                    authUser
                  );


                  const {
                    data: userData,
                    error,
                  } =
                    await supabase
                      .from("users")
                      .select(
                        "id, company, role"
                      )
                      .eq(
                        "id",
                        authUser.id
                      )
                      .maybeSingle();


                  if (error) {

                    console.error(
                      "❌ Auth event : erreur public.users :",
                      error
                    );

                    return;
                  }


                  if (!userData) {

                    console.error(
                      "❌ Auth event : utilisateur introuvable"
                    );

                    return;
                  }


                  console.log(
                    "🔐 Auth event role :",
                    userData.role
                  );


                  if (mounted) {

                    setRole(
                      userData.role ||
                      "user"
                    );

                    setLoading(false);

                  }

                } catch (error) {

                  console.error(
                    "❌ Auth event : erreur :",
                    error
                  );

                }

              },
              0
            );

          }

        }
      );


    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {

      mounted = false;

      authListener.subscription.unsubscribe();

    };

  }, [passwordRecovery]);


  // ==========================================================
  // ROUTES
  // ==========================================================

  return (
    <BrowserRouter>

      <Routes>

        {/* ==================================================
            LOGIN
        ================================================== */}

        <Route
          path="/login"
          element={
            <PublicRoute
              user={user}
              loading={loading}
              passwordRecovery={passwordRecovery}
            >
              <Login />
            </PublicRoute>
          }
        />


        {/* ==================================================
            RESET PASSWORD
        ================================================== */}

        <Route
          path="/reset-password"
          element={
            <ResetPassword />
          }
        />


        {/* ==================================================
            HOME
        ================================================== */}

        <Route
          path="/"
          element={
            <PrivateRoute
              user={user}
              loading={loading}
            >
              <Home />
            </PrivateRoute>
          }
        />


        {/* ==================================================
            ADMIN
        ================================================== */}

        <Route
          path="/admin"
          element={
            <AdminRoute
              user={user}
              role={role}
              loading={loading}
            >
              <Admin
                user={user}
                role={role}
              />
            </AdminRoute>
          }
        />


        {/* ==================================================
            ROUTE INCONNUE
        ================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}