import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import Formulaire from "./Formulaire";
import * as XLSX from "xlsx";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function Dashboard() {
  const isMobile = useIsMobile();
  const [data, setData] = useState([]);
  const [edit, setEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortAsc, setSortAsc] = useState(true);
  const [user, setUser] = useState(null);

  const load = async () => {
    const { data } = await supabase.from("Avaries").select("*");
    setData(data || []);
  };

  useEffect(() => {
    load();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const remove = async (id) => {
    await supabase.from("Avaries").delete().eq("id", id);
    load();
  };

  const prepareRows = (rows) =>
    rows.map((row) => {
      const pos = row.position || (row.zones || []).join(", ");
      return {
        date: row.date || "",
        chassis: row.chassis || "",
        modele: row.modele || "",
        marque: row.marque || "",
        provenance: row.provenance || "",
        nature: row.nature || "",
        position:
          row.nature === "Manque" && row.manqueType
            ? pos ? `${pos} — ${row.manqueType}` : row.manqueType
            : pos,
        transporteur: row.transporteur || "",
        bl: row.bl || "",
        responsabilite: row.responsabilite || "",
        cotation: row.cotation || "",
        photos: row.photos?.map((p) => p.url).join(", ") || "",
      };
    });

  const exportExcel = () => {
    if (!filtered || filtered.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(prepareRows(filtered));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Avaries");
    XLSX.writeFile(wb, "avaries.xlsx");
  };

  const exportCSV = () => {
    if (!filtered || filtered.length === 0) return;
    const cleaned = prepareRows(filtered);
    const headers = Object.keys(cleaned[0]).join(",");
    const rows = cleaned.map((row) =>
      Object.values(row).map((v) =>
        typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v ?? ""
      ).join(",")
    );
    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "avaries.csv");
    link.click();
  };

  const filtered = data.filter((d) =>
    Object.values(d).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!a?.[sortKey]) return 1;
    if (!b?.[sortKey]) return -1;
    const A = String(a[sortKey]).toLowerCase();
    const B = String(b[sortKey]).toLowerCase();
    return A < B ? (sortAsc ? -1 : 1) : A > B ? (sortAsc ? 1 : -1) : 0;
  });

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const badgeColor = (c) => ({
    padding: "4px 10px", borderRadius: 999, color: "#fff", fontSize: 12,
    background: c === "V1"
      ? "linear-gradient(135deg,#22c55e,#16a34a)"
      : c === "V2"
      ? "linear-gradient(135deg,#f59e0b,#d97706)"
      : "linear-gradient(135deg,#ef4444,#b91c1c)",
  });

  // ── Carte mobile pour chaque ligne ──
  const MobileCard = ({ r }) => {
    const pos = r.position || (r.zones || []).join(", ");
    return (
      <div style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12, padding: 14, marginBottom: 10,
      }}>
        {/* En-tete carte */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:"#fff" }}>{r.chassis || "—"}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{r.date}</div>
          </div>
          <span style={badgeColor(r.cotation)}>{r.cotation}</span>
        </div>

        {/* Infos en grille 2 col */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 12px", marginBottom:10 }}>
          {[
            ["Marque",        r.marque],
            ["Modele",        r.modele],
            ["Transporteur",  r.transporteur],
            ["BL",            r.bl],
            ["Responsabilite",r.responsabilite],
            ["Provenance",    r.provenance],
            ["Nature",        r.nature],
          ].map(([label, val]) => val ? (
            <div key={label}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", textTransform:"uppercase" }}>{label}</div>
              <div style={{ fontSize:12, color:"#e5e7eb", marginTop:1 }}>{val}</div>
            </div>
          ) : null)}
        </div>

        {/* Zones */}
        {pos && (
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", marginBottom:4 }}>Position</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {pos.split(",").map(z => z.trim()).filter(Boolean).map((zone, i) => (
                <span key={i} style={{
                  padding:"2px 8px", borderRadius:999, fontSize:11,
                  background:"rgba(255,255,255,0.1)", color:"#e5e7eb",
                }}>{zone}</span>
              ))}
              {r.nature === "Manque" && r.manqueType && (
                <span style={{
                  padding:"2px 8px", borderRadius:999, fontSize:11,
                  background:"rgba(251,191,36,0.2)", color:"#fbbf24",
                }}>{r.manqueType}</span>
              )}
            </div>
          </div>
        )}

        {/* Photo + Actions */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          {r.photos?.length > 0
            ? <img src={r.photos[0].url} style={{ width:44, height:44, borderRadius:8, objectFit:"cover" }} />
            : <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>Pas de photo</span>
          }
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setEdit(r)} style={styles.editBtn}>✏️ Modifier</button>
            <button onClick={() => remove(r.id)} style={styles.delBtn}>🗑</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ ...styles.page, padding: isMobile ? 12 : 20 }}>

      {/* HEADER */}
      <div style={{
        ...styles.header,
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? 8 : 0,
        marginBottom: isMobile ? 10 : 15,
      }}>
        <h1 style={{ ...styles.title, fontSize: isMobile ? 18 : 24 }}>
          📊 Gestion des Avaries
        </h1>
        <div style={styles.userBar}>
          {user && (
            <span style={{ ...styles.userEmail, fontSize: isMobile ? 11 : 13 }}>
              👤 {user.email}
            </span>
          )}
          <button style={styles.logoutBtn} onClick={logout}>
            🚪 {isMobile ? "" : "Deconnexion"}
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{ ...styles.toolbar, gap: isMobile ? 6 : 10 }}>
        <button style={styles.btn} onClick={() => window.location.href = "/"}>🏠</button>
        <button style={styles.btn} onClick={load}>🔄</button>
        <button style={styles.btn} onClick={exportExcel}>⬇ xlsx</button>
        <button style={styles.btn} onClick={exportCSV}>⬇ csv</button>
        <input
          placeholder="Recherche..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...styles.search, fontSize: isMobile ? 13 : 14 }}
        />
      </div>

      {/* EDIT FORM */}
      {edit && (
        <div style={{
          ...styles.card,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, marginBottom: 15, padding: isMobile ? 10 : 15,
        }}>
          <Formulaire
            editData={edit}
            onSaved={() => { setEdit(null); load(); }}
            onCancelEdit={() => setEdit(null)}
          />
        </div>
      )}

      {/* COMPTEUR */}
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>
        {sorted.length} avarie(s) trouvee(s)
      </div>

      {/* AFFICHAGE : Cartes sur mobile, Tableau sur desktop */}
      {isMobile ? (
        <div>
          {sorted.length === 0 && (
            <div style={{ textAlign:"center", color:"rgba(255,255,255,0.4)", padding:40 }}>
              Aucune avarie trouvee
            </div>
          )}
          {sorted.map((r) => <MobileCard key={r.id} r={r} />)}
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.head}>
                {["date","chassis","marque","modele","transporteur","bl","responsabilite","provenance","nature"].map(k => (
                  <th key={k} onClick={() => toggleSort(k)} style={styles.th}>
                    {k.charAt(0).toUpperCase()+k.slice(1)} {sortKey===k ? (sortAsc?"↑":"↓") : ""}
                  </th>
                ))}
                <th style={styles.th}>Position</th>
                <th style={styles.th}>Cotation</th>
                <th style={styles.th}>Photos</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id} style={styles.row}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
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
                  <td style={{ ...styles.td, whiteSpace:"normal" }}>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {(r.position || (r.zones||[]).join(", ")).split(",").map(z=>z.trim()).filter(Boolean).map((zone,i) => (
                        <span key={i} style={styles.zoneBadge}>{zone}</span>
                      ))}
                      {r.nature==="Manque" && r.manqueType && (
                        <span style={styles.zoneBadge}>{r.manqueType}</span>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}><span style={badgeColor(r.cotation)}>{r.cotation}</span></td>
                  <td style={styles.td}>
                    {r.photos?.length > 0
                      ? <img src={r.photos[0].url} style={{ width:35, height:35, borderRadius:6, objectFit:"cover" }} />
                      : "—"
                    }
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
      )}
    </div>
  );
}

