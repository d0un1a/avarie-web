// src/config/appConfig.js

import { profiles } from "./profiles";

/**
 * ============================================================
 * APP CONFIG
 * ============================================================
 *
 * Gestion du profil actif de l'application.
 *
 * Profils disponibles :
 * - omsan
 * - somaca
 *
 * IMPORTANT :
 * Les formulaires Omsan et Somaca utilisent directement :
 *
 * profiles.omsan
 * profiles.somaca
 *
 * Ce fichier sert principalement à déterminer le profil
 * général de l'application.
 */


/**
 * ============================================================
 * PROFIL DEPUIS ENV
 * ============================================================
 */

function getProfileFromEnv() {
  const env = import.meta.env.VITE_REACT_APP_COMPANY;

  console.log(
    "🔍 [appConfig] VITE_REACT_APP_COMPANY:",
    env
  );

  if (env && profiles[env]) {
    console.log(
      "✅ [appConfig] Profil trouvé dans ENV:",
      env
    );

    return env;
  }

  return null;
}


/**
 * ============================================================
 * PROFIL DEPUIS L'URL
 * ============================================================
 *
 * Exemple :
 *
 * omsan.monsite.com
 * somaca.monsite.com
 */

function getProfileFromUrl() {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const hostname =
    window.location.hostname;

  console.log(
    "🔍 [appConfig] hostname:",
    hostname
  );

  // Développement local
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  ) {
    console.log(
      "ℹ️ [appConfig] Environnement local"
    );

    return null;
  }

  const parts =
    hostname.split(".");

  if (parts.length < 2) {
    return null;
  }

  const subdomain =
    parts[0];

  console.log(
    "🔍 [appConfig] Subdomain:",
    subdomain
  );

  if (profiles[subdomain]) {
    console.log(
      "✅ [appConfig] Profil trouvé via URL:",
      subdomain
    );

    return subdomain;
  }

  return null;
}


/**
 * ============================================================
 * PROFIL DEPUIS LOCAL STORAGE
 * ============================================================
 */

function getProfileFromStorage() {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const stored =
    localStorage.getItem(
      "COMPANY_PROFILE"
    );

  console.log(
    "🔍 [appConfig] localStorage:",
    stored
  );

  if (
    stored &&
    profiles[stored]
  ) {
    return stored;
  }

  return null;
}


/**
 * ============================================================
 * INITIALISATION
 * ============================================================
 *
 * Priorité :
 *
 * 1. ENV
 * 2. Sous-domaine
 * 3. LocalStorage
 * 4. Omsan par défaut
 *
 * Pas de requête Supabase ici.
 */

export async function initProfile() {
  console.log(
    "🚀 [appConfig] Initialisation du profil..."
  );


  // ----------------------------------------------------------
  // 1. ENV
  // ----------------------------------------------------------

  const envProfile =
    getProfileFromEnv();

  if (envProfile) {
    localStorage.setItem(
      "COMPANY_PROFILE",
      envProfile
    );

    return envProfile;
  }


  // ----------------------------------------------------------
  // 2. URL
  // ----------------------------------------------------------

  const urlProfile =
    getProfileFromUrl();

  if (urlProfile) {
    localStorage.setItem(
      "COMPANY_PROFILE",
      urlProfile
    );

    return urlProfile;
  }


  // ----------------------------------------------------------
  // 3. LOCAL STORAGE
  // ----------------------------------------------------------

  const storedProfile =
    getProfileFromStorage();

  if (storedProfile) {
    return storedProfile;
  }


  // ----------------------------------------------------------
  // 4. DEFAULT
  // ----------------------------------------------------------

  console.log(
    "ℹ️ [appConfig] Aucun profil détecté."
  );

  console.log(
    "➡️ [appConfig] Profil par défaut: omsan"
  );

  localStorage.setItem(
    "COMPANY_PROFILE",
    "omsan"
  );

  return "omsan";
}


/**
 * ============================================================
 * GET PROFILE
 * ============================================================
 */

export function getProfile(
  companyId
) {
  if (!companyId) {
    return null;
  }

  return (
    profiles[companyId] ||
    null
  );
}


/**
 * ============================================================
 * GET ACTIVE COMPANY
 * ============================================================
 */

export function getActiveCompanyId() {
  if (
    typeof window === "undefined"
  ) {
    return "omsan";
  }

  return (
    localStorage.getItem(
      "COMPANY_PROFILE"
    ) || "omsan"
  );
}


/**
 * ============================================================
 * ACTIVE PROFILE
 * ============================================================
 *
 * Compatible avec :
 *
 * import { activeProfile } from "../config/appConfig";
 *
 * Fallback automatique vers Omsan.
 */

export const activeProfile =
  getProfile(
    getActiveCompanyId()
  ) || profiles.omsan;


/**
 * ============================================================
 * GET ALL PROFILES
 * ============================================================
 */

export function getAllProfiles() {
  return profiles;
}


/**
 * ============================================================
 * CHANGER DE PROFIL
 * ============================================================
 */

export function setActiveCompany(
  companyId
) {
  if (!profiles[companyId]) {
    console.error(
      "❌ [appConfig] Profil inexistant:",
      companyId
    );

    return false;
  }

  localStorage.setItem(
    "COMPANY_PROFILE",
    companyId
  );

  console.log(
    "✅ [appConfig] Profil sélectionné:",
    companyId
  );

  return true;
}


/**
 * ============================================================
 * RELOAD PROFILE
 * ============================================================
 */

export function reloadProfile() {
  localStorage.removeItem(
    "COMPANY_PROFILE"
  );

  window.location.reload();
}


/**
 * ============================================================
 * DEBUG
 * ============================================================
 */

console.log(
  "📦 [appConfig] Profils disponibles:",
  profiles
);

console.log(
  "🏢 [appConfig] Profil actif:",
  activeProfile
);
