import { useState, useEffect } from "react";

export function useMeta() {
  const [meta, setMeta] = useState({});

  useEffect(() => {
    fetch("./meta.json")
      .then((res) => res.json())
      .then((meta) => {
        setMeta(meta);
      });
  }, []);

  return { meta };
}