const styles = {
  page: {
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    minHeight: "100vh", fontFamily: "Arial", color: "#fff",
  },
  header: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  title: { margin:0 },
  userBar: { display:"flex", alignItems:"center", gap:12 },
  userEmail: { color:"rgba(255,255,255,0.6)" },
  logoutBtn: {
    padding:"8px 14px", border:"none", borderRadius:8,
    background:"#e74c3c", color:"#fff", cursor:"pointer", fontWeight:600,
  },
  toolbar: { display:"flex", marginBottom:12, flexWrap:"wrap" },
  btn: {
    padding:"10px 12px", border:"none", borderRadius:8,
    background:"#111", color:"#fff", cursor:"pointer",
  },
  search: {
    flex:1, minWidth:150, padding:10, borderRadius:8,
    border:"1px solid rgba(255,255,255,0.2)",
    background:"rgba(0,0,0,0.3)", color:"#fff", outline:"none",
  },
  card: {},
  tableWrap: {
    background:"rgba(255,255,255,0.06)", borderRadius:14,
    maxHeight:"calc(100vh - 160px)", overflowY:"auto", overflowX:"auto",
    border:"1px solid rgba(255,255,255,0.12)",
    backdropFilter:"blur(14px)", boxShadow:"0 10px 30px rgba(0,0,0,0.25)",
  },
  table: { minWidth:"1400px", borderCollapse:"collapse", color:"#fff" },
  head: { background:"rgba(0,0,0,0.55)", position:"sticky", top:0, zIndex:2, backdropFilter:"blur(10px)" },
  row: { borderBottom:"1px solid rgba(255,255,255,0.08)", transition:"0.2s" },
  th: { padding:12, cursor:"pointer", whiteSpace:"nowrap", color:"#fff", fontSize:13, textTransform:"uppercase" },
  td: { padding:12, color:"#e5e7eb", fontSize:13, whiteSpace:"nowrap" },
  zoneBadge: { padding:"3px 8px", borderRadius:999, fontSize:13, color:"#e5e7eb", whiteSpace:"nowrap" },
  editBtn: { marginRight:5, background:"#3498db", color:"#fff", border:"none", padding:"5px 8px", borderRadius:6, cursor:"pointer" },
  delBtn: { background:"#e74c3c", color:"#fff", border:"none", padding:"5px 8px", borderRadius:6, cursor:"pointer" },
};
