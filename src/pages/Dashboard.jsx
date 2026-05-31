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
  if (!filtered || filtered.length === 0) return;

  const cleaned = filtered.map((row) => ({
    ...row,
    photos: row.photos?.map((p) => p.url).join(", ") || "",
  }));

  const ws = XLSX.utils.json_to_sheet(cleaned);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Avaries");

  XLSX.writeFile(wb, "avaries.xlsx");
};
const exportCSV = () => {
  if (!filtered || filtered.length === 0) return;

  const headers = Object.keys(filtered[0]).join(",");

  const rows = filtered.map((row) =>
    Object.values(row)
      .map((v) =>
        typeof v === "string"
          ? `"${v.replace(/"/g, '""')}"` // sécurise CSV
          : v ?? ""
      )
      .join(",")
  );

  const csvContent = [headers, ...rows].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", "avaries.csv");
  link.click();
};
  const goHome = () => (window.location.href = "/");

  const filtered = data.filter((d) =>
    Object.values(d).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!a?.[sortKey]) return 1;
    if (!b?.[sortKey]) return -1;

    const A = String(a[sortKey]).toLowerCase();
    const B = String(b[sortKey]).toLowerCase();

    if (A < B) return sortAsc ? -1 : 1;
    if (A > B) return sortAsc ? 1 : -1;
    return 0;
  });

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const badgeColor = (c) => ({
    padding: "4px 10px",
    borderRadius: 999,
    color: "#fff",
    fontSize: 12,
    background:
      c === "V1"
        ? "linear-gradient(135deg,#22c55e,#16a34a)"
        : c === "V2"
        ? "linear-gradient(135deg,#f59e0b,#d97706)"
        : "linear-gradient(135deg,#ef4444,#b91c1c)",
  });

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>📊 Gestion des Avaries</h1>
      </div>

      {/* TOOLBAR */}
      <div style={styles.toolbar}>
        <button style={styles.btn} onClick={goHome}>🏠 Home</button>
        <button style={styles.btn} onClick={load}>🔄 Refresh</button>
        <button style={styles.btn} onClick={exportExcel}>⬇ Export xlsx</button>
        <button style={styles.btn} onClick={exportCSV}>⬇ Export CSV</button>

        <input
          placeholder="Recherche..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      </div>

      {/* EDIT FORM */}
      {edit && (
        <div style={styles.card}>
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
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.head}>
              <th onClick={() => toggleSort("date")} style={styles.th}>Date</th>
              <th onClick={() => toggleSort("chassis")} style={styles.th}>Châssis</th>
              <th onClick={() => toggleSort("marque")} style={styles.th}>Marque</th>
              <th onClick={() => toggleSort("modele")} style={styles.th}>Modèle</th>

              <th onClick={() => toggleSort("transporteur")} style={styles.th}>Transporteur</th>
              <th onClick={() => toggleSort("bl")} style={styles.th}>BL</th>
              <th onClick={() => toggleSort("responsabilite")} style={styles.th}>Responsabilité</th>
              <th onClick={() => toggleSort("provenance")} style={styles.th}>Provenance</th>

              <th onClick={() => toggleSort("nature")} style={styles.th}>Nature</th>
              <th onClick={() => toggleSort("position")} style={styles.th}>Zones</th>
              <th onClick={() => toggleSort("cotation")} style={styles.th}>Cotation</th>

              <th style={styles.th}>Photos</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {sorted.map((r) => (
              <tr
                key={r.id}
                style={styles.row}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td style={styles.td}>{r.date}</td>
                <td style={styles.td}>{r.chassis}</td>
                <td style={styles.td}>{r.marque}</td>
                <td style={styles.td}>{r.modele}</td>

                <td style={styles.td}>{r.transporteur}</td>
                <td style={styles.td}>{r.bl}</td>
                <td style={styles.td}>{r.responsabilite}</td>
                <td style={styles.td}>{r.provenance}</td>

                <td style={styles.td}>{r.nature}</td>

                <td style={styles.td}>
                  {r.position || (r.zones || []).join(", ")}
                </td>

                <td style={styles.td}>
                  <span style={badgeColor(r.cotation)}>
                    {r.cotation}
                  </span>
                </td>

                <td style={styles.td}>
  {r.photos?.length > 0 ? (
    <div style={{ position: "relative", display: "inline-block" }}>
      <img
        src={r.photos[0].url}
        style={{
          width: 35,
          height: 35,
          borderRadius: 6,
          objectFit: "cover",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 40,
          left: 0,
          display: "none",
        }}
        className="preview"
      >
        <img
          src={r.photos[0].url}
          style={{
            width: 120,
            borderRadius: 8,
          }}
        />
      </div>
    </div>
  ) : (
    "—"
  )}
</td>

                <td style={styles.td}>
                  <button onClick={() => setEdit(r)} style={styles.editBtn}>✏️</button>
                  <button onClick={() => remove(r.id)} style={styles.delBtn}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* STYLE PRO SaaS */
const styles = {
  page: {
    padding: 20,
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    minHeight: "100vh",
    fontFamily: "Arial",
    color: "#fff",
  },

  header: {
    marginBottom: 15,
  },

  title: {
    margin: 0,
    fontSize: 24,
  },

  toolbar: {
    display: "flex",
    gap: 10,
    marginBottom: 15,
    flexWrap: "wrap",
  },

  btn: {
    padding: "10px 12px",
    border: "none",
    borderRadius: 8,
    background: "#111",
    color: "#fff",
    cursor: "pointer",
  },

  search: {
    flex: 1,
    minWidth: 200,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
  },

  card: {
    background: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },

tableWrap: {
  background: "rgba(255,255,255,0.06)",
  borderRadius: 14,

  maxHeight: "calc(100vh - 160px)",
  overflowY: "auto",
  overflowX: "auto",   // ✅ scroll horizontal ici uniquement

  border: "1px solid rgba(255,255,255,0.12)",
  backdropFilter: "blur(14px)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
},

table: {
  minWidth: "1400px",   // ✅ IMPORTANT : pas width 100%
  borderCollapse: "collapse",
  color: "#fff",
},

  head: {
    background: "rgba(0,0,0,0.55)",
    position: "sticky",
    top: 0,
    zIndex: 2,
    backdropFilter: "blur(10px)",
  },

  row: {
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    transition: "0.2s",
  },

  th: {
    padding: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
    color: "#fff",
    fontSize: 13,
    textTransform: "uppercase",
  },

  td: {
    padding: 12,
    whiteSpace: "nowrap",
    color: "#e5e7eb",
    fontSize: 13,
  },

  editBtn: {
    marginRight: 5,
    background: "#3498db",
    color: "#fff",
    border: "none",
    padding: "5px 8px",
    borderRadius: 6,
    cursor: "pointer",
  },

  delBtn: {
    background: "#e74c3c",
    color: "#fff",
    border: "none",
    padding: "5px 8px",
    borderRadius: 6,
    cursor: "pointer",
  },
};