import * as THREE from "three";
import { useState, useEffect, useRef, useContext } from "react";
import { useFrame, extend, invalidate } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { ControlContext } from "../provider/ControlProvider";
import { TextureContext } from "../provider/TextureProvider";
import { targetFloat, targetInteger } from "../provider/TextureProvider";
import textureViridis from "./textures/cm_viridis.png";
import volumeFragment from "./volume.glsl";
import { useControls } from "leva";

const FullScreenMaterial = shaderMaterial(
  {
    align: 3, // 0: not align, 1: x, 2: y, 3: z
    cmdata: null,
    colorful: true,
    size: new THREE.Vector3(),
    slice: new THREE.Vector3(),
    clim: new THREE.Vector2(0.0, 1.0),
    projectionInverse: new THREE.Matrix4(),
    transformInverse: new THREE.Matrix4(),
    maskTex: targetInteger().texture,
    volumeTex: targetFloat().texture,
  },
  `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
  `,
  volumeFragment
);
extend({ FullScreenMaterial });

export default function Volume() {
  const fullScreenMaterialRef = useRef();
  const { mask, volume } = useContext(TextureContext);
  const { align, slice } = useContext(ControlContext);
  const [inverseBoundsMatrix, setInverseBoundsMatrix] = useState(null);

  const { colorful, clim } = useControls(
    "display",
    {
      clim: { min: 0, max: 1, value: [0, 1] },
      colorful: { value: false, label: "color" },
    },
    { collapsed: true }
  );

  useEffect(() => {
    if (volume.loaded && mask.loaded) {
      process();
    }

    async function process() {
      console.log("process volume & mask");

      const matrix = new THREE.Matrix4();
      const center = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      const scaling = new THREE.Vector3();

      const { width: w, height: h, depth: d } = volume.target;
      const s = 1 / Math.max(w, h, d);

      const inverseBoundsMatrix = new THREE.Matrix4();
      scaling.set(w * s, h * s, d * s);
      matrix.compose(center, quat, scaling);
      inverseBoundsMatrix.copy(matrix).invert();
      setInverseBoundsMatrix(inverseBoundsMatrix);

      const cmtextures = await new THREE.TextureLoader().loadAsync(
        textureViridis
      );
      fullScreenMaterialRef.current.size.set(w, h, d);
      fullScreenMaterialRef.current.cmdata = cmtextures;
      fullScreenMaterialRef.current.volumeTex = volume.target.texture;
      fullScreenMaterialRef.current.maskTex = mask.target.texture;

      setTimeout(() => {
        invalidate();
      }, 500);
    }
  }, [volume, mask]);

  useFrame((state, delta) => {
    if (!volume.loaded || !mask.loaded) return;

    console.log("rendering");

    state.camera.updateMatrixWorld();

    const alignMap = { x: 1, y: 2, z: 3 };
    fullScreenMaterialRef.current.align = alignMap[align] ? alignMap[align] : 0;
    fullScreenMaterialRef.current.slice.set(slice.x, slice.y, slice.z);
    fullScreenMaterialRef.current.projectionInverse.copy(
      state.camera.projectionMatrixInverse
    );
    fullScreenMaterialRef.current.transformInverse
      .copy(new THREE.Matrix4())
      .invert()
      .premultiply(inverseBoundsMatrix)
      .multiply(state.camera.matrixWorld);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2, 1, 1]} />
      <fullScreenMaterial
        ref={fullScreenMaterialRef}
        clim={[clim[0], clim[1]]}
        colorful={colorful}
      />
    </mesh>
  );
}
