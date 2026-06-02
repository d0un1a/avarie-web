import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

THREE.ColorManagement.enabled = true;

// Hook responsive
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

const MESH_TO_PART = {
  "Object_3":  "Pare-choc avant",
  "Object_1":  "Capot",
  "Object_2":  "Toit",
  "Object_18": "Pare-brise arriere",
  "Object_17": "Coffre",
  "Object_4":  "Pare-choc arriere",
  "Object_5":  "Porte avant gauche",
  "Object_8":  "Porte avant droite",
  "Object_11": "Porte arriere gauche",
  "Object_14": "Porte arriere droite",
  "Object_19": "Roue avant gauche",
  "Object_20": "Roue avant droite",
  "Object_21": "Roue arriere gauche",
  "Object_22": "Roue arriere droite",
};

const HITBOXES = [
  { part: "Pare-choc avant",    pos: [ 2.58,  0.77,  0.00], size: [0.06, 0.65, 1.96] },
  { part: "Capot",              pos: [ 1.185, 1.25,  0.00], size: [1.97, 0.10, 1.85] },
  { part: "Pare-brise avant",   pos: [ 0.575, 1.56,  0.00], size: [0.75, 0.65, 1.55] },
  { part: "Toit",               pos: [-1.010, 1.91,  0.00], size: [2.42, 0.06, 1.50] },
  // Lunette arriere : vitre inclinee en HAUT (entre toit et coffre)
  { part: "Pare-brise arriere", pos: [-2.08, 1.55,  0.00], size: [0.50, 0.45, 1.20] },
  // Coffre : panneau vertical AR sous la lunette
  { part: "Coffre",             pos: [-2.32, 1.10, 0.00], size: [0.55, 0.55, 1.50] },
  { part: "Pare-choc arriere",  pos: [-2.590, 0.48,  0.00], size: [0.06, 0.75, 2.00] },
  { part: "Aile avant gauche",  pos: [ 1.707, 0.82, -1.10], size: [0.93, 0.90, 0.06] },
  { part: "Aile avant droite",  pos: [ 1.707, 0.82,  1.10], size: [0.93, 0.90, 0.06] },
  { part: "Porte avant gauche", pos: [ 0.531, 0.90, -1.10], size: [1.43, 1.10, 0.06] },
  { part: "Porte avant droite", pos: [ 0.531, 0.90,  1.10], size: [1.43, 1.10, 0.06] },
  { part: "Porte arriere gauche",pos: [-0.706, 0.90, -1.10], size: [1.05, 1.10, 0.06] },
  { part: "Porte arriere droite",pos: [-0.706, 0.90,  1.10], size: [1.05, 1.10, 0.06] },
  { part: "Aile arriere gauche", pos: [-1.730, 0.82, -1.10], size: [0.50, 0.90, 0.06] },
  { part: "Aile arriere droite", pos: [-1.730, 0.82,  1.10], size: [0.50, 0.90, 0.06] },
];

const WHEELS = [
  { part: "Roue avant gauche",   pos: [ 1.726, 0.416, -1.228], radius: 0.38 },
  { part: "Roue avant droite",   pos: [ 1.725, 0.416,  1.228], radius: 0.38 },
  { part: "Roue arriere gauche", pos: [-1.646, 0.416, -1.228], radius: 0.38 },
  { part: "Roue arriere droite", pos: [-1.646, 0.417,  1.228], radius: 0.38 },
];

const GROUPS = [
  {
    label: "🔵 Avant",
    parts: ["Pare-choc avant","Capot","Pare-brise avant","Aile avant gauche","Aile avant droite"],
  },
  {
    label: "🟢 Portes",
    parts: ["Porte avant gauche","Porte avant droite","Porte arriere gauche","Porte arriere droite"],
  },
  {
    label: "🔴 Roues",
    parts: ["Roue avant gauche","Roue avant droite","Roue arriere gauche","Roue arriere droite"],
  },
  {
    label: "🟠 Toit, Ailes & Arriere",
    parts: ["Toit","Aile arriere gauche","Aile arriere droite","Pare-brise arriere","Coffre","Pare-choc arriere"],
  },
];

