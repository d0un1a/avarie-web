import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import VehicleSchema from "./VehicleSchema";

export default function Formulaire({ editData, onSaved, onCancelEdit }) {
  const emptyForm = {
    date: "",
    chassis: "",
    marque: "",
    modele: "",
    transporteur: "",
    bl: "",
    responsabilite: "",
    provenance: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [zones, setZones] = useState([]);
  const [nature, setNature] = useState("");
  const [cotation, setCotation] = useState("V1");
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔥 MODE CREATE / EDIT
  useEffect(() => {
    if (editData) {
      setForm({
        date: editData.date || "",
        chassis: editData.chassis || "",
        marque: editData.marque || "",
        modele: editData.modele || "",
        transporteur: editData.transporteur || "",
        bl: editData.bl || "",
        responsabilite: editData.responsabilite || "",
        provenance: editData.provenance || "",
      });

      setZones(editData.zones || []);
      setNature(editData.nature || "");
      setCotation(editData.cotation || "V1");
      setPhotos(editData.photos || []);
    } else {
      setForm(emptyForm);
      setZones([]);
      setNature("");
      setCotation("V1");
      setPhotos([]);
    }
  }, [editData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 📷 UPLOAD PHOTOS
  const uploadPhotos = async (files) => {
    let uploaded = [];

    for (let file of files) {
      const fileName = `${Date.now()}-${file.name}`;

      const { error } = await supabase.storage
        .from("avaries-photos")
        .upload(fileName, file);

      if (error) continue;

      const { data } = supabase.storage
        .from("avaries-photos")
        .getPublicUrl(fileName);

      uploaded.push({
        name: file.name,
        url: data.publicUrl,
      });
    }

    setPhotos(uploaded);
  };

  // 💾 SAVE / UPDATE
  const save = async () => {
    if (!form.chassis) {
      alert("Châssis obligatoire");
      return;
    }

    setLoading(true);

    const entry = {
      ...form,
      zones,
      nature,
      cotation,
      photos,
      nbPhotos: photos.length,
      position: zones.join(", "),
      saisiPar: "web",
    };

    let result;

    if (editData?.id) {
      result = await supabase
        .from("Avaries")
        .update(entry)
        .eq("id", editData.id);
    } else {
      result = await supabase
        .from("Avaries")
        .insert([entry]);
    }

    setLoading(false);

    if (result.error) {
      alert(result.error.message);
      return;
    }

    alert(editData ? "Modification enregistrée ✔" : "Création réussie ✔");

    setForm(emptyForm);
    setZones([]);
    setNature("");
    setCotation("V1");
    setPhotos([]);

    if (onSaved) onSaved();
  };

  return (
    <div style={styles.page}>

      <h2 style={styles.title}>
        {editData ? "✏️ Modifier Avarie" : "➕ Création Avarie"}
      </h2>

      {/* 🚗 VEHICULE */}
      <div style={styles.card}>
        <h3>🚗 Informations véhicule</h3>

        <div style={styles.grid}>
          <input type="date" name="date" value={form.date} onChange={handleChange} />
          <input name="chassis" value={form.chassis} onChange={handleChange} placeholder="Châssis" />
          <input name="marque" value={form.marque} onChange={handleChange} placeholder="Marque" />
          <input name="modele" value={form.modele} onChange={handleChange} placeholder="Modèle" />
        </div>
      </div>

      {/* 📦 LIVRAISON */}
      <div style={styles.card}>
        <h3>📦 Informations de livraison</h3>

        <div style={styles.grid}>
          <input name="transporteur" value={form.transporteur} onChange={handleChange} placeholder="Transporteur" />
          <input name="bl" value={form.bl} onChange={handleChange} placeholder="BL" />
          <input name="responsabilite" value={form.responsabilite} onChange={handleChange} placeholder="Responsabilité" />
          <input name="provenance" value={form.provenance} onChange={handleChange} placeholder="Provenance" />
        </div>
      </div>

      {/* 📍 POSITION */}
      <div style={styles.card}>
        <h3>📍 Position de l’avarie</h3>
        <p style={{ fontSize: 12, color: "#666" }}>
          Cliquer sur le schéma
        </p>

        <VehicleSchema onChange={setZones} />

        {zones.length > 0 && (
          <p style={{ fontSize: 12 }}>
            Zones: {zones.join(", ")}
          </p>
        )}
      </div>

      {/* ⚠️ NATURE */}
      <div style={styles.card}>
        <h3>⚠️ Nature de l’avarie</h3>

        <select value={nature} onChange={(e) => setNature(e.target.value)}>
          <option value="">-- choisir --</option>
          <option value="Rayure">Rayure</option>
          <option value="Bosse">Bosse</option>
          <option value="Casse">Casse</option>
          <option value="Impact">Impact</option>
          <option value="Autre">Autre</option>
        </select>
      </div>

      {/* 📊 COTATION */}
      <div style={styles.card}>
        <h3>📊 Cotation</h3>

        <select value={cotation} onChange={(e) => setCotation(e.target.value)}>
          <option value="V1">V1 - Légère</option>
          <option value="V2">V2 - Moyenne</option>
          <option value="V3">V3 - Grave</option>
        </select>
      </div>

      {/* 📷 PHOTOS */}
      <div style={styles.card}>
        <h3>📷 Photos</h3>

        <input type="file" multiple onChange={(e) => uploadPhotos(e.target.files)} />

        <p>{photos.length} photo(s)</p>
      </div>

      {/* ACTIONS */}
      <div style={styles.actions}>
        <button onClick={save} disabled={loading} style={styles.save}>
          {loading ? "..." : editData ? "Modifier" : "Créer"}
        </button>

        {editData && (
          <button onClick={onCancelEdit} style={styles.cancel}>
            Annuler
          </button>
        )}
      </div>

    </div>
  );
}

/* 🎨 STYLE */
const styles = {
  page: {
    padding: 20,
    background: "#f5f5f5",
    minHeight: "100vh",
  },
  title: { marginBottom: 20 },
  card: {
    background: "#fff",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    border: "1px solid #ddd",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
  },
  actions: {
    display: "flex",
    gap: 10,
    marginTop: 20,
  },
  save: {
    padding: 12,
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  cancel: {
    padding: 12,
    background: "#f66",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
};