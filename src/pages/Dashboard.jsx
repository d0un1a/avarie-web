import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import Formulaire from "./Formulaire";
import * as XLSX from "xlsx";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [edit, setEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortAsc, setSortAsc] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("Avaries").select("*");
    setData(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    await supabase.from("Avaries").delete().eq("id", id);
    load();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Avaries");
    XLSX.writeFile(wb, "avaries.xlsx");
  };

  // 🔎 SEARCH
  const filtered = data.filter((d) =>
    Object.values(d).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  // ↕ SORT
  const sorted = [...filtered].sort((a, b) => {
    if (!a?.[sortKey]) return 1;
    if (!b?.[sortKey]) return -1;

    const valA = a[sortKey].toString().toLowerCase();
    const valB = b[sortKey].toString().toLowerCase();

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const badgeColor = (c) => {
    if (c === "V1") return "#2ecc71";
    if (c === "V2") return "#f39c12";
    if (c === "V3") return "#e74c3c";
    return "#999";
  };

  return (
    <div style={{ padding: 20, background: "#f5f6fa", minHeight: "100vh" }}>

      <h1>📊 Dashboard Avaries</h1>

      {/* TOOLBAR */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <input
          placeholder="🔎 Recherche..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8, flex: 1 }}
        />

        <button onClick={load}>🔄 Refresh</button>
        <button onClick={exportExcel}>⬇ Excel</button>
      </div>

      {/* EDIT FORM */}
      {edit && (
        <div style={{ marginBottom: 20, padding: 10, background: "#fff" }}>
          <h3>✏️ Modification</h3>

          <Formulaire
            editData={edit}
            onSaved={() => {
              setEdit(null);
              load();
            }}
            onCancelEdit={() => setEdit(null)}
          />
        </div>
      )}

      {/* TABLE */}
      <div style={{ overflowX: "auto", background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>

          <thead>
            <tr style={{ background: "#111", color: "#fff" }}>

              {/* 🚗 VEHICULE */}
              <th onClick={() => toggleSort("date")} style={th}>Date</th>
              <th onClick={() => toggleSort("chassis")} style={th}>Châssis</th>
              <th onClick={() => toggleSort("marque")} style={th}>Marque</th>
              <th onClick={() => toggleSort("modele")} style={th}>Modèle</th>

              {/* 📦 LIVRAISON */}
              <th onClick={() => toggleSort("transporteur")} style={th}>Transporteur</th>
              <th onClick={() => toggleSort("bl")} style={th}>BL</th>
              <th onClick={() => toggleSort("responsabilite")} style={th}>Responsabilité</th>
              <th onClick={() => toggleSort("provenance")} style={th}>Provenance</th>

              {/* ⚠️ AVARIE */}
              <th onClick={() => toggleSort("nature")} style={th}>Nature</th>
              <th onClick={() => toggleSort("position")} style={th}>Zones</th>
              <th onClick={() => toggleSort("cotation")} style={th}>Cotation</th>

              {/* 📷 MEDIA */}
              <th style={th}>Photos</th>

              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>

                {/* VEHICULE */}
                <td style={td}>{r.date}</td>
                <td style={td}>{r.chassis}</td>
                <td style={td}>{r.marque}</td>
                <td style={td}>{r.modele}</td>

                {/* LIVRAISON */}
                <td style={td}>{r.transporteur}</td>
                <td style={td}>{r.bl}</td>
                <td style={td}>{r.responsabilite}</td>
                <td style={td}>{r.provenance}</td>

                {/* AVARIE */}
                <td style={td}>{r.nature}</td>
                <td style={td}>
                  {r.position || (r.zones || []).join(", ")}
                </td>

                <td style={td}>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    color: "#fff",
                    background: badgeColor(r.cotation),
                  }}>
                    {r.cotation}
                  </span>
                </td>

                {/* PHOTOS */}
                <td style={td}>
                  {r.nbPhotos || 0}
                </td>

                {/* ACTIONS */}
                <td style={td}>
                  <button onClick={() => setEdit(r)}>✏️</button>
                  <button onClick={() => remove(r.id)}>🗑</button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}

/* styles */
const th = {
  padding: 10,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const td = {
  padding: 10,
  whiteSpace: "nowrap",
};