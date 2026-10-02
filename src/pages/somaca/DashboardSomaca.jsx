import { useEffect, useState } from "react";
import { supabase } from "../../api/supabase";
import FormulairSomaca from "./FormulairSomaca";
import { activeProfile } from "../../config/appConfig";
import AppNavbar from "../../components/AppNavbar";
import Footer from "../../components/Footer";
import * as XLSX from "xlsx";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handler);

    return () => {
      window.removeEventListener("resize", handler);
    };
  }, []);

  return isMobile;
}

export default function DashboardSomaca() {
  const isMobile = useIsMobile();

  const [data, setData] = useState([]);
  const [edit, setEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [user, setUser] = useState(null);

  const load = async () => {
    const { data, error } = await supabase
      .from(activeProfile.apiTable)
      .select("*")
      .eq("company", "somaca");

    if (error) {
      console.error("Erreur chargement SOMACA :", error);
      return;
    }

    setData(data || []);
  };

  useEffect(() => {
    load();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
  }, []);

  const remove = async (id) => {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette avarie ?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from(activeProfile.apiTable)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erreur suppression :", error);
      return;
    }

    load();
  };

  const prepareRows = (rows) =>
    rows.map((row) => {
      const pos =
        row.position || (row.zones || []).join(", ");

      return {
        date: row.date || "",
        chassis: row.chassis || "",
        modele: row.modele || "",
        marque: row.marque || "",
        provenance: row.provenance || "",
        nature: row.nature || "",
        position:
          row.nature === "Manque" && row.manqueType
            ? pos
              ? `${pos} — ${row.manqueType}`
              : row.manqueType
            : pos,
        transporteur: row.transporteur || "",
        bl: row.bl || "",
        responsabilite: row.responsabilite || "",
        cotation: row.cotation || "",
        photos:
          row.photos?.map((p) => p.url).join(", ") || "",
      };
    });

  const filtered = data.filter((d) =>
    Object.values(d)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "cotation") {
      const order = {
        V1: 1,
        V2: 2,
        V3: 3,
      };

      const A =
        order[String(a?.cotation || "").toUpperCase()] ?? 999;

      const B =
        order[String(b?.cotation || "").toUpperCase()] ?? 999;

      return sortAsc ? A - B : B - A;
    }

    if (!a?.[sortKey]) return 1;
    if (!b?.[sortKey]) return -1;

    const A = String(a[sortKey]).toLowerCase();
    const B = String(b[sortKey]).toLowerCase();

    return A < B
      ? sortAsc
        ? -1
        : 1
      : A > B
      ? sortAsc
        ? 1
        : -1
      : 0;
  });

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const exportExcel = () => {
    if (!filtered || filtered.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(
      prepareRows(filtered)
    );

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Avaries"
    );

    XLSX.writeFile(
      wb,
      `avaries_${activeProfile.id}.xlsx`
    );
  };

  const exportCSV = () => {
    if (!filtered || filtered.length === 0) return;

    const cleaned = prepareRows(filtered);

    const headers = Object.keys(cleaned[0]).join(",");

    const rows = cleaned.map((row) =>
      Object.values(row)
        .map((v) =>
          typeof v === "string"
            ? `"${v.replace(/"/g, '""')}"`
            : v ?? ""
        )
        .join(",")
    );

    const blob = new Blob(
      [[headers, ...rows].join("\n")],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const link = document.createElement("a");

    link.setAttribute(
      "href",
      URL.createObjectURL(blob)
    );

    link.setAttribute(
      "download",
      `avaries_${activeProfile.id}.csv`
    );

    link.click();
  };

  const badgeColor = (c) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 10px",
    borderRadius: 999,
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    background:
      c === "V1"
  ? "linear-gradient(135deg,#ef4444,#dc2626)"
  : c === "V2"
    ? "linear-gradient(135deg,#f59e0b,#d97706)"
    : "linear-gradient(135deg,#22c55e,#16a34a)"
  });

  const MobileCard = ({ r }) => {
    const pos =
      r.position ||
      (r.zones || []).join(", ");

    return (
      <div style={styles.mobileCard}>
        <div style={styles.mobileCardHeader}>
          <div>
            <div style={styles.mobileChassis}>
              {r.chassis || "—"}
            </div>

            <div style={styles.mobileDate}>
              {r.date}
            </div>
          </div>

          <span style={badgeColor(r.cotation)}>
            {r.cotation || "—"}
          </span>
        </div>

        <div style={styles.mobileGrid}>
          {[
            ["Marque", r.marque],
            ["Modèle", r.modele],
            ["Transporteur", r.transporteur],
            ["BL", r.bl],
            ["Responsabilité", r.responsabilite],
            ["Provenance", r.provenance],
            ["Nature", r.nature],
          ].map(([label, val]) =>
            val ? (
              <div key={label}>
                <div style={styles.mobileLabel}>
                  {label}
                </div>

                <div style={styles.mobileValue}>
                  {val}
                </div>
              </div>
            ) : null
          )}
        </div>

        {pos && (
          <div style={styles.positionBlock}>
            <div style={styles.mobileLabel}>
              Position
            </div>

            <div style={styles.zoneContainer}>
              {pos
                .split(",")
                .map((z) => z.trim())
                .filter(Boolean)
                .map((zone, i) => (
                  <span
                    key={i}
                    style={styles.zoneBadge}
                  >
                    {zone}
                  </span>
                ))}

              {r.nature === "Manque" &&
                r.manqueType && (
                  <span style={styles.manqueBadge}>
                    {r.manqueType}
                  </span>
                )}
            </div>
          </div>
        )}

        <div style={styles.mobileActions}>
          {r.photos?.length > 0 ? (
            <img
              src={r.photos[0].url}
              alt="Avarie"
              style={styles.mobilePhoto}
            />
          ) : (
            <span style={styles.noPhoto}>
              Pas de photo
            </span>
          )}

          <div style={styles.actionGroup}>
            <button
              type="button"
              onClick={() => setEdit(r)}
              style={styles.editBtn}
              title="Modifier cette avarie"
              aria-label="Modifier cette avarie"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path
                  d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"
                />
              </svg>

              <span>Modifier</span>
            </button>

            <button
              type="button"
              onClick={() => remove(r.id)}
              style={styles.delBtn}
              title="Supprimer cette avarie"
              aria-label="Supprimer cette avarie"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v5" />
                <path d="M14 11v5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (edit) {
    return (
      <FormulairSomaca
        editData={edit}
        onSaved={() => {
          setEdit(null);
          load();
        }}
        onCancelEdit={() => setEdit(null)}
      />
    );
  }

  return (
    <div style={styles.page}>

      {/* NAVBAR */}

      <AppNavbar
        user={user}
        activeProfile={activeProfile}
        isMobile={isMobile}
      />

      <div
        style={{
          padding: isMobile ? 12 : 20,
        }}
      >
        {/* TOOLBAR */}
        <div
          style={{
            ...styles.toolbar,
            gap: isMobile ? 6 : 10,
          }}
        >
          <button
            type="button"
            style={styles.btn}
            onClick={() => {
              window.location.href = "/";
            }}
            title="Accueil"
          >
            <span style={styles.homeIcon}>
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 10 9-7 9 7" />
                <path d="M5 9v11h14V9" />
                <path d="M9 20v-6h6v6" />
              </svg>
            </span>

            <span>Accueil</span>
          </button>

          <button
            type="button"
            style={styles.btn}
            onClick={exportExcel}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>

            <span>Excel</span>
          </button>

          <button
            type="button"
            style={styles.btn}
            onClick={exportCSV}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>

            <span>CSV</span>
          </button>

          <input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={{
              ...styles.search,
              fontSize: isMobile ? 13 : 14,
            }}
          />
        </div>

        {/* COMPTEUR */}
        <div style={styles.counter}>
          {sorted.length} avarie(s) trouvée(s)
        </div>

        {/* AFFICHAGE */}
        {isMobile ? (
          <div>
            {sorted.length === 0 && (
              <div style={styles.emptyState}>
                Aucune avarie trouvée
              </div>
            )}

            {sorted.map((r) => (
              <MobileCard
                key={r.id}
                r={r}
              />
            ))}
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.head}>
                  {[
                    "date",
                    "chassis",
                    "marque",
                    "modele",
                    "nature",
                    "position",
                  ].map((k) => (
                    <th
                      key={k}
                      onClick={() =>
                        toggleSort(k)
                      }
                      style={styles.th}
                    >
                      {k.charAt(0).toUpperCase() +
                        k.slice(1)}{" "}
                      {sortKey === k
                        ? sortAsc
                          ? "↑"
                          : "↓"
                        : ""}
                    </th>
                  ))}

                  <th
                    style={styles.th}
                    onClick={() =>
                      toggleSort("cotation")
                    }
                  >
                    Cotation{" "}
                    {sortKey === "cotation"
                      ? sortAsc
                        ? "↑"
                        : "↓"
                      : ""}
                  </th>

                  <th style={styles.th}>
                    Photos
                  </th>

                  <th
                    style={{
                      ...styles.th,
                      textAlign: "center",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {sorted.map((r) => (
                  <tr
                    key={r.id}
                    style={styles.row}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "transparent";
                    }}
                  >
                    <td style={styles.td}>
                      {r.date}
                    </td>

                    <td style={styles.td}>
                      {r.chassis}
                    </td>

                    <td style={styles.td}>
                      {r.marque}
                    </td>

                    <td style={styles.td}>
                      {r.modele}
                    </td>

                    <td style={styles.td}>
                      {r.nature}
                    </td>

                    <td
                      style={{
                        ...styles.td,
                        whiteSpace: "normal",
                      }}
                    >
                      <div
                        style={styles.zoneContainer}
                      >
                        {(
                          r.position ||
                          (r.zones || []).join(", ")
                        )
                          .split(",")
                          .map((z) => z.trim())
                          .filter(Boolean)
                          .map((zone, i) => (
                            <span
                              key={i}
                              style={
                                styles.zoneBadge
                              }
                            >
                              {zone}
                            </span>
                          ))}

                        {r.nature === "Manque" &&
                          r.manqueType && (
                            <span
                              style={
                                styles.manqueBadge
                              }
                            >
                              {r.manqueType}
                            </span>
                          )}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <span
                        style={badgeColor(
                          r.cotation
                        )}
                      >
                        {r.cotation || "—"}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {r.photos?.length > 0 ? (
                        <img
                          src={r.photos[0].url}
                          alt="Avarie"
                          style={styles.tablePhoto}
                        />
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td
                      style={{
                        ...styles.td,
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={
                          styles.desktopActionGroup
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setEdit(r)
                          }
                          style={styles.editBtn}
                          title="Modifier cette avarie"
                          aria-label="Modifier cette avarie"
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20h9" />
                            <path
                              d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"
                            />
                          </svg>

                          <span>Modifier</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            remove(r.id)
                          }
                          style={styles.delBtn}
                          title="Supprimer cette avarie"
                          aria-label="Supprimer cette avarie"
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v5" />
                            <path d="M14 11v5" />
                          </svg>
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
      <Footer />
    </div>
  );
}

const styles = {
  page: {
    background:
      "linear-gradient(135deg, #0f172a, #1e293b)",
    minHeight: "100vh",
    fontFamily: "Arial",
    color: "#fff",
  },

  toolbar: {
    display: "flex",
    marginBottom: 12,
    flexWrap: "wrap",
  },

  btn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    transition:
      "background 0.2s, border-color 0.2s",
  },

  homeIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  search: {
    flex: 1,
    minWidth: 150,
    padding: 10,
    borderRadius: 8,
    border:
      "1px solid rgba(255,255,255,0.2)",
    background:
      "rgba(0,0,0,0.3)",
    color: "#fff",
    outline: "none",
  },

  counter: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 8,
  },

  tableWrap: {
    background:
      "rgba(255,255,255,0.06)",
    borderRadius: 14,
    maxHeight:
      "calc(100vh - 160px)",
    overflowY: "auto",
    overflowX: "auto",
    border:
      "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(14px)",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.25)",
  },

  table: {
    minWidth: "1400px",
    borderCollapse: "collapse",
    color: "#fff",
  },

  head: {
    background:
      "rgba(0,0,0,0.55)",
    position: "sticky",
    top: 0,
    zIndex: 2,
    backdropFilter: "blur(10px)",
  },

  row: {
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
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
    color: "#e5e7eb",
    fontSize: 13,
    whiteSpace: "nowrap",
  },

  zoneContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
  },

  zoneBadge: {
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 12,
    color: "#e5e7eb",
    background:
      "rgba(255,255,255,0.07)",
    whiteSpace: "nowrap",
  },

  manqueBadge: {
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 12,
    color: "#fbbf24",
    background:
      "rgba(251,191,36,0.12)",
    border:
      "1px solid rgba(251,191,36,0.18)",
    whiteSpace: "nowrap",
  },

  desktopActionGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  actionGroup: {
    display: "flex",
    alignItems: "center",
    gap: 7,
  },

  editBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    background:
      "rgba(59,130,246,0.10)",
    color: "#93c5fd",
    border:
      "1px solid rgba(59,130,246,0.25)",
    padding: "7px 11px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    transition:
      "background 0.2s, border-color 0.2s, color 0.2s",
  },

  delBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    background:
      "rgba(239,68,68,0.08)",
    color: "#fca5a5",
    border:
      "1px solid rgba(239,68,68,0.20)",
    padding: "7px 10px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    transition:
      "background 0.2s, border-color 0.2s, color 0.2s",
  },

  tablePhoto: {
    width: 35,
    height: 35,
    borderRadius: 6,
    objectFit: "cover",
  },

  mobileCard: {
    background:
      "rgba(255,255,255,0.06)",
    border:
      "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  mobileCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  mobileChassis: {
    fontWeight: 700,
    fontSize: 14,
    color: "#fff",
  },

  mobileDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },

  mobileGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px 12px",
    marginBottom: 10,
  },

  mobileLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },

  mobileValue: {
    fontSize: 12,
    color: "#e5e7eb",
    marginTop: 1,
  },

  positionBlock: {
    marginBottom: 10,
  },

  mobileActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  mobilePhoto: {
    width: 44,
    height: 44,
    borderRadius: 8,
    objectFit: "cover",
  },

  noPhoto: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
  },

  emptyState: {
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
    padding: 40,
  },
};