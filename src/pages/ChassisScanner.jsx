import { useState } from "react";

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;
const isVIN = (str) => VIN_REGEX.test(str);

export default function ChassisScanner({ value, onChange }) {

  const handleInput = (e) => {
    onChange(e.target.value.toUpperCase());
  };

  const vinOk = isVIN(value);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>

      {/* Champ saisie */}
      <div style={{ position:"relative" }}>
        <input
          value={value}
          onChange={handleInput}
                    placeholder="Ex: VF1RJF00X77134232"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          style={{
            width:"100%", padding:"12px 55px 12px 14px", borderRadius:8,
            border:`1.5px solid ${
              vinOk            ? "#22c55e" :
              value.length > 0 ? "#ef4444" :
                                 "rgba(255,255,255,0.15)"
            }`,
            outline:"none", background:"rgba(0,0,0,0.3)", color:"#fff",
            boxSizing:"border-box", fontSize:15, fontFamily:"monospace",
            letterSpacing:"0.12em", transition:"border 0.2s",
          }}
        />
        <span style={{
          position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
          fontSize:11, fontWeight:700,
          color: vinOk ? "#22c55e" : value.length === 17 ? "#ef4444" : "rgba(255,255,255,0.35)",
        }}>{value.length}/17</span>
      </div>

      {/* Feedback */}
      {vinOk && (
        <div style={{
          padding:"7px 12px", borderRadius:6,
          background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.4)",
          color:"#22c55e", fontSize:12, fontWeight:600, fontFamily:"monospace",
        }}>✅ VIN valide — {value}</div>
      )}
      {value.length > 0 && value.length < 17 && (
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>
          Encore {17 - value.length} caractère(s) requis
        </div>
      )}
      {value.length === 17 && !vinOk && (
        <div style={{
          padding:"7px 12px", borderRadius:6,
          background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.4)",
          color:"#ef4444", fontSize:11,
        }}>⚠️ Format VIN invalide (I, O, Q interdits)</div>
      )}
    </div>
  );
}
