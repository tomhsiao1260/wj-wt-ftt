import { useRef, useContext } from "react";
import { useFrame } from "@react-three/fiber";
import { ControlContext } from "../provider/Control/ControlProvider";

export default function Cube({ meta }) {
  const cube = useRef();
  const { align, click } = useContext(ControlContext);

  useFrame((state, delta) => {
    console.log("render");
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
