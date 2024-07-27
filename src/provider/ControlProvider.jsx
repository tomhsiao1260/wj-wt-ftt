import { createContext, useState } from "react";

export const ControlContext = createContext();

export default function ControlProvider({ children }) {
  const [align, setAlign] = useState(null);
  const [click, setClick] = useState(false);
  const [spacePress, setSpacePress] = useState(false);
  const [shiftPress, setShiftPress] = useState(false);
  const [slice, setSlice] = useState({ x: 0, y: 0, z: 0 });

  return (
    <ControlContext.Provider
      value={{
        click,
        align,
        spacePress,
        shiftPress,
        slice,
        setClick,
        setAlign,
        setSpacePress,
        setShiftPress,
        setSlice,
      }}
    >
      {children}
    </ControlContext.Provider>
  );
}
