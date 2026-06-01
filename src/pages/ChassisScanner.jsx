import { useState, useRef, useCallback } from "react";

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;
const isVIN = (str) => VIN_REGEX.test(str);

// Charge Tesseract.js depuis CDN
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

// Extrait le VIN depuis un texte OCR brut
function extractVIN(text) {
  // Nettoie le texte : retire espaces, tirets, sauts de ligne
  const clean = text.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
  // Cherche une séquence de 17 caractères VIN valides
  const match = clean.match(/[A-HJ-NPR-Z0-9]{17}/);
  return match ? match[0] : null;
}

export default function ChassisScanner({ value, onChange }) {
  const [mode,     setMode]     = useState("idle"); // idle | camera | ocr | done
  const [status,   setStatus]   = useState("");
  const [error,    setError]    = useState("");
  const [preview,  setPreview]  = useState(null);  // dataURL photo capturée
  const [progress, setProgress] = useState(0);

  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);

  // ── Stopper la caméra ──
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ── Ouvrir la caméra ──
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
      setStatus("📷 Cadrez l'étiquette du châssis puis appuyez sur Capturer");
    } catch (e) {
      setError("Caméra inaccessible : " + e.message);
      setMode("idle");
    }
  }, []);

  // ── Capturer la photo + lancer OCR ──
  const capture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    // Amélioration contraste pour OCR
    ctx.filter = "contrast(1.4) grayscale(1)";
    ctx.drawImage(video, 0, 0);

    const dataURL = canvas.toDataURL("image/png");
    setPreview(dataURL);
    stopStream();
    setMode("ocr");
    setStatus("🔍 Analyse OCR en cours…");
    setProgress(5);

    try {
      const Tesseract = await loadTesseract();
      setProgress(20);

      const result = await Tesseract.recognize(dataURL, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(20 + m.progress * 75));
          }
        },
        // Configuration optimisée pour les VIN (caractères alphanumériques uniquement)
        tessedit_char_whitelist: "ABCDEFGHJKLMNPRSTUVWXYZ0123456789",
        tessedit_pageseg_mode: "6", // Bloc de texte uniforme
      });

      setProgress(100);
      const vin = extractVIN(result.data.text);

      if (vin) {
        onChange(vin);
        setStatus(`✅ VIN détecté : ${vin}`);
        setMode("done");
      } else {
        setError("VIN non trouvé dans l'image — vérifiez le cadrage et réessayez, ou saisissez manuellement.");
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

      {/* ── Champ saisie + bouton caméra ── */}
      <div style={{ display:"flex", gap:8, alignItems:"stretch" }}>
        <div style={{ position:"relative", flex:1 }}>
          <input
            value={value}
            onChange={handleInput}
            maxLength={17}
            placeholder="VIN — 17 caractères"
            style={{
              width:"100%",
              padding:"11px 52px 11px 12px",
              borderRadius:8,
              border:`1.5px solid ${
                vinOk            ? "#22c55e" :
                value.length > 0 ? "#ef4444" :
                                   "rgba(255,255,255,0.15)"
              }`,
              outline:"none",
              background:"rgba(0,0,0,0.3)",
              color:"#fff",
              boxSizing:"border-box",
              fontSize:13,
              fontFamily:"monospace",
              letterSpacing:"0.08em",
              transition:"border 0.2s",
            }}
          />
          <span style={{
            position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
            fontSize:10, fontWeight:700,
            color: vinOk ? "#22c55e" : value.length === 17 ? "#ef4444" : "rgba(255,255,255,0.35)",
          }}>
            {value.length}/17
          </span>
        </div>

        {/* Bouton caméra — toujours visible */}
        {mode === "idle" || mode === "done" ? (
          <button
            onClick={openCamera}
            title="Scanner l'étiquette châssis"
            style={{
              padding:"0 16px", borderRadius:8,
              border:"1.5px solid rgba(59,130,246,0.5)",
              background:"rgba(59,130,246,0.15)",
              color:"#60a5fa", cursor:"pointer",
              fontSize:20, flexShrink:0, minWidth:52,
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.2s",
            }}
          >
            📷
          </button>
        ) : (
          <button
            onClick={reset}
            title="Annuler"
            style={{
              padding:"0 16px", borderRadius:8,
              border:"1.5px solid rgba(239,68,68,0.5)",
              background:"rgba(239,68,68,0.15)",
              color:"#f87171", cursor:"pointer",
              fontSize:16, flexShrink:0, minWidth:52,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Feedback VIN ── */}
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
        }}>⚠️ Format VIN invalide (I, O, Q interdits)</div>
      )}

      {/* ── Viewfinder caméra ── */}
      {mode === "camera" && (
        <div style={{
          position:"relative", width:"100%", borderRadius:12,
          overflow:"hidden", background:"#000",
          border:"2px solid rgba(59,130,246,0.5)",
          aspectRatio:"4/3",
        }}>
          <video ref={videoRef} muted playsInline
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />

          {/* Viseur rectangulaire pour cadrer l'étiquette */}
          <div style={{
            position:"absolute", inset:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            pointerEvents:"none",
          }}>
            <div style={{
              width:"90%", height:"35%",
              border:"2px solid #3b82f6", borderRadius:8,
              boxShadow:"0 0 0 9999px rgba(0,0,0,0.45)",
              position:"relative",
            }}>
              {/* Coins */}
              {[
                { top:-2,    left:-2,  borderTop:"3px solid #60a5fa",    borderLeft:"3px solid #60a5fa" },
                { top:-2,    right:-2, borderTop:"3px solid #60a5fa",    borderRight:"3px solid #60a5fa" },
                { bottom:-2, left:-2,  borderBottom:"3px solid #60a5fa", borderLeft:"3px solid #60a5fa" },
                { bottom:-2, right:-2, borderBottom:"3px solid #60a5fa", borderRight:"3px solid #60a5fa" },
              ].map((s, i) => (
                <div key={i} style={{ position:"absolute", width:16, height:16, ...s }} />
              ))}
              <div style={{
                position:"absolute", top:"50%", left:"50%",
                transform:"translate(-50%,-50%)",
                color:"rgba(255,255,255,0.6)", fontSize:10, whiteSpace:"nowrap",
              }}>
                Cadrez le numéro VIN ici
              </div>
            </div>
          </div>

          {/* Bouton Capturer */}
          <div style={{
            position:"absolute", bottom:16, left:0, right:0,
            display:"flex", justifyContent:"center",
          }}>
            <button
              onClick={capture}
              style={{
                padding:"12px 32px", borderRadius:30,
                border:"3px solid #fff",
                background:"rgba(255,255,255,0.2)",
                color:"#fff", cursor:"pointer",
                fontWeight:700, fontSize:14,
                backdropFilter:"blur(6px)",
                boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
              }}
            >
              📸 Capturer
            </button>
          </div>

          {status && (
            <div style={{
              position:"absolute", top:10, left:0, right:0,
              textAlign:"center", color:"rgba(255,255,255,0.85)", fontSize:11,
              padding:"4px 12px",
            }}>{status}</div>
          )}
        </div>
      )}

      {/* ── OCR en cours : affiche la photo + barre de progression ── */}
      {mode === "ocr" && preview && (
        <div style={{ borderRadius:12, overflow:"hidden", border:"2px solid rgba(251,191,36,0.5)" }}>
          <img src={preview} alt="Analyse en cours"
            style={{ width:"100%", display:"block", opacity:0.7 }} />
          <div style={{
            padding:"10px 14px",
            background:"rgba(0,0,0,0.7)",
          }}>
            <div style={{
              display:"flex", justifyContent:"space-between",
              fontSize:11, color:"rgba(255,255,255,0.7)", marginBottom:6,
            }}>
              <span>🔍 Analyse OCR…</span>
              <span>{progress}%</span>
            </div>
            <div style={{
              height:6, borderRadius:3,
              background:"rgba(255,255,255,0.1)", overflow:"hidden",
            }}>
              <div style={{
                height:"100%", borderRadius:3,
                background:"linear-gradient(90deg,#3b82f6,#60a5fa)",
                width:`${progress}%`, transition:"width 0.3s",
              }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Résultat OK : miniature + bouton rescanner ── */}
      {mode === "done" && preview && (
        <div style={{
          display:"flex", gap:10, alignItems:"center",
          padding:"8px 12px", borderRadius:8,
          background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.3)",
        }}>
          <img src={preview} alt="Capture"
            style={{ width:60, height:40, objectFit:"cover", borderRadius:6, flexShrink:0 }} />
          <div style={{ flex:1, fontSize:11, color:"rgba(255,255,255,0.7)" }}>
            VIN extrait depuis la photo
          </div>
          <button onClick={openCamera} style={{
            padding:"6px 12px", borderRadius:6,
            border:"1px solid rgba(59,130,246,0.4)",
            background:"rgba(59,130,246,0.1)",
            color:"#60a5fa", cursor:"pointer", fontSize:11,
          }}>
            Rescanner
          </button>
        </div>
      )}

      {/* Canvas caché pour capture */}
      <canvas ref={canvasRef} style={{ display:"none" }} />

      {/* Erreur */}
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