function autoFitScene(scene) {
  const box = new THREE.Box3().setFromObject(scene);
  const center = new THREE.Vector3();
  box.getCenter(center);
  scene.position.x -= center.x;
  scene.position.z -= center.z;
  scene.position.y -= box.min.y;
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    const s = 5.5 / maxDim;
    scene.scale.set(s, s, s);
    const box2 = new THREE.Box3().setFromObject(scene);
    scene.position.y -= box2.min.y;
  }
}

function CameraController({ focusTarget, controlsRef }) {
  const { camera } = useThree();
  useEffect(() => {
    if (!focusTarget || !controlsRef.current) return;
    const box = new THREE.Box3().setFromObject(focusTarget);
    if (box.isEmpty()) return;
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    const radius = Math.max(size.x, size.y, size.z) * 3.5 + 1.2;
    const dir    = camera.position.clone().sub(controlsRef.current.target).normalize();
    const newPos = center.clone().add(dir.multiplyScalar(radius));
    newPos.y     = Math.max(newPos.y, center.y + 0.2);
    const startPos    = camera.position.clone();
    const startTarget = controlsRef.current.target.clone();
    const startTime   = performance.now();
    const animate = (now) => {
      const t    = Math.min((now - startTime) / 550, 1);
      const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
      camera.position.lerpVectors(startPos, newPos, ease);
      controlsRef.current.target.lerpVectors(startTarget, center, ease);
      controlsRef.current.update();
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [focusTarget]);
  return null;
}

function WheelHitbox({ part, pos, radius, selected, hovered, onHover, onClick }) {
  const isSelected = selected.includes(part);
  const isHovered  = hovered === part;
  return (
    <mesh
      position={pos}
      rotation={[0, 0, Math.PI / 2]}
      onClick={(e) => { e.stopPropagation(); onClick(part); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(part); }}
      onPointerOut={(e)  => { e.stopPropagation(); onHover(null); }}
    >
      <cylinderGeometry args={[radius, radius, 0.06, 32]} />
      <meshBasicMaterial transparent
        opacity={isSelected ? 0.50 : isHovered ? 0.30 : 0.001}
        color={isSelected ? "#22c55e" : "#60a5fa"}
        depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function HitboxMesh({ part, pos, size, selected, hovered, onHover, onClick }) {
  const isSelected = selected.includes(part);
  const isHovered  = hovered === part;
  return (
    <mesh
      position={pos}
      onClick={(e) => { e.stopPropagation(); onClick(part); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(part); }}
      onPointerOut={(e)  => { e.stopPropagation(); onHover(null); }}
    >
      <boxGeometry args={size} />
      <meshBasicMaterial transparent
        opacity={isSelected ? 0.50 : isHovered ? 0.30 : 0.001}
        color={isSelected ? "#22c55e" : "#60a5fa"}
        depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function CarModel({ selected, onPartClick, focusPartName, controlsRef }) {
  const { scene }   = useGLTF("/car.glb");
  const [hovered, setHovered] = useState(null);
  // Stocker uniquement color+emissive originaux (pas un clone complet)
  const originalValsRef = useRef(new Map());
  const fittedRef       = useRef(false);
  const [focusTarget, setFocusTarget] = useState(null);

  useEffect(() => {
    if (!scene || fittedRef.current) return;
    fittedRef.current = true;
    autoFitScene(scene);
  }, [scene]);

  // Sauvegarder les valeurs originales de chaque materiau (sans cloner)
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (originalValsRef.current.has(child.uuid)) return;
      const save = (m) => ({
        color:             m.color    ? m.color.clone()    : new THREE.Color(1,1,1),
        emissive:          m.emissive ? m.emissive.clone()  : new THREE.Color(0,0,0),
        emissiveIntensity: m.emissiveIntensity ?? 0,
      });
      originalValsRef.current.set(
        child.uuid,
        Array.isArray(child.material)
          ? child.material.map(save)
          : save(child.material)
      );
    });
  }, [scene]);

  // Focus caméra
  useEffect(() => {
    if (!focusPartName) return;
    const box = new THREE.Box3();
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh && MESH_TO_PART[child.name] === focusPartName)
          box.expandByObject(child);
      });
    }
    if (box.isEmpty()) {
      const hb = HITBOXES.find(h => h.part === focusPartName);
      if (hb) box.setFromCenterAndSize(new THREE.Vector3(...hb.pos), new THREE.Vector3(...hb.size));
      const wh = WHEELS.find(w => w.part === focusPartName);
      if (wh) box.setFromCenterAndSize(new THREE.Vector3(...wh.pos), new THREE.Vector3(wh.radius*2, wh.radius*2, 0.2));
    }
    if (box.isEmpty()) return;
    const phantom = new THREE.Object3D();
    const helper  = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({visible:false}));
    const c = new THREE.Vector3(), s = new THREE.Vector3();
    box.getCenter(c); box.getSize(s);
    helper.position.copy(c); helper.scale.copy(s);
    phantom.add(helper);
    setFocusTarget(phantom);
  }, [focusPartName, scene]);

  // Coloration : modifier directement le materiau original (pas un clone)
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const vals = originalValsRef.current.get(child.uuid);
      if (!vals) return;
      const partName   = MESH_TO_PART[child.name];
      const isSelected = partName && selected.includes(partName);
      const isHov      = partName && hovered === partName;
      const paint = (mat, orig) => {
        if (!mat || !orig) return;
        if (isSelected) {
          mat.color.set("#22c55e");
          if (mat.emissive) mat.emissive.set("#0f7a35");
          mat.emissiveIntensity = 0.7;
        } else if (isHov) {
          mat.color.copy(orig.color).lerp(new THREE.Color("#60a5fa"), 0.45);
          if (mat.emissive) mat.emissive.set("#1d4ed8");
          mat.emissiveIntensity = 0.3;
        } else {
          // Restaurer EXACTEMENT les valeurs d'origine (feux rouges, blancs, etc.)
          mat.color.copy(orig.color);
          if (mat.emissive) mat.emissive.copy(orig.emissive);
          mat.emissiveIntensity = orig.emissiveIntensity;
        }
        mat.needsUpdate = true;
      };
      if (Array.isArray(child.material)) {
        child.material.forEach((mat, i) => {
          const orig = Array.isArray(vals) ? vals[i] : vals;
          paint(mat, orig);
        });
      } else {
        paint(child.material, Array.isArray(vals) ? vals[0] : vals);
      }
    });
  }, [scene, selected, hovered]);

  const handleHover = useCallback((p) => {
    setHovered(p);
    document.body.style.cursor = p ? "pointer" : "default";
  }, []);

  return (
    <>
      <CameraController focusTarget={focusTarget} controlsRef={controlsRef} />
      <primitive object={scene} />
      {HITBOXES.map((hb) => (
        <HitboxMesh key={hb.part} part={hb.part} pos={hb.pos} size={hb.size}
          selected={selected} hovered={hovered} onHover={handleHover} onClick={onPartClick} />
      ))}
      {WHEELS.map((w) => (
        <WheelHitbox key={w.part} part={w.part} pos={w.pos} radius={w.radius}
          selected={selected} hovered={hovered} onHover={handleHover} onClick={onPartClick} />
      ))}
    </>
  );
}

