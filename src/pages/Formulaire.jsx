import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import VehicleSchema from "./VehicleSchema";

export default function Formulaire({ editData, onSaved, onCancelEdit }) {
    const [schemaKey, setSchemaKey] = useState(0);
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
  const marques = [
  "Renault","Dacia","Peugeot","Citroën","Toyota","Volkswagen",
  "Ford","Fiat","Hyundai","Kia","BMW","Mercedes","Autre"
  ];

const responsabilites = [
  "Transporteur",
  "Chargeur",
  "Destinataire",
  "Fabricant",
  "Indéterminée"
];
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
  setForm({ ...emptyForm });
  setZones([]);
  setNature("");
  setCotation("V1");
  setPhotos([]);
}
}, [editData]);
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

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

      uploaded.push({ name: file.name, url: data.publicUrl });
    }

    setPhotos(uploaded);
  };

  const save = async () => {
    if (!form.chassis) return alert("Châssis obligatoire");

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

    const result = editData?.id
      ? await supabase.from("Avaries").update(entry).eq("id", editData.id)
      : await supabase.from("Avaries").insert([entry]);

    setLoading(false);

    if (result.error) return alert(result.error.message);

    alert(editData ? "Modification ✔" : "Création ✔");

    setForm(emptyForm);
    setZones([]);
    setNature("");
    setCotation("V1");
    setPhotos([]);

    onSaved?.();
  };

  /* 🎨 STYLE SaaS UNIFIÉ */
  const ui = {
    page: {
      padding: 24,
      minHeight: "100vh",
      fontFamily: "Arial",
      background: "linear-gradient(135deg, #0f172a, #1e293b)",
      color: "#fff",
    },

    header: {
      fontSize: 22,
      fontWeight: 700,
      marginBottom: 20,
      color: "#fff",
    },

    grid2: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 12,
    },

    card: {
      background: "rgba(255,255,255,0.06)",
      padding: 18,
      borderRadius: 12,
      marginBottom: 16,
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      backdropFilter: "blur(14px)",
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
      border: "1px solid rgba(255,255,255,0.15)",
      outline: "none",
      background: "rgba(0,0,0,0.25)",
      color: "#fff",
    },

    select: {
      padding: 10,
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(0,0,0,0.25)",
      color: "#fff",
    },

    actions: {
      display: "flex",
      gap: 10,
      marginTop: 20,
    },

    btn: {
      padding: "10px 14px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontWeight: 600,
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
const resetForm = () => {
  setForm({ ...emptyForm });
  setZones([]);
  setNature("");
  setCotation("V1");
  setPhotos([]);

  setSchemaKey(prev => prev + 1); // 👈 IMPORTANT
};
  return (
    <div style={ui.page}>
      <div style={ui.header}>
        {editData ? "✏️ Modifier Avarie" : "➕ Création Avarie"}
      </div>

      {/* VEHICULE */}
      <div style={ui.card}>
        <div style={ui.title}>🚗 Informations véhicule</div>
        <div style={ui.grid2}>
          <input style={ui.input} type="date" name="date" value={form.date} onChange={handleChange} />
          <input style={ui.input} name="chassis" value={form.chassis} onChange={handleChange} placeholder="N° de Châssis" />
          <select
  style={ui.select}
  name="marque"
  value={form.marque}
  onChange={handleChange}
>
  <option value="">-- Marque --</option>
  {marques.map((m) => (
    <option key={m} value={m}>{m}</option>
  ))}
</select>
          <input style={ui.input} name="modele" value={form.modele} onChange={handleChange} placeholder="Modèle" />
        </div>
      </div>

      {/* LIVRAISON */}
      <div style={ui.card}>
        <div style={ui.title}>📦 Livraison</div>
        <div style={ui.grid2}>
          <input style={ui.input} name="transporteur" value={form.transporteur} onChange={handleChange} placeholder="Transporteur" />
          <input style={ui.input} name="bl" value={form.bl} onChange={handleChange} placeholder="BL" />
          <select
  style={ui.select}
  name="responsabilite"
  value={form.responsabilite}
  onChange={handleChange}
>
  <option value="">-- Responsabilité --</option>
  {responsabilites.map((r) => (
    <option key={r} value={r}>{r}</option>
  ))}
</select>
          <input style={ui.input} name="provenance" value={form.provenance} onChange={handleChange} placeholder="Provenance" />
        </div>
      </div>

      {/* POSITION */}
      <div style={ui.card}>
        <div style={ui.title}>📍 Position de l’avarie</div>
        <VehicleSchema
  key={schemaKey}
  onChange={setZones}
/>
      </div>

      {/* NATURE */}
      <div style={ui.card}>
        <div style={ui.title}>⚠️ Nature</div>
        <select style={ui.select} value={nature} onChange={(e) => setNature(e.target.value)}>
          <option value="">-- choisir --</option>
          <option>Éclat</option>
          <option>Rayure</option>
          <option>Bosse</option>
          <option>Cabosse</option>
          <option>Frottement</option>
          <option>Enforcement</option>
          <option>Férayeur</option>
          <option>Picot</option>
          <option>Mal plaquet</option>
          <option>Dechiré</option>
          <option>Crevaison</option>
          <option>Manque</option>
        </select>
      </div>

      {/* COTATION */}
      <div style={ui.card}>
        <div style={ui.title}>📊 Cotation</div>
        <select style={ui.select} value={cotation} onChange={(e) => setCotation(e.target.value)}>
          <option value="V1">V1</option>
          <option value="V2">V2</option>
          <option value="V3">V3</option>
        </select>
      </div>

      {/* PHOTOS */}
      <div style={ui.card}>
        <div style={ui.title}>📷 Photos</div>
        <input type="file" multiple onChange={(e) => uploadPhotos(e.target.files)} />
        <div style={{ marginTop: 8 }}>{photos.length} photo(s)</div>
      </div>

      {/* ACTIONS */}

<div style={ui.actions}>
  <button
    style={{ ...ui.btn, ...ui.primary }}
    onClick={save}
    disabled={loading}
  >
    {loading ? "..." : editData ? "Modifier" : "Créer"}
  </button>

  {editData && (
    <button style={{ ...ui.btn, ...ui.danger }} onClick={onCancelEdit}>
      Annuler
    </button>
  )}
<button
  style={{ ...ui.btn, ...ui.primary }}
  onClick={resetForm}
>
  🧹 Vider
</button>

  {/* 🏠 HOME BUTTON */}
  <button
   style={{ ...ui.btn, ...ui.primary }}
   onClick={() => (window.location.href = "/")}
  >
    🏠 Home
  </button>
</div>
    </div>
  );
}