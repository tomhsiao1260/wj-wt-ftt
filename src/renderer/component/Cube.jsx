import * as THREE from 'three';
import { useEffect, useContext } from 'react';
import { Helper } from '@react-three/drei';
import { useThree, invalidate } from '@react-three/fiber';
import { ControlContext } from '../provider/ControlProvider';
import { DataContext } from '../provider/DataProvider';
import {
  useSketch,
  useExport,
  editMask,
  getSketchShader,
} from '../hook/useMask';
import { useControls } from 'leva';

export default function Cube() {
  const { gl } = useThree();
  const { dotRadius, depth, erase } = useSketch();

  const { mask, texture, setTextureBuffer } = useContext(DataContext);
  const { align, click, spacePress, slice } = useContext(ControlContext);
  // const { visible } = useControls("slice", { visible: false });
  const visible = false;

  useExport();

  useEffect(() => {
    const sketchShader = getSketchShader();
    const { width: w, height: h, depth: d } = mask.target;
    // axis transform because nrrd is in zyx axisOrder
    const alignMap = { x: 3, y: 2, z: 1 };
    // const alignMap = { x: 1, y: 2, z: 3 };

    sketchShader.uniforms.erase.value = erase;
    sketchShader.uniforms.dot.value = dotRadius;
    sketchShader.uniforms.depth.value = depth / d;
    sketchShader.uniforms.resolution.value.set(w, h);
    sketchShader.uniforms.align.value = alignMap[align] ? alignMap[align] : 0;
  }, [mask, dotRadius, erase, align, depth]);

  function edit(e) {
    e.stopPropagation();

    const point = e.point;

    point.add(new THREE.Vector3(0.5, 0.5, 0.5));
    point[align] = slice[align];

    // axis transform because nrrd is in zyx axisOrder
    const transMap = { x: 'z', y: 'y', z: 'x' };
    const transPoint = new THREE.Vector3(point.z, point.y, point.x);
    const transAlign = transMap[align];

    editMask(
      gl,
      mask.target,
      dotRadius,
      depth,
      transPoint,
      transAlign,
    );
    invalidate();
  }

  return (
    <>
      <mesh
        onPointerDown={(e) => {
          if (align && !spacePress && mask.loaded) edit(e);
        }}
        onPointerMove={(e) => {
          if (align && click && !spacePress && mask.loaded) edit(e);
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshNormalMaterial opacity={0} transparent />
        <Helper type={THREE.BoxHelper} args={[0xffff00]} />
      </mesh>

      <SliceHelper axis="x" color={0xff0000} slice={slice} visible={visible} />
      <SliceHelper axis="y" color={0x9999ff} slice={slice} visible={visible} />
      <SliceHelper axis="z" color={0x00ff00} slice={slice} visible={visible} />
    </>
  );
}

function SliceHelper({ color, slice, axis, visible }) {
  let rotation;
  if (axis === 'x') rotation = [0, Math.PI / 2, 0];
  if (axis === 'y') rotation = [Math.PI / 2, 0, 0];
  if (axis === 'z') rotation = [0, 0, 0];

  let position;
  if (axis === 'x') position = [slice.x - 0.5, 0, 0];
  if (axis === 'y') position = [0, slice.y - 0.5, 0];
  if (axis === 'z') position = [0, 0, slice.z - 0.5];

  return (
    <mesh rotation={rotation} position={position}>
      <planeGeometry args={[1, 1]} />
      <meshNormalMaterial opacity={0} transparent />
      <Helper type={THREE.BoxHelper} visible={visible} args={[color]} />
    </mesh>
  );
}

