import { createContext, useState } from "react";

export const TextureContext = createContext();

export default function TextureProvider({ children }) {
  const [maskTarget, setMaskTarget] = useState(null);

  return (
    <TextureContext.Provider
      value={{
        maskTarget,
        setMaskTarget,
      }}
    >
      {children}
    </TextureContext.Provider>
  );
}
