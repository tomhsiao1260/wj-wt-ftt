import * as THREE from "three";
import { useState, useEffect, useRef } from "react";
import { useFrame, extend, invalidate } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { NRRDLoader } from "three/examples/jsm/loaders/NRRDLoader";
import textureViridis from "./textures/cm_viridis.png";
import volumeFragment from "./volume.glsl";
import { useControls } from "leva";
import { useAlignXYZ } from "../hook/useControl";

const FullScreenMaterial = shaderMaterial(
  {
    cmdata: null,
    volumeTex: null,
    volume: true,
    colorful: true,
    size: new THREE.Vector3(),
    clim: new THREE.Vector2(0.0, 1.0),
    projectionInverse: new THREE.Matrix4(),
    transformInverse: new THREE.Matrix4(),
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
  const [meta, setMeta] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [inverseBoundsMatrix, setInverseBoundsMatrix] = useState(null);

  const { colorful, volume, clim } = useControls({
    colorful: true,
    volume: true,
    clim: { min: 0, max: 1, value: [0, 1] },
  });

  useAlignXYZ();

  useEffect(() => {
    if (!meta) {
      process();
    }

    async function process() {
      const meta = await fetch("./meta.json").then((res) => res.json());
      setMeta(meta);
    }
  }, [meta]);

  useEffect(() => {
    if (!loaded && meta) {
      process();
    }

    async function process() {
      const path = meta.chunks[0].volume[0];
      const volume = await new NRRDLoader().loadAsync(path);
      const { xLength: w, yLength: h, zLength: d } = volume;

      const matrix = new THREE.Matrix4();
      const center = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      const scaling = new THREE.Vector3();
      const s = 1 / Math.max(w, h, d);

      const inverseBoundsMatrix = new THREE.Matrix4();
      scaling.set(w * s, h * s, d * s);
      matrix.compose(center, quat, scaling);
      inverseBoundsMatrix.copy(matrix).invert();
      setInverseBoundsMatrix(inverseBoundsMatrix);

      const volumeTex = new THREE.Data3DTexture(volume.data, w, h, d);
      volumeTex.format = THREE.RedFormat;
      volumeTex.type = THREE.UnsignedByteType;
      volumeTex.minFilter = THREE.NearestFilter;
      volumeTex.magFilter = THREE.NearestFilter;
      volumeTex.needsUpdate = true;

      const cmtextures = await new THREE.TextureLoader().loadAsync(
        textureViridis
      );
      fullScreenMaterialRef.current.size.set(w, h, d);
      fullScreenMaterialRef.current.volumeTex = volumeTex;
      fullScreenMaterialRef.current.cmdata = cmtextures;

      setLoaded(true);
      setTimeout(() => {
        invalidate();
      }, 500);
    }
  }, [loaded, meta]);

  useFrame((state, delta) => {
    if (!loaded) return;

    console.log("rendering ...");

    state.camera.updateMatrixWorld();

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
        volume={volume}
      />
    </mesh>
  );
}
