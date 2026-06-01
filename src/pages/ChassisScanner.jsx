import { useState, useRef, useEffect, useCallback } from "react";

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;
const isVIN = (str) => VIN_REGEX.test(str);

export default function ChassisScanner({ value, onChange }) {
  const [scanning,  setScanning]  = useState(false);
  const [error,     setError]     = useState("");
  const [camMode,   setCamMode]   = useState(null); // "barcode" | "photo" | null
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const rafRef      = useRef(null);
  const detectorRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current)    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current  = null;
    detectorRef.current= null;
    setScanning(false);
    setCamMode(null);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── MODE 1 : BarcodeDetector natif ──
  const startBarcodeScanner = useCallback(async () => {
    setError("");
    setScanning(true);
    setCamMode("barcode");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      detectorRef.current = new BarcodeDetector({
        formats: ["code_128","code_39","qr_code","data_matrix","pdf417","ean_13"]
      });
      const scan = async () => {
        if (!videoRef.current || !detectorRef.current) return;
        try {
          const barcodes = await detectorRef.current.detect(videoRef.current);
          for (const bc of barcodes) {
            const raw = bc.rawValue.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
            const match = raw.match(/[A-HJ-NPR-Z0-9]{17}/);
            if (match) { onChange(match[0]); stopCamera(); return; }
          }
        } catch (_) {}
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);
    } catch (e) {
      setError("Caméra inaccessible : " + e.message);
      stopCamera();
    }
  }, [onChange, stopCamera]);

  // ── MODE 2 : Photo → OCR manuel (fallback universel) ──
  const startPhotoMode = useCallback(async () => {
    setError("");
    setScanning(true);
    setCamMode("photo");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e) {
      setError("Caméra inaccessible : " + e.message);
      stopCamera();
    }
  }, [stopCamera]);

  const openCamera = useCallback(async () => {
    if ("BarcodeDetector" in window) {
      await startBarcodeScanner();
    } else {
      await startPhotoMode();
    }
  }, [startBarcodeScanner, startPhotoMode]);

  // Capture photo et essaie de lire le VIN via canvas + lecture OCR basique
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    // Tenter BarcodeDetector si dispo
    if ("BarcodeDetector" in window) {
      const det = new BarcodeDetector({ formats: ["code_128","code_39","qr_code","data_matrix","pdf417"] });
      det.detect(canvas).then(barcodes => {
        for (const bc of barcodes) {
          const raw = bc.rawValue.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
          const match = raw.match(/[A-HJ-NPR-Z0-9]{17}/);
          if (match) { onChange(match[0]); stopCamera(); return; }
        }
        setError("Aucun VIN détecté — saisissez manuellement");
      });
    } else {
      setError("Détection automatique non supportée — saisissez le VIN manuellement");
      stopCamera();
    }
  }, [onChange, stopCamera]);

  const handleInput = (e) => {
    const v = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17);
    onChange(v);
  };

  const vinOk = isVIN(value);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>

      {/* Input + bouton caméra */}
      <div style={{ display:"flex", gap:8, alignItems:"stretch" }}>
        <div style={{ position:"relative", flex:1 }}>
          <input
            value={value}
            onChange={handleInput}
            maxLength={17}
            placeholder="VIN — 17 caractères alphanumériques"
            style={{
              width:"100%",
              padding:"11px 44px 11px 12px",
              borderRadius:8,
              border:`1.5px solid ${vinOk ? "#22c55e" : value.length > 0 && !vinOk ? "#ef4444" : "rgba(255,255,255,0.15)"}`,
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

        {/* Bouton caméra — TOUJOURS visible */}
        {!scanning ? (
          <button
            onClick={openCamera}
            title="Scanner le code VIN avec la caméra"
            style={{
              padding:"0 16px",
              borderRadius:8,
              border:"1.5px solid rgba(59,130,246,0.5)",
              background:"rgba(59,130,246,0.15)",
              color:"#60a5fa",
              cursor:"pointer",
              fontSize:20,
              flexShrink:0,
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              gap:6,
              transition:"all 0.2s",
              minWidth:50,
            }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(59,130,246,0.3)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(59,130,246,0.15)"}
          >
            📷
          </button>
        ) : (
          <button
            onClick={stopCamera}
            title="Arrêter le scanner"
            style={{
              padding:"0 16px", borderRadius:8, border:"none",
              background:"rgba(239,68,68,0.8)", color:"#fff",
              cursor:"pointer", fontSize:16, flexShrink:0,
              minWidth:50,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Feedback VIN */}
      {vinOk && (
        <div style={{
          padding:"6px 12px", borderRadius:6,
          background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.4)",
          color:"#22c55e", fontSize:11, fontWeight:600, fontFamily:"monospace",
        }}>
          ✅ VIN valide — {value}
        </div>
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
        }}>
          ⚠️ Format VIN invalide (I, O, Q interdits dans un VIN)
        </div>
      )}

      {/* Viewfinder caméra */}
      {scanning && (
        <div style={{
          position:"relative", width:"100%", borderRadius:12,
          overflow:"hidden", background:"#000",
          border:"2px solid rgba(59,130,246,0.5)",
          aspectRatio:"16/9",
        }}>
          <video
            ref={videoRef}
            muted playsInline
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          />
          <canvas ref={canvasRef} style={{ display:"none" }} />

          {/* Viseur */}
          <div style={{
            position:"absolute", inset:0, display:"flex",
            alignItems:"center", justifyContent:"center", pointerEvents:"none",
          }}>
            <div style={{
              width:"80%", height:64,
              border:"2px solid #3b82f6", borderRadius:6,
              boxShadow:"0 0 0 9999px rgba(0,0,0,0.4)",
            }} />
          </div>

          {/* Boutons selon le mode */}
          <div style={{
            position:"absolute", bottom:12, left:0, right:0,
            display:"flex", justifyContent:"center", gap:12,
          }}>
            {camMode === "photo" && (
              <button
                onClick={capturePhoto}
                style={{
                  padding:"10px 24px", borderRadius:20,
                  border:"2px solid #fff", background:"rgba(255,255,255,0.2)",
                  color:"#fff", cursor:"pointer", fontWeight:700, fontSize:13,
                  backdropFilter:"blur(4px)",
                }}
              >
                📸 Capturer
              </button>
            )}
            {camMode === "barcode" && (
              <div style={{
                padding:"6px 14px", borderRadius:20,
                background:"rgba(0,0,0,0.5)", color:"rgba(255,255,255,0.7)",
                fontSize:11, backdropFilter:"blur(4px)",
              }}>
                🔍 Scan automatique en cours…
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding:"8px 12px", borderRadius:8,
          background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.4)",
          color:"#fca5a5", fontSize:11,
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
