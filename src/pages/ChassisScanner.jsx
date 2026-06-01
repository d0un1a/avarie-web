import { useState, useRef, useCallback } from "react";

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;
const isVIN = (str) => VIN_REGEX.test(str);

// Charge ZXing via CDN (pas d'import statique → pas d'erreur Vite)
function loadZXing() {
  if (window.ZXing) return Promise.resolve(window.ZXing);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@zxing/library@0.19.1/umd/index.min.js";
    s.onload  = () => resolve(window.ZXing);
    s.onerror = () => reject(new Error("Impossible de charger le scanner"));
    document.head.appendChild(s);
  });
}

// Cherche un VIN de 17 chars dans un texte
function findVIN(raw) {
  const clean = raw.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
  // Ligne de 17 chars avec chiffres et lettres
  const chunks = raw.toUpperCase().split(/\s+/);
  for (const chunk of chunks) {
    const c = chunk.replace(/[^A-HJ-NPR-Z0-9]/g, "");
    if (c.length === 17 && /[0-9]/.test(c) && /[A-Z]/.test(c)) return c;
  }
  const m = clean.match(/[A-HJ-NPR-Z0-9]{17}/);
  return m ? m[0] : null;
}

export default function ChassisScanner({ value, onChange }) {
  const [mode,    setMode]    = useState("idle");
  const [status,  setStatus]  = useState("");
  const [error,   setError]   = useState("");

  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const readerRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (readerRef.current) {
      try { readerRef.current.reset(); } catch (_) {}
      readerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setMode("idle");
    setStatus("");
  }, []);

  const startScanner = useCallback(async () => {
    setError("");
    setStatus("Chargement…");
    setMode("scanning");

    try {
      const ZXing = await loadZXing();

      const hints = new Map();
      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
        ZXing.BarcodeFormat.DATA_MATRIX,  // QR carré Dacia (TEKOG)
        ZXing.BarcodeFormat.QR_CODE,
        ZXing.BarcodeFormat.CODE_128,     // Code-barres linéaire VIN
        ZXing.BarcodeFormat.CODE_39,
        ZXing.BarcodeFormat.PDF_417,
      ]);
      hints.set(ZXing.DecodeHintType.TRY_HARDER, true);

      const reader = new ZXing.BrowserMultiFormatReader(hints, 300);
      readerRef.current = reader;

      // Obtenir la caméra arrière
      const devices = await ZXing.BrowserMultiFormatReader.listVideoInputDevices();
      if (!devices.length) throw new Error("Aucune caméra détectée");
      const cam = devices.find(d => /back|rear|environment/i.test(d.label))
        || devices[devices.length - 1];

      setStatus("📷 Pointez vers le code-barres ou le QR code de l'étiquette");

      await reader.decodeFromVideoDevice(
        cam.deviceId,
        videoRef.current,
        (result, err) => {
          if (!result) return;
          const raw = result.getText();
          console.log("Scan brut:", raw);

          // Cherche un VIN dans le résultat
          const vin = findVIN(raw);
          if (vin) {
            onChange(vin);
            setStatus(`✅ VIN : ${vin}`);
            stopCamera();
            setMode("done");
          }
        }
      );
    } catch (e) {
      setError("Erreur : " + (e.message || String(e)));
      stopCamera();
    }
  }, [onChange, stopCamera]);

  const handleInput = (e) => {
    const v = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17);
    onChange(v);
  };

  const vinOk = isVIN(value);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

      {/* Champ + bouton */}
      <div style={{ display:"flex", gap:8, alignItems:"stretch" }}>
        <div style={{ position:"relative", flex:1 }}>
          <input
            value={value}
            onChange={handleInput}
            maxLength={17}
            placeholder="VIN — 17 caractères"
            style={{
              width:"100%", padding:"11px 52px 11px 12px", borderRadius:8,
              border:`1.5px solid ${vinOk ? "#22c55e" : value.length > 0 ? "#ef4444" : "rgba(255,255,255,0.15)"}`,
              outline:"none", background:"rgba(0,0,0,0.3)", color:"#fff",
              boxSizing:"border-box", fontSize:13, fontFamily:"monospace",
              letterSpacing:"0.08em", transition:"border 0.2s",
            }}
          />
          <span style={{
            position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
            fontSize:10, fontWeight:700,
            color: vinOk ? "#22c55e" : value.length === 17 ? "#ef4444" : "rgba(255,255,255,0.35)",
          }}>{value.length}/17</span>
        </div>

        {mode !== "scanning" ? (
          <button onClick={startScanner} title="Scanner le code" style={{
            padding:"0 16px", borderRadius:8,
            border:"1.5px solid rgba(59,130,246,0.5)",
            background:"rgba(59,130,246,0.15)", color:"#60a5fa",
            cursor:"pointer", fontSize:20, flexShrink:0, minWidth:52,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>📷</button>
        ) : (
          <button onClick={stopCamera} style={{
            padding:"0 16px", borderRadius:8,
            border:"1.5px solid rgba(239,68,68,0.5)",
            background:"rgba(239,68,68,0.15)", color:"#f87171",
            cursor:"pointer", fontSize:16, flexShrink:0, minWidth:52,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>✕</button>
        )}
      </div>

      {/* Feedback VIN */}
      {vinOk && (
        <div style={{
          padding:"6px 12px", borderRadius:6,
          background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.4)",
          color:"#22c55e", fontSize:11, fontWeight:600, fontFamily:"monospace",
        }}>✅ VIN valide — {value}</div>
      )}
      {value.length > 0 && value.length < 17 && (
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>
          Encore {17 - value.length} caractère(s) requis
        </div>
      )}
      {value.length === 17 && !vinOk && (
        <div style={{
          padding:"6px 12px", borderRadius:6,
          background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.4)",
          color:"#ef4444", fontSize:11,
        }}>⚠️ Format VIN invalide</div>
      )}

      {/* Viewfinder */}
      {mode === "scanning" && (
        <div style={{
          position:"relative", borderRadius:12, overflow:"hidden",
          background:"#000", border:"2px solid rgba(59,130,246,0.5)",
          aspectRatio:"4/3",
        }}>
          <video ref={videoRef} muted playsInline
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />

          {/* Viseur carré pour Data Matrix */}
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <div style={{
              width:200, height:200,
              border:"2px solid #3b82f6", borderRadius:8,
              boxShadow:"0 0 0 9999px rgba(0,0,0,0.5)",
              position:"relative",
            }}>
              {[
                { top:-3, left:-3,   borderTop:"4px solid #60a5fa", borderLeft:"4px solid #60a5fa", borderRadius:"4px 0 0 0" },
                { top:-3, right:-3,  borderTop:"4px solid #60a5fa", borderRight:"4px solid #60a5fa", borderRadius:"0 4px 0 0" },
                { bottom:-3, left:-3,  borderBottom:"4px solid #60a5fa", borderLeft:"4px solid #60a5fa", borderRadius:"0 0 0 4px" },
                { bottom:-3, right:-3, borderBottom:"4px solid #60a5fa", borderRight:"4px solid #60a5fa", borderRadius:"0 0 4px 0" },
              ].map((s, i) => <div key={i} style={{ position:"absolute", width:20, height:20, ...s }} />)}
            </div>
          </div>

          {/* Instructions */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0,
            padding:"10px 16px", background:"rgba(0,0,0,0.7)",
            backdropFilter:"blur(4px)",
          }}>
            <div style={{ color:"rgba(255,255,255,0.9)", fontSize:11, textAlign:"center", lineHeight:1.5 }}>
              {status}
            </div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:10, textAlign:"center", marginTop:4 }}>
              Cadrez le QR code carré <strong style={{color:"#60a5fa"}}>TEKOG</strong> ou le code-barres linéaire
            </div>
          </div>
        </div>
      )}

      {/* Succès */}
      {mode === "done" && (
        <div style={{
          padding:"10px 14px", borderRadius:8,
          background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)",
          display:"flex", justifyContent:"space-between", alignItems:"center",
        }}>
          <span style={{ color:"#22c55e", fontSize:11, fontWeight:600 }}>{status}</span>
          <button onClick={startScanner} style={{
            padding:"5px 12px", borderRadius:6,
            border:"1px solid rgba(59,130,246,0.4)", background:"rgba(59,130,246,0.1)",
            color:"#60a5fa", cursor:"pointer", fontSize:11,
          }}>Rescanner</button>
        </div>
      )}

      {error && (
        <div style={{
          padding:"8px 12px", borderRadius:8,
          background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.4)",
          color:"#fca5a5", fontSize:11,
        }}>⚠️ {error}</div>
      )}
    </div>
  );
}
