import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import VehicleSchema from "./VehicleSchema";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function Formulaire({ editData, onSaved, onCancelEdit }) {
  const isMobile = useIsMobile();
  const [schemaKey, setSchemaKey] = useState(0);
  const [manqueType, setManqueType] = useState("");
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
    "Renault", "Dacia", "Peugeot", "Citroen", "Toyota", "Volkswagen",
    "Ford", "Fiat", "Hyundai", "Kia", "BMW", "Mercedes", "Autre"
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
    if (!form.chassis) return alert("Chassis obligatoire");
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
    };
    const result = editData?.id
      ? await supabase.from("Avaries").update(entry).eq("id", editData.id)
      : await supabase.from("Avaries").insert([entry]);
    setLoading(false);
    if (result.error) return alert(result.error.message);
    alert(editData ? "Modification ✔" : "Creation ✔");
    setForm(emptyForm);
    setZones([]);
    setNature("");
    setCotation("V1");
    setPhotos([]);
    onSaved?.();
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setZones([]);
    setNature("");
    setCotation("V1");
    setPhotos([]);
    setSchemaKey(prev => prev + 1);
  };

  const ui = {
    page: {
      padding: isMobile ? 12 : 24,
      minHeight: "100vh",
      fontFamily: "Arial",
      background: "linear-gradient(135deg, #0f172a, #1e293b)",
      color: "#fff",
    },
    header: {
      fontSize: isMobile ? 18 : 22,
      fontWeight: 700,
      marginBottom: isMobile ? 12 : 20,
      color: "#fff",
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
      gap: 12,
    },
    card: {
      background: "rgba(255,255,255,0.06)",
      padding: isMobile ? 12 : 18,
      borderRadius: 12,
      marginBottom: isMobile ? 10 : 16,
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
      width: "100%",
      boxSizing: "border-box",
    },
    select: {
      padding: 10,
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(0,0,0,0.25)",
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

  return (
    <div style={ui.page}>
      <div style={ui.header}>
        {editData ? "✏️ Modifier Avarie" : "➕ Creation Avarie"}
      </div>

      {/* VEHICULE */}
      <div style={ui.card}>
        <div style={ui.title}>🚗 Informations vehicule</div>
        <div style={ui.grid2}>
          <input
            style={ui.input}
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
            <option value="">-- Marque --</option>
            {marques.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
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

      {/* LIVRAISON */}
      <div style={ui.card}>
        <div style={ui.title}>📦 Livraison</div>
        <div style={ui.grid2}>
          <input
            style={ui.input}
            name="transporteur"
            value={form.transporteur}
            onChange={handleChange}
            placeholder="Transporteur"
          />
          <input
            style={ui.input}
            name="bl"
            value={form.bl}
            onChange={handleChange}
            placeholder="BL"
          />
          <input
            style={ui.input}
            name="responsabilite"
            value={form.responsabilite}
            onChange={handleChange}
            placeholder="Responsabilite"
          />
          <input
            style={ui.input}
            name="provenance"
            value={form.provenance}
            onChange={handleChange}
            placeholder="Provenance"
          />
        </div>
      </div>

      {/* NATURE */}
      <div style={ui.card}>
        <div style={ui.title}>⚠️ Nature de l'avarie</div>
        <select
          style={ui.select}
          value={nature}
          onChange={(e) => {
            const value = e.target.value;
            setNature(value);
            if (value !== "Manque") setManqueType("");
          }}
        >
          <option value="">-- choisir --</option>
          <option>Eclat</option>
          <option>Rayure</option>
          <option>Bosse</option>
          <option>Cabosse</option>
          <option>Frottement</option>
          <option>Enforcement</option>
          <option>Ferayeur</option>
          <option>Picot</option>
          <option>Mal plaquet</option>
          <option>Dechire</option>
          <option>Crevaison</option>
          <option>Fissuration</option>
          <option>Casse</option>
          <option>Manque</option>
        </select>
      </div>

      {/* POSITION */}
      <div style={ui.card}>
        <div style={ui.title}>📍 Position de l'avarie</div>
        <VehicleSchema
          key={schemaKey}
          onChange={setZones}
          nature={nature}
          manqueType={manqueType}
          onManqueChange={setManqueType}
        />
      </div>

      {/* COTATION */}
      <div style={ui.card}>
        <div style={ui.title}>📊 Cotation</div>
        <select
          style={ui.select}
          value={cotation}
          onChange={(e) => setCotation(e.target.value)}
        >
          <option value="V1">V1</option>
          <option value="V2">V2</option>
          <option value="V3">V3</option>
        </select>
      </div>

      {/* PHOTOS */}
      <div style={ui.card}>
        <div style={ui.title}>📷 Photos</div>
        <input
          type="file"
          multiple
          onChange={(e) => uploadPhotos(e.target.files)}
        />
        <div style={{ marginTop: 8 }}>{photos.length} photo(s)</div>
      </div>

      {/* ACTIONS */}
      <div style={ui.actions}>
        <button
          style={{ ...ui.btn, ...ui.primary }}
          onClick={save}
          disabled={loading}
        >
          {loading ? "..." : editData ? "Modifier" : "Creer"}
        </button>

        {editData && (
          <button style={{ ...ui.btn, ...ui.danger }} onClick={onCancelEdit}>
            Annuler
          </button>
        )}

        <button style={{ ...ui.btn, ...ui.primary }} onClick={resetForm}>
          🧹 Vider
        </button>

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
