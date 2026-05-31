import { useState } from "react";

const PARTS = [
  { id: "Pare-choc avant", path: "M50 10 H150 V30 H50 Z" },
  { id: "Capot", path: "M50 30 H150 V80 H50 Z" },
  { id: "Pare-brise avant", path: "M60 80 H140 V95 H60 Z" },
  { id: "Toit", path: "M55 95 H145 V130 H55 Z" },
  { id: "Pare-brise arrière", path: "M60 130 H140 V145 H60 Z" },
  { id: "Coffre", path: "M50 145 H150 V190 H50 Z" },
  { id: "Pare-choc arrière", path: "M50 190 H150 V210 H50 Z" },

  { id: "Aile avant gauche", path: "M20 40 H50 V90 H20 Z" },
  { id: "Porte avant gauche", path: "M20 90 H50 V140 H20 Z" },
  { id: "Porte arrière gauche", path: "M20 140 H50 V190 H20 Z" },
  { id: "Aile arrière gauche", path: "M20 190 H50 V220 H20 Z" },

  { id: "Aile avant droite", path: "M150 40 H180 V90 H150 Z" },
  { id: "Porte avant droite", path: "M150 90 H180 V140 H150 Z" },
  { id: "Porte arrière droite", path: "M150 140 H180 V190 H150 Z" },
  { id: "Aile arrière droite", path: "M150 190 H180 V220 H150 Z" },
];

export default function VehicleSchema({ onChange, nature, manqueType, onManqueChange }) {
  const [selected, setSelected] = useState([]);

  const toggle = (id) => {
    const updated = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    setSelected(updated);
    onChange(updated);
  };

  const inputStyle = {
    padding: 10,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.15)",
    outline: "none",
    background: "rgba(0,0,0,0.25)",
    color: "#fff",
    width: "100%",
    boxSizing: "border-box",
    height: "100%",
  };

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

      {/* SVG CAR */}
      <svg
        width="220"
        height="240"
        viewBox="0 0 200 240"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)",
          flexShrink: 0,
        }}
      >
        {PARTS.map((p) => (
          <path
            key={p.id}
            d={p.path}
            onClick={() => toggle(p.id)}
            style={{
              fill: selected.includes(p.id)
                ? "#22c55e"
                : "rgba(255,255,255,0.08)",
              stroke: "#fff",
              strokeWidth: 1,
              cursor: "pointer",
              transition: "0.2s",
            }}
          />
        ))}
      </svg>

      {/* GRILLE DROITE */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 8,
          maxHeight: 240,
          overflowY: "auto",
          flex: 1,
        }}
      >
        {PARTS.map((p, index) => {
          const isLast = index === PARTS.length - 1;

          return (
            <>
              {/* Partie cliquable */}
              <div
                key={p.id}
                onClick={() => toggle(p.id)}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  textAlign: "center",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: selected.includes(p.id)
                    ? "linear-gradient(135deg,#22c55e,#16a34a)"
                    : "rgba(255,255,255,0.06)",
                  color: "#fff",
                  userSelect: "none",
                }}
              >
                {p.id}
              </div>

              {/* Champ manque dans la cellule vide à droite du dernier élément */}
              {isLast && nature === "Manque" && (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    style={inputStyle}
                    value={manqueType}
                    onChange={(e) => onManqueChange(e.target.value)}
                    placeholder="Ex : tapis, clé, outillage..."
                  />
                </div>
              )}
            </>
          );
        })}
      </div>

    </div>
  );
}