import * as THREE from "three";
import { useState, useContext } from "react";
import { Helper } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { ControlContext } from "../provider/Control/ControlProvider";
import { useControls } from "leva";
import { BoxHelper } from "three";
import { useMask, editMask } from "../hook/useMask";

export default function Cube({ meta }) {
  const { gl } = useThree();
  const { align, click, spacePress, slice } = useContext(ControlContext);
  const { visible } = useControls("slice", { visible: false });

  useMask(meta);

  function edit(e) {
    e.stopPropagation();

    const point = e.point;
    point.add(new THREE.Vector3(0.5, 0.5, 0.5));
    point[align] = slice[align];

    editMask(gl, point);
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
      <meshNormalMaterial opacity={0} transparent />
      <Helper type={BoxHelper} visible={visible} args={[color]} />
    </mesh>
  );
}
