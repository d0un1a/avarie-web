import { useState, useRef, useCallback } from "react";

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;
const isVIN = (str) => VIN_REGEX.test(str);

function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    s.onload  = () => resolve(window.Tesseract);
    s.onerror = () => reject(new Error("Impossible de charger l'OCR"));
    document.head.appendChild(s);
  });
}

function extractVIN(text) {
  // Cherche ligne par ligne la ligne contenant EXACTEMENT 17 caractères alphanumériques
  const lines = text.toUpperCase().split(/[\n\r]+/);
  for (const line of lines) {
    const clean = line.replace(/[^A-HJ-NPR-Z0-9]/g, "");
    // Exactement 17 chars ET contient au moins un chiffre (les VIN ont toujours des chiffres)
    if (clean.length === 17 && /[0-9]/.test(clean) && /[A-HJ-NPR-Z]/.test(clean)) return clean;
  }
  // Fallback : cherche un mot de 17 chars
  const all = text.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, " ");
  const words = all.split(/\s+/);
  for (const w of words) {
    if (w.length === 17) return w;
  }
  return null;
}

// Préprocess canvas pour améliorer l'OCR :
// - Convertit en niveaux de gris
// - Binarisation (seuil)
// - Augmente le contraste
function preprocessCanvas(srcCanvas) {
  const dst = document.createElement("canvas");
  // Agrandit x2 pour meilleure résolution OCR
  dst.width  = srcCanvas.width  * 2;
  dst.height = srcCanvas.height * 2;
  const ctx = dst.getContext("2d");

  // Agrandissement
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(srcCanvas, 0, 0, dst.width, dst.height);

  // Binarisation pixel par pixel
  const imgData = ctx.getImageData(0, 0, dst.width, dst.height);
  const data    = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Luminosité
    const lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    // Seuil : texte noir sur fond blanc → on garde les pixels sombres
    const bin = lum < 140 ? 0 : 255;
    data[i] = data[i+1] = data[i+2] = bin;
    data[i+3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return dst;
}

export default function ChassisScanner({ value, onChange }) {
  const [mode,     setMode]     = useState("idle");
  const [status,   setStatus]   = useState("");
  const [error,    setError]    = useState("");
  const [preview,  setPreview]  = useState(null);
  const [progress, setProgress] = useState(0);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const openCamera = useCallback(async () => {
    setError("");
    setPreview(null);
    setProgress(0);
    setStatus("Ouverture de la caméra…");
    setMode("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("");
    } catch (e) {
      setError("Caméra inaccessible : " + e.message);
      setMode("idle");
    }
  }, []);

  const capture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;

    // Capture la zone CENTRALE uniquement (évite les bandes de codes-barres)
    // On prend uniquement la bande centrale (30% de hauteur) où le texte VIN se trouve
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // Zone de capture : centre horizontal, bande du tiers milieu
    const cropY = Math.round(vh * 0.35);
    const cropH = Math.round(vh * 0.30);
    canvas.width  = vw;
    canvas.height = cropH;

    const ctx = canvas.getContext("2d");
    // Découpe uniquement la zone centrale de l'image
    ctx.drawImage(video, 0, cropY, vw, cropH, 0, 0, vw, cropH);

    // Préprocessing
    const processed = preprocessCanvas(canvas);
    const dataURL   = processed.toDataURL("image/png");

    setPreview(canvas.toDataURL("image/jpeg", 0.8)); // preview = image originale
    stopStream();
    setMode("ocr");
    setStatus("🔍 Lecture du VIN en cours…");
    setProgress(5);

    try {
      const Tesseract = await loadTesseract();
      setProgress(20);

      const result = await Tesseract.recognize(dataURL, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text")
            setProgress(Math.round(20 + m.progress * 75));
        },
        tessedit_char_whitelist: "ABCDEFGHJKLMNPRSTUVWXYZ0123456789",
        tessedit_pageseg_mode:   "7", // Ligne unique de texte
        preserve_interword_spaces: "0",
      });

      setProgress(100);
      console.log("OCR brut :", result.data.text);

      const vin = extractVIN(result.data.text);
      if (vin) {
        onChange(vin);
        setStatus(`✅ VIN détecté : ${vin}`);
        setMode("done");
      } else {
        setError("VIN non trouvé — cadrez uniquement le numéro (ex: VF1RJF00576409351), sans les barres au-dessus.");
        setMode("idle");
        setPreview(null);
      }
    } catch (e) {
      setError("Erreur OCR : " + (e.message || String(e)));
      setMode("idle");
      setPreview(null);
    }
  }, [onChange, stopStream]);

  const reset = useCallback(() => {
    stopStream();
    setMode("idle");
    setStatus("");
    setError("");
    setPreview(null);
    setProgress(0);
  }, [stopStream]);

  const handleInput = (e) => {
    const v = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17);
    onChange(v);
  };

  const vinOk = isVIN(value);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

      {/* Input + bouton */}
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

        {mode === "idle" || mode === "done" ? (
          <button onClick={openCamera} title="Scanner le VIN" style={{
            padding:"0 16px", borderRadius:8,
            border:"1.5px solid rgba(59,130,246,0.5)",
            background:"rgba(59,130,246,0.15)", color:"#60a5fa",
            cursor:"pointer", fontSize:20, flexShrink:0, minWidth:52,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>📷</button>
        ) : (
          <button onClick={reset} style={{
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

      {/* Viewfinder caméra */}
      {mode === "camera" && (
        <div style={{
          position:"relative", width:"100%", borderRadius:12,
          overflow:"hidden", background:"#000",
          border:"2px solid rgba(59,130,246,0.5)", aspectRatio:"4/3",
        }}>
          <video ref={videoRef} muted playsInline
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />

          {/* Masque : zone sombre au-dessus et en-dessous, fenêtre claire au centre */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
            {/* Haut masqué */}
            <div style={{ position:"absolute", top:0, left:0, right:0, height:"35%", background:"rgba(0,0,0,0.6)" }} />
            {/* Bas masqué */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"35%", background:"rgba(0,0,0,0.6)" }} />
            {/* Fenêtre centrale avec bordure */}
            <div style={{
              position:"absolute", top:"35%", left:"5%", right:"5%", height:"30%",
              border:"2px solid #3b82f6", borderRadius:8,
            }}>
              {/* Coins */}
              {[
                { top:-2, left:-2,   borderTop:"3px solid #60a5fa", borderLeft:"3px solid #60a5fa" },
                { top:-2, right:-2,  borderTop:"3px solid #60a5fa", borderRight:"3px solid #60a5fa" },
                { bottom:-2, left:-2,  borderBottom:"3px solid #60a5fa", borderLeft:"3px solid #60a5fa" },
                { bottom:-2, right:-2, borderBottom:"3px solid #60a5fa", borderRight:"3px solid #60a5fa" },
              ].map((s, i) => <div key={i} style={{ position:"absolute", width:16, height:16, ...s }} />)}

              <div style={{
                position:"absolute", bottom:-22, left:0, right:0,
                textAlign:"center", color:"#60a5fa", fontSize:10, fontWeight:600,
              }}>
                ↑ Cadrez le numéro VIN ici (ex: VF1RJF00576409351)
              </div>
            </div>
          </div>

          {/* Bouton capturer */}
          <div style={{
            position:"absolute", bottom:16, left:0, right:0,
            display:"flex", justifyContent:"center",
          }}>
            <button onClick={capture} style={{
              padding:"12px 36px", borderRadius:30,
              border:"3px solid #fff", background:"rgba(255,255,255,0.2)",
              color:"#fff", cursor:"pointer", fontWeight:700, fontSize:14,
              backdropFilter:"blur(6px)",
            }}>📸 Capturer</button>
          </div>
        </div>
      )}

      {/* OCR en cours */}
      {mode === "ocr" && (
        <div style={{ borderRadius:12, overflow:"hidden", border:"2px solid rgba(251,191,36,0.4)" }}>
          {preview && <img src={preview} alt="Analyse" style={{ width:"100%", display:"block", opacity:0.6 }} />}
          <div style={{ padding:"10px 14px", background:"rgba(0,0,0,0.8)" }}>
            <div style={{
              display:"flex", justifyContent:"space-between",
              fontSize:11, color:"rgba(255,255,255,0.7)", marginBottom:6,
            }}>
              <span>🔍 Lecture du VIN…</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height:6, borderRadius:3, background:"rgba(255,255,255,0.1)", overflow:"hidden" }}>
              <div style={{
                height:"100%", borderRadius:3,
                background:"linear-gradient(90deg,#3b82f6,#60a5fa)",
                width:`${progress}%`, transition:"width 0.3s",
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Résultat OK */}
      {mode === "done" && preview && (
        <div style={{
          display:"flex", gap:10, alignItems:"center", padding:"8px 12px",
          borderRadius:8, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.3)",
        }}>
          <img src={preview} alt="Capture" style={{ width:60, height:36, objectFit:"cover", borderRadius:4, flexShrink:0 }} />
          <div style={{ flex:1, fontSize:11, color:"rgba(255,255,255,0.6)" }}>VIN extrait depuis la photo</div>
          <button onClick={openCamera} style={{
            padding:"6px 12px", borderRadius:6,
            border:"1px solid rgba(59,130,246,0.4)", background:"rgba(59,130,246,0.1)",
            color:"#60a5fa", cursor:"pointer", fontSize:11,
          }}>Rescanner</button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display:"none" }} />

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
