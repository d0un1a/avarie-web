import { useState, useRef, useCallback } from "react";

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;
const isVIN = (str) => VIN_REGEX.test(str);

function findVIN(raw) {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  // Cherche séquence de 17 chars VIN valides
  const m = upper.match(/[A-HJ-NPR-Z0-9]{17}/g);
  if (!m) return null;
  // Parmi les candidats, retourne celui qui a chiffres ET lettres
  for (const candidate of m) {
    if (/[0-9]/.test(candidate) && /[A-HJ-NPR-Z]/.test(candidate))
      return candidate;
  }
  return null;
}

// Charge ZXing UMD (version qui expose window.ZXing)
function loadZXing() {
  if (window.ZXing) return Promise.resolve(window.ZXing);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    // Version 0.18.6 — stable, expose correctement window.ZXing
    s.src = "https://unpkg.com/@zxing/library@0.18.6/umd/index.min.js";
    s.onload  = () => {
      if (window.ZXing) resolve(window.ZXing);
      else reject(new Error("ZXing non chargé"));
    };
    s.onerror = () => reject(new Error("Impossible de charger le scanner"));
    document.head.appendChild(s);
  });
}

export default function ChassisScanner({ value, onChange }) {
  const [mode,   setMode]   = useState("idle"); // idle | scanning | done
  const [status, setStatus] = useState("");
  const [error,  setError]  = useState("");

  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const timerRef   = useRef(null);
  const canvasRef  = useRef(null);

  const stopCamera = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setMode("idle");
    setStatus("");
  }, []);

  const startScanner = useCallback(async () => {
    setError("");
    setStatus("Ouverture caméra…");
    setMode("scanning");

    try {
      // 1. Ouvrir la caméra avec l'API native (fonctionne partout)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // 2. Charger ZXing
      setStatus("Chargement scanner…");
      const ZXing = await loadZXing();

      const hints = new Map([
        [ZXing.DecodeHintType.POSSIBLE_FORMATS, [
          ZXing.BarcodeFormat.DATA_MATRIX,
          ZXing.BarcodeFormat.QR_CODE,
          ZXing.BarcodeFormat.CODE_128,
          ZXing.BarcodeFormat.CODE_39,
          ZXing.BarcodeFormat.PDF_417,
        ]],
        [ZXing.DecodeHintType.TRY_HARDER, true],
      ]);

      const reader = new ZXing.BrowserMultiFormatReader(hints);

      setStatus("📷 Pointez vers le QR code ou code-barres du châssis…");

      // 3. Scanner frame par frame via canvas
      const canvas = canvasRef.current;
      const ctx    = canvas.getContext("2d");

      timerRef.current = setInterval(async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) return;

        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const luminance = new ZXing.RGBLuminanceSource(
            imageData.data, canvas.width, canvas.height
          );
          const bitmap = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(luminance));
          const result = reader.decode(bitmap);

          if (result) {
            const vin = findVIN(result.getText());
            if (vin) {
              onChange(vin);
              setStatus(`✅ VIN : ${vin}`);
              stopCamera();
              setMode("done");
            }
          }
        } catch (_) {
          // Pas de code détecté sur cette frame → on continue
        }
      }, 300);

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

      {/* Champ + bouton caméra */}
      <div style={{ display:"flex", gap:8, alignItems:"stretch" }}>
        <div style={{ position:"relative", flex:1 }}>
          <input
            value={value}
            onChange={handleInput}
            maxLength={17}
            placeholder="VIN — 17 caractères"
            style={{
              width:"100%", padding:"11px 52px 11px 12px", borderRadius:8,
              border:`1.5px solid ${
                vinOk            ? "#22c55e" :
                value.length > 0 ? "#ef4444" :
                                   "rgba(255,255,255,0.15)"
              }`,
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

        <button
          onClick={mode === "scanning" ? stopCamera : startScanner}
          style={{
            padding:"0 16px", borderRadius:8,
            border:`1.5px solid ${mode === "scanning" ? "rgba(239,68,68,0.5)" : "rgba(59,130,246,0.5)"}`,
            background: mode === "scanning" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
            color: mode === "scanning" ? "#f87171" : "#60a5fa",
            cursor:"pointer", fontSize:20, flexShrink:0, minWidth:52,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}
        >
          {mode === "scanning" ? "✕" : "📷"}
        </button>
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

          {/* Viseur */}
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <div style={{
              width:220, height:220,
              border:"2px solid #3b82f6", borderRadius:8,
              boxShadow:"0 0 0 9999px rgba(0,0,0,0.5)",
              position:"relative",
            }}>
              {[
                { top:-3,    left:-3,  borderTop:"4px solid #60a5fa",    borderLeft:"4px solid #60a5fa",    borderRadius:"4px 0 0 0" },
                { top:-3,    right:-3, borderTop:"4px solid #60a5fa",    borderRight:"4px solid #60a5fa",   borderRadius:"0 4px 0 0" },
                { bottom:-3, left:-3,  borderBottom:"4px solid #60a5fa", borderLeft:"4px solid #60a5fa",    borderRadius:"0 0 0 4px" },
                { bottom:-3, right:-3, borderBottom:"4px solid #60a5fa", borderRight:"4px solid #60a5fa",   borderRadius:"0 0 4px 0" },
              ].map((s, i) => <div key={i} style={{ position:"absolute", width:22, height:22, ...s }} />)}
            </div>
          </div>

          {/* Status */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0,
            padding:"10px 16px", background:"rgba(0,0,0,0.65)", backdropFilter:"blur(4px)",
            textAlign:"center",
          }}>
            <div style={{ color:"rgba(255,255,255,0.9)", fontSize:11 }}>{status}</div>
            <div style={{ color:"rgba(255,255,255,0.45)", fontSize:10, marginTop:3 }}>
              Cadrez le QR code <strong style={{color:"#60a5fa"}}>TEKOG</strong> ou le code-barres
            </div>
          </div>
        </div>
      )}

      {/* Canvas caché pour le scan frame par frame */}
      <canvas ref={canvasRef} style={{ display:"none" }} />

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
          color:"#fca5a5", fontSize:11, lineHeight:1.5,
        }}>⚠️ {error}</div>
      )}
    </div>
  );
}
