import { createContext, useState } from "react";

export const ControlContext = createContext();

export default function ControlProvider({ children }) {
  const [align, setAlign] = useState(null);
  const [click, setClick] = useState(false);
  const [spacePress, setSpacePress] = useState(false);
  const [shiftPress, setShiftPress] = useState(false);
  const [slice, setSlice] = useState({ x: 0, y: 0, z: 0 });
  const [dot, setDot] = useState({ r: 0, rPixel: 0, erase: false });
  const [label, setLabel] = useState({ select: 1, options: [1, 2, 3, 4, 5] });

  return (
    <ControlContext.Provider
      value={{
        click,
        align,
        spacePress,
        shiftPress,
        slice,
        dot,
        label,
        setClick,
        setAlign,
        setSpacePress,
        setShiftPress,
        setSlice,
        setDot,
        setLabel,
      }}
    >
      {children}
    </ControlContext.Provider>
  );
}