useGLTF.preload("/car.glb");

export default function VehicleSchema({ onChange, nature, manqueType, onManqueChange, initialZones, initialAutre }) {
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState(initialZones || []);
  const [autoRotate,    setAutoRotate]    = useState(true);
  const [focusPartName, setFocusPartName] = useState(null);
  const controlsRef = useRef();
  const [openGroups, setOpenGroups] = useState(
    Object.fromEntries(GROUPS.map(g => [g.label, true]))
  );

  // Synchroniser les zones initiales quand editData change
  useEffect(() => {
    if (initialZones && initialZones.length > 0) {
      setSelected(initialZones);
    }
  }, [JSON.stringify(initialZones)]);

  const [autreVal, setAutreVal] = useState(initialAutre || "");

  // Synchroniser autreVal quand initialAutre change
  useEffect(() => {
    if (initialAutre) setAutreVal(initialAutre);
  }, [initialAutre]);

  const toggle = useCallback((partName) => {
    setSelected(prev => {
      const updated = prev.includes(partName)
        ? prev.filter(x => x !== partName)
        : [...prev, partName];
      onChange?.(updated);
      return updated;
    });
    setFocusPartName(partName);
    setAutoRotate(false);
  }, [onChange]);

  const toggleGroup = (label) =>
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

  return (
    <div style={{
      display:"flex",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? 12 : 20,
      alignItems:"flex-start",
      overflow:"hidden",
      width:"100%",
    }}>
      <div style={{
        width: isMobile ? "100%" : 380,
        height: isMobile ? 220 : 280,
        borderRadius:12,
        border:"1px solid rgba(255,255,255,0.1)",
        background:"linear-gradient(135deg,#0a0f1e,#0f172a)",
        overflow:"hidden", flexShrink:0, position:"relative",
      }}>
        <button onClick={() => setAutoRotate(v => !v)} style={{
          position:"absolute", top:8, right:8, zIndex:10,
          padding:"4px 10px", borderRadius:6, fontSize:9, cursor:"pointer",
          border:"1px solid rgba(255,255,255,0.2)",
          background:"rgba(0,0,0,0.6)", color:"#fff", backdropFilter:"blur(4px)",
        }}>{autoRotate ? "⏸ Stop" : "▶ Auto"}</button>

        {selected.length > 0 && (
          <div style={{
            position:"absolute", top:8, left:8, zIndex:10,
            padding:"4px 10px", borderRadius:6,
            background:"rgba(34,197,94,0.2)", border:"1px solid #22c55e",
            color:"#22c55e", fontSize:10, fontWeight:600, backdropFilter:"blur(4px)",
          }}>✅ {selected.length} zone(s)</div>
        )}

        <div style={{
          position:"absolute", bottom:8, left:8, zIndex:10,
          display:"flex", gap:8, fontSize:9, color:"rgba(255,255,255,0.4)",
        }}>
          <span>🟢 Selectionne</span>
          <span>💠 Survol</span>
          <span>🖱️ Drag • Scroll</span>
        </div>

        <Canvas
          camera={{ position:[4, 1.5, 4], fov:50 }}
          shadows
          gl={{
            antialias: true,
            outputColorSpace: THREE.SRGBColorSpace,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
          }}
          style={{ background:"transparent" }}
        >
          <Suspense fallback={null}>
            {/* Eclairage doux pour ne pas ecraser les textures/feux du GLB */}
            <ambientLight intensity={1.2} />
            <directionalLight position={[5,8,5]}   intensity={1.8} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
            <directionalLight position={[-5,6,-3]}  intensity={1.0} />
            <directionalLight position={[0,4,-6]}   intensity={0.8} />
            <pointLight position={[0,5,0]}   intensity={1.0} color="#ffffff" />
            <pointLight position={[4,2,4]}   intensity={0.6} color="#ddeeff" />
            <pointLight position={[-4,2,-4]} intensity={0.6} color="#ffeedd" />

            <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,0,0]}>
              <planeGeometry args={[30,30]} />
              <meshStandardMaterial color="#0a1020" roughness={0.9} metalness={0.05}/>
            </mesh>
            <ContactShadows position={[0,0.01,0]} opacity={0.6} scale={6} blur={2} far={2} color="#000011"/>

            <CarModel selected={selected} onPartClick={toggle}
              focusPartName={focusPartName} controlsRef={controlsRef}/>

            <OrbitControls ref={controlsRef} autoRotate={autoRotate} autoRotateSpeed={1.2}
              enablePan={false} minDistance={2} maxDistance={10}
              minPolarAngle={Math.PI/10} maxPolarAngle={Math.PI/2.2} target={[0,0.8,0]}/>
          </Suspense>
        </Canvas>
      </div>

      <div style={{ flex:1, width: isMobile ? "100%" : "auto", minWidth:0, maxHeight: isMobile ? "none" : 280, overflowY: isMobile ? "visible" : "auto", display:"flex", flexDirection:"column", gap:4 }}>
        {GROUPS.map((group) => {
          const isOpen        = openGroups[group.label];
          const groupSelected = group.parts.filter(p => selected.includes(p)).length;
          return (
            <div key={group.label}>
              <div onClick={() => toggleGroup(group.label)} style={{
                padding:"5px 10px", borderRadius:8, cursor:"pointer",
                background: groupSelected>0 ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.08)",
                border: groupSelected>0 ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(255,255,255,0.1)",
                display:"flex", justifyContent:"space-between", alignItems:"center",
                fontSize:11, fontWeight:700, color:"#fff", userSelect:"none",
              }}>
                <span>{group.label}</span>
                <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {groupSelected>0 && (
                    <span style={{ color:"#22c55e", fontSize:10 }}>{groupSelected}/{group.parts.length}</span>
                  )}
                  <span style={{ opacity:0.5, fontSize:9 }}>{isOpen?"▲":"▼"}</span>
                </span>
              </div>
              {isOpen && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:3, marginTop:3 }}>
                  {group.parts.map((id) => {
                    const isActive  = selected.includes(id);
                    const isFocused = focusPartName === id;
                    return (
                      <div key={id} onClick={() => toggle(id)} style={{
                        padding:"6px 10px", borderRadius:6, cursor:"pointer",
                        fontSize:11, textAlign:"center",
                        border: isActive  ? "1px solid #22c55e"
                               : isFocused ? "1px solid #60a5fa"
                               :             "1px solid rgba(255,255,255,0.1)",
                        background: isActive  ? "linear-gradient(135deg,#22c55e,#16a34a)"
                                  : isFocused ? "rgba(96,165,250,0.15)"
                                  :             "rgba(255,255,255,0.05)",
                        color:"#fff", userSelect:"none",
                        transition:"background 0.15s, border 0.15s",
                      }}>{id}</div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Champ Autre */}
        <div style={{ marginTop:4 }}>
          <input
            value={autreVal}
            style={{
              padding:10, borderRadius:8,
              border:"1px solid rgba(255,255,255,0.15)",
              outline:"none", background:"rgba(0,0,0,0.25)",
              color:"#fff", width:"100%", boxSizing:"border-box", fontSize:11,
            }}
            placeholder="✏️ Autre position (saisie libre)..."
            onChange={(e) => {
              const val = e.target.value;
              setAutreVal(val);
              const trimmed = val.trim();
              setSelected(prev => {
                const filtered = prev.filter(x => !x.startsWith("Autre:"));
                const updated  = trimmed ? [...filtered, `Autre: ${trimmed}`] : filtered;
                onChange?.(updated);
                return updated;
              });
            }}
          />
        </div>

        {nature === "Manque" && (
          <div style={{ marginTop:6 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginBottom:5 }}>Type de manque</div>
            <input style={{
              padding:10, borderRadius:8,
              border:"1px solid rgba(255,255,255,0.15)",
              outline:"none", background:"rgba(0,0,0,0.25)",
              color:"#fff", width:"100%", boxSizing:"border-box", fontSize:11,
            }} value={manqueType} onChange={(e) => onManqueChange(e.target.value)}
              placeholder="Ex : tapis, cle, outillage..."/>
          </div>
        )}
      </div>
    </div>
  );
}
