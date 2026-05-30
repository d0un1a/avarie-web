import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";

export default function Stats() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("Avaries").select("*");
      setData(data || []);
    };

    load();
  }, []);

  const total = data.length;
  const v1 = data.filter(d => d.cotation === "V1").length;
  const v2 = data.filter(d => d.cotation === "V2").length;
  const v3 = data.filter(d => d.cotation === "V3").length;

  return (
    <div style={{ padding: 20 }}>
      <h2>Stats</h2>

      <p>Total: {total}</p>
      <p>V1: {v1}</p>
      <p>V2: {v2}</p>
      <p>V3: {v3}</p>
    </div>
  );
}