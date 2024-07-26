import { useState, useEffect } from "react";

export function useMeta() {
  const [meta, setMeta] = useState(null);

  async function process() {
    const meta = await fetch("./meta.json").then((res) => res.json());
    setMeta(meta);
  }

  useEffect(() => {
    process();
  }, []);

  return { meta };
}
