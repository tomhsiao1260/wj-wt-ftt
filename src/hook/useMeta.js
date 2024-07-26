import { useState, useEffect } from "react";

export function useMeta() {
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    fetch("./meta.json")
      .then((res) => res.json())
      .then((meta) => {
        setMeta(meta);
      });
  }, []);

  return { meta };
}
