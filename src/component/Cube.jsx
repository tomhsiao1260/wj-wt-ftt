import { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useMouse, useKeybind } from "../hook/useControl";
import { useAlignXYZ } from "../hook/useControl";
import { useControls } from "leva";

export default function Cube({ meta }) {
  const { x, y, z, size } = meta.chunks[0];

  const cube = useRef();
  const { align } = useAlignXYZ();
  const { click } = useMouse();
  const { spacePress, shiftPress } = useKeybind();

  const [sliceX, setSliceX] = useState(0);
  const [sliceY, setSliceY] = useState(0);
  const [sliceZ, setSliceZ] = useState(0);

  const [{ posX, posY, posZ }, set] = useControls("position", () => ({
    posX: { min: x, max: x + size, value: x, label: "x" },
    posY: { min: y, max: y + size, value: y, label: "y" },
    posZ: { min: z, max: z + size, value: z, label: "z" },
  }));

  useEffect(() => {
    function update(e) {
      const dpi = 0.0001;

      if (spacePress || shiftPress) return;
      if (align === "x") set({ posX: posX + dpi * e.deltaY * size });
      if (align === "y") set({ posY: posY + dpi * e.deltaY * size });
      if (align === "z") set({ posZ: posZ + dpi * e.deltaY * size });
    }

    window.addEventListener("wheel", update);
    return () => window.removeEventListener("wheel", update);
  }, [spacePress, shiftPress, align, sliceX, sliceY, sliceZ]);

  useEffect(() => {
    setSliceX((posX - x) / size);
    setSliceY((posY - y) / size);
    setSliceZ((posZ - z) / size);
  }, [posX, posY, posZ, setSliceX, setSliceY, setSliceZ]);

  useFrame((state, delta) => {
    console.log(meta);
    // console.log("render");
  });

  return (
    <mesh
      ref={cube}
      onPointerMove={(e) => {
        e.stopPropagation();
        if (align && click) console.log(e.point);
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshNormalMaterial />
    </mesh>
  );
}
