import { useState } from "react";

export default function VehicleSchema({ onChange }) {
  const [selected, setSelected] = useState([]);

  const zones = [
    "Capot",
    "Toit",
    "Coffre",
    "Porte AV G",
    "Porte AV D",
    "Aile AV G",
    "Aile AV D",
  ];

  const toggle = (z) => {
    let updated = selected.includes(z)
      ? selected.filter((x) => x !== z)
      : [...selected, z];

    setSelected(updated);
    onChange(updated);
  };

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {zones.map((z) => (
        <button
          key={z}
          onClick={() => toggle(z)}
          style={{
            padding: 8,
            border: "1px solid #ccc",
            background: selected.includes(z) ? "#222" : "#fff",
            color: selected.includes(z) ? "#fff" : "#000",
            borderRadius: 6,
          }}
        >
          {z}
        </button>
      ))}
    </div>
  );
}