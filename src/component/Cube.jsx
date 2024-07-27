import { BoxHelper } from "three";
import { useContext } from "react";
import { Helper } from "@react-three/drei";
import { ControlContext } from "../provider/Control/ControlProvider";
import { useControls } from "leva";

export default function Cube({ meta }) {
  const { align, click, spacePress, slice } = useContext(ControlContext);
  const { visible } = useControls("slice", { visible: false });

  function edit(e) {
    e.stopPropagation();
    console.log(e.point);
  }

  return (
    <>
      <mesh
        onPointerMove={(e) => {
          if (align && click && !spacePress) edit(e);
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshNormalMaterial opacity={0} transparent />
        <Helper type={BoxHelper} args={[0xffff00]} />
      </mesh>

      <SliceHelper axis="x" color={0xff0000} slice={slice} visible={visible} />
      <SliceHelper axis="y" color={0x9999ff} slice={slice} visible={visible} />
      <SliceHelper axis="z" color={0x00ff00} slice={slice} visible={visible} />
    </>
  );
}

function SliceHelper({ color, slice, axis, visible }) {
  let rotation;
  if (axis === "x") rotation = [0, Math.PI / 2, 0];
  if (axis === "y") rotation = [Math.PI / 2, 0, 0];
  if (axis === "z") rotation = [0, 0, 0];

  let position;
  if (axis === "x") position = [slice.x - 0.5, 0, 0];
  if (axis === "y") position = [0, slice.y - 0.5, 0];
  if (axis === "z") position = [0, 0, slice.z - 0.5];

  return (
    <mesh rotation={rotation} position={position}>
      <planeGeometry args={[1, 1]} />
      <meshNormalMaterial opacity={1.0} transparent />
      <Helper type={BoxHelper} visible={visible} args={[color]} />
    </mesh>
  );
}
