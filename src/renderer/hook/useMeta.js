import { useState } from "react";

export function useMeta() {
  const [meta, setMeta] = useState({ chunks: null, files: null });

  return { meta, setMeta };
}
