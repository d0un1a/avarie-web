import { useEffect, useState } from "react";
import { supabase } from "../../api/supabase";
import VehicleSchema from "../../components/VehicleSchema";
import { profiles } from "../../config/profiles";
import AppNavbar from "../../components/AppNavbar";
import Footer from "../../components/Footer";

const profile = profiles.somaca;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" &&
      window.innerWidth < 640
  );

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener("resize", handler);

    return () => {
      window.removeEventListener("resize", handler);
    };
  }, []);

  return isMobile;
}

export default function FormulairSomaca({
  editData,
  onSaved,
  onCancelEdit,
}) {
  const isMobile = useIsMobile();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  // --------------------------------------------------
  // Utilisateur + rôle
  // IDENTIQUE À HOME
  // --------------------------------------------------

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
      } catch (error) {
        console.error(
          "Erreur chargement utilisateur :",
          error
        );
      }
    };

    loadUser();
  }, []);

  const [schemaKey, setSchemaKey] = useState(0);
  const [manqueType, setManqueType] = useState("");

  const emptyForm = {
    date: "",
    chassis: "",
    marque: "",
    modele: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [zones, setZones] = useState([]);
  const [nature, setNature] = useState("");
  const [cotation, setCotation] = useState("V1");
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  // AJOUT : permet de réinitialiser le champ "Choisir les fichiers"
  const [fileInputKey, setFileInputKey] = useState(0);

  // --------------------------------------------------
  // Données du profil SOMACA
  // --------------------------------------------------

  const marques = profile.formFields.marques;
  const natures = profile.formFields.natures;

  // --------------------------------------------------
  // Chargement des données en mode édition
  // --------------------------------------------------

  useEffect(() => {
    if (editData) {
      setForm({
        date: editData.date || "",
        chassis: editData.chassis || "",
        marque: editData.marque || "",
        modele: editData.modele || "",
      });

      const zonesFromData = editData.zones?.length
        ? editData.zones
        : editData.position
          ? editData.position
              .split(",")
              .map((z) => z.trim())
              .filter(Boolean)
          : [];

      setZones(zonesFromData);
      setNature(editData.nature || "");
      setManqueType(editData.manqueType || "");
      setCotation(editData.cotation || "V1");
      setPhotos(editData.photos || []);
    } else {
      setForm({ ...emptyForm });
      setZones([]);
      setNature("");
      setManqueType("");
      setCotation("V1");
      setPhotos([]);
    }
  }, [editData]);

  // --------------------------------------------------
  // Champs formulaire
  // --------------------------------------------------

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // --------------------------------------------------
  // Upload photos
  // --------------------------------------------------

  const uploadPhotos = async (files) => {
    const fileArray = Array.from(files || []);

    if (!fileArray.length) {
      return;
    }

    // Autoriser uniquement les images
    const imageFiles = fileArray.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length !== fileArray.length) {
      alert("Seules les images sont autorisées.");
    }

    if (!imageFiles.length) {
      return;
    }

    setLoading(true);

    try {
      // Éviter les doublons dans la même sélection
      const uniqueFiles = imageFiles.filter(
        (file, index, array) =>
          index ===
          array.findIndex(
            (f) =>
              f.name === file.name &&
              f.size === file.size &&
              f.lastModified === file.lastModified
          )
      );

      // Vérifier les photos déjà présentes
      const filesToUpload = uniqueFiles.filter(
        (file) =>
          !photos.some(
            (photo) =>
              photo.name === file.name &&
              photo.size === file.size
          )
      );

      if (!filesToUpload.length) {
        alert("Cette photo est déjà ajoutée.");
        return;
      }

      const results = await Promise.all(
        filesToUpload.map(async (file) => {
          try {
            const safeFileName = file.name
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-zA-Z0-9._-]/g, "_");

            const fileName = `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}-${safeFileName}`;

            const { error } = await supabase.storage
              .from("avaries-photos")
              .upload(fileName, file, {
                cacheControl: "3600",
                upsert: false,
              });

            if (error) {
              console.error(
                "Upload error:",
                error
              );

              alert(
                "Erreur upload image : " +
                  error.message
              );

              return null;
            }

            const { data } = supabase.storage
              .from("avaries-photos")
              .getPublicUrl(fileName);

            return {
              name: file.name,
              size: file.size,
              url: data.publicUrl,
            };
          } catch (error) {
            console.warn(
              "Upload failed for",
              file.name,
              error.message
            );

            return null;
          }
        })
      );

      const uploaded = results.filter(Boolean);

      // Ajouter uniquement les nouvelles photos
      setPhotos((prev) => [
        ...prev,
        ...uploaded.filter(
          (newPhoto) =>
            !prev.some(
              (oldPhoto) =>
                oldPhoto.name === newPhoto.name &&
                oldPhoto.size === newPhoto.size
            )
        ),
      ]);

      if (uploaded.length < filesToUpload.length) {
        alert(
          `${uploaded.length}/${filesToUpload.length} photo(s) uploadee(s). Verifiez votre connexion.`
        );
      }
    } catch (error) {
      alert(
        "Erreur upload : " +
          error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Sauvegarde
  // --------------------------------------------------

  const save = async () => {
    if (!form.chassis) {
      return alert(
        "Chassis obligatoire"
      );
    }

    setLoading(true);

    const entry = {
      ...form,
      zones,
      nature,
      cotation,
      photos,
      manqueType,
      nbPhotos: photos.length,
      position: zones.join(", "),
      saisiPar: "web",

      // SOMACA
      company: profile.id,
    };

    let result;

    if (editData?.id) {
      result = await supabase
        .from(profile.apiTable)
        .update(entry)
        .eq("id", editData.id);
    } else {
      result = await supabase
        .from(profile.apiTable)
        .insert([entry]);
    }

    setLoading(false);

    if (result.error) {
      return alert(
        result.error.message
      );
    }

    alert(
      editData
        ? "Modification ✔"
        : "Creation ✔"
    );

    setForm({
      ...emptyForm,
    });

    setZones([]);
    setNature("");
    setManqueType("");
    setCotation("V1");
    setPhotos([]);

    onSaved?.();
  };

  // --------------------------------------------------
  // Reset formulaire
  // --------------------------------------------------

  const resetForm = async () => {
    // Supprimer les photos du Storage Supabase
    if (photos.length > 0) {
      try {
        const fileNames = photos
          .map((photo) => {
            if (!photo.url) return null;

            // Récupérer uniquement le nom du fichier
            const marker =
              "/storage/v1/object/public/avaries-photos/";

            const index =
              photo.url.indexOf(marker);

            if (index === -1) return null;

            return decodeURIComponent(
              photo.url.substring(
                index + marker.length
              )
            );
          })
          .filter(Boolean);

        if (fileNames.length > 0) {
          const { error } = await supabase.storage
            .from("avaries-photos")
            .remove(fileNames);

          if (error) {
            console.error(
              "Erreur suppression photos :",
              error
            );
          }
        }
      } catch (error) {
        console.error(
          "Erreur suppression photos :",
          error
        );
      }
    }

    // Réinitialiser le formulaire
    setForm({
      ...emptyForm,
    });

    setZones([]);
    setNature("");
    setManqueType("");
    setCotation("V1");
    setPhotos([]);

    // AJOUT : efface le nom du fichier affiché par le navigateur
    setFileInputKey((prev) => prev + 1);

    setSchemaKey(
      (prev) => prev + 1
    );
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  const ui = {
    page: {
      minHeight: "100vh",
      fontFamily: "Arial",
      background:
        "linear-gradient(135deg, #0f172a, #1e293b)",
      color: "#fff",
    },

    // IDENTIQUE À OMSAN
    content: {
      padding: isMobile ? 12 : 24,
    },

    header: {
      fontSize: isMobile
        ? 18
        : 22,

      fontWeight: 700,

      marginBottom: isMobile
        ? 12
        : 20,

      color: "#fff",
    },

    grid2: {
      display: "grid",

      gridTemplateColumns:
        isMobile
          ? "1fr"
          : "repeat(2, 1fr)",

      gap: 12,
    },

    card: {
      background:
        "rgba(255,255,255,0.06)",

      padding: isMobile
        ? 12
        : 18,

      borderRadius: 12,

      marginBottom: isMobile
        ? 10
        : 16,

      border:
        "1px solid rgba(255,255,255,0.12)",

      boxShadow:
        "0 10px 30px rgba(0,0,0,0.25)",

      backdropFilter:
        "blur(14px)",
    },

    title: {
      fontSize: 15,

      fontWeight: 600,

      marginBottom: 12,

      color: "#fff",
    },

    input: {
      padding: 10,

      borderRadius: 8,

      border:
        "1px solid rgba(255,255,255,0.15)",

      outline: "none",

      background:
        "rgba(0,0,0,0.25)",

      color: "#fff",

      width: "100%",

      boxSizing: "border-box",
    },

    select: {
      padding: 10,

      borderRadius: 8,

      border:
        "1px solid rgba(255,255,255,0.15)",

      background:
        "rgba(0,0,0,0.25)",

      color: "#fff",

      width: "100%",

      boxSizing: "border-box",
    },

    actions: {
      display: "flex",

      gap: 10,

      marginTop: 20,

      flexWrap: "wrap",
    },

    btn: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 14px",
      border:
        "1px solid rgba(255,255,255,0.12)",
      borderRadius: 8,
      background:
        "rgba(255,255,255,0.06)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 13,
      transition: "0.2s",
    },

    homeIcon: {
      fontSize: 17,
      lineHeight: 1,
    },

    primary: {
      background: "#111",

      color: "#fff",
    },

    danger: {
      background: "#e74c3c",

      color: "#fff",
    },
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div style={ui.page}>

      {/* NAVBAR */}
      <AppNavbar
        user={user}
        role={role}
        activeProfile={profile}
        isMobile={isMobile}
      />

      {/* CONTENU */}
      <div style={ui.content}>

        {/* VEHICULE */}
        <div style={ui.card}>
          <div style={ui.title}>
            Informations vehicule
          </div>

          <div style={ui.grid2}>

            <input
              style={{
  ...ui.input,
  colorScheme: "dark",
  WebkitAppearance: "auto",
  appearance: "auto",
  color: form.date
    ? "#fff"
    : "rgba(255,255,255,0.5)",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
}}
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />

            <input
              style={ui.input}
              name="chassis"
              value={form.chassis}
              onChange={handleChange}
              placeholder="N° de Chassis"
            />

            <select
              style={ui.select}
              name="marque"
              value={form.marque}
              onChange={handleChange}
            >
              <option value="">
                -- Marque --
              </option>

              {marques.map(
                (marque) => (
                  <option
                    key={marque}
                    value={marque}
                  >
                    {marque}
                  </option>
                )
              )}
            </select>

            <input
              style={ui.input}
              name="modele"
              value={form.modele}
              onChange={handleChange}
              placeholder="Modele"
            />

          </div>
        </div>

        {/* NATURE */}
        <div style={ui.card}>
          <div style={ui.title}>
            ️ Nature de l'avarie
          </div>

          <select
            style={ui.select}
            value={nature}
            onChange={(e) => {
              const value =
                e.target.value;

              setNature(value);

              if (
                value !== "Manque"
              ) {
                setManqueType("");
              }
            }}
          >
            <option value="">
              -- choisir --
            </option>

            {natures.map(
              (natureValue) => (
                <option
                  key={natureValue}
                  value={natureValue}
                >
                  {natureValue}
                </option>
              )
            )}
          </select>
        </div>

        {/* POSITION */}
        <div
          style={{
            ...ui.card,
            overflow: "hidden",
          }}
        >
          <div style={ui.title}>
            Position de l'avarie
          </div>

          <VehicleSchema
            key={
              editData?.id ||
              schemaKey
            }

            onChange={setZones}

            nature={nature}

            manqueType={
              manqueType
            }

            onManqueChange={
              setManqueType
            }

            initialZones={
              zones
            }

            initialAutre={
              zones
                .find(
                  (z) =>
                    z.startsWith(
                      "Autre:"
                    )
                )
                ?.replace(
                  "Autre: ",
                  ""
                ) || ""
            }
          />
        </div>

        {/* COTATION */}
        <div style={ui.card}>
          <div style={ui.title}>
            Cotation
          </div>

          <select
            style={{
              ...ui.select,
              width: "auto",
              minWidth: 120,
            }}

            value={cotation}

            onChange={(e) =>
              setCotation(
                e.target.value
              )
            }
          >
            <option value="V1">
              V1
            </option>

            <option value="V2">
              V2
            </option>

            <option value="V3">
              V3
            </option>
          </select>
        </div>

        {/* PHOTOS */}
        <div style={ui.card}>
          <div style={ui.title}>
            📷 Photos
          </div>

          <input
            key={fileInputKey}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) =>
              uploadPhotos(
                e.target.files
              )
            }
          />

          <div
            style={{
              marginTop: 8,
            }}
          >
            {photos.length} photo(s)
          </div>
        </div>

        {/* ACTIONS */}
        <div style={ui.actions}>

          <button
            style={ui.btn}
            onClick={save}
            disabled={loading}
          >
            {loading
              ? "Creation..."
              : editData
                ? "Modifier"
                : "Creer"}
          </button>

          {editData && (
            <button
              style={ui.btn}
              onClick={onCancelEdit}
            >
              Annuler
            </button>
          )}

          <button
            style={ui.btn}
            onClick={resetForm}
          >
            Vider
          </button>

          <button
            style={ui.btn}
            onClick={() =>
              (window.location.href = "/")
            }
          >
            Accueil
          </button>

        </div>

      </div>

      <Footer />

    </div>
  );
}