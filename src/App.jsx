import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useMeta } from "./hook/useMeta";
import Volume from "./core/Volume";
import Cube from "./component/Cube";
import Controls from "./component/Controls";

export default function App() {
  const gl = {};
  gl.antialias = true;
  gl.outputEncoding = THREE.sRGBEncoding;

  const camera = {};
  camera.fov = 75;
  camera.far = 50;
  camera.near = 0.01;
  camera.up = [0, -1, 0];
  camera.position = [0, 0, -1.5];

  return (
    <Canvas frameloop="demand" camera={camera} gl={gl}>
      <Controls />
      <Scene />
    </Canvas>
  );
}

function Scene() {
  const { meta } = useMeta();

  return meta ? (
    <>
      <Cube meta={meta} />
      {/* <Volume meta={meta}/> */}
    </>
  ) : null;
}
