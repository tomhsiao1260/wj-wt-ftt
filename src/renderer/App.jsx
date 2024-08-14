import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';
import { useMeta } from './hook/useMeta';
import Volume from './core/Volume';
import Cube from './component/Cube';
import Segment from './component/Segment';
import Controls from './component/Controls';

import { useMask } from './hook/useMask';
import { useVolume } from './hook/useVolume';
import { useSegment, useSegmentSDF } from './hook/useSegment';
import { useMouse, useSlice , useAlignXYZ, useKeybind } from './hook/useControl';
import FileSystem from './component/FileSystem';
import Dot from './component/Dot';
import Channels from '../main/ipcs/channels';
import useClearConsole from './hook/useClearConsole';

export default function App() {
  useClearConsole();

  // example
  useEffect(() => {
    window.electron.ipcRenderer
      .invoke(Channels.getSystemDetail)
      .then((data) => {
        console.log(data);
      });
    window.electron.ipcRenderer
      .invoke(Channels.runPythonCode, 123)
      .then((data) => {
        console.log(data);
      });
  }, []);

  const gl = {};
  gl.antialias = true;
  gl.outputEncoding = THREE?.sRGBEncoding;

  const camera = {};
  camera.fov = 75;
  camera.far = 50;
  camera.near = 0.01;
  camera.up = [0, -1, 0];
  camera.position = [0, 0, -1.5];

  const { meta, setMeta } = useMeta();

  return (
    <>
      <FileSystem setMeta={setMeta} />
      <Dot />

      <Canvas frameloop="demand" camera={camera} gl={gl}>
        <Controls />
        {meta.chunks ? <Scene meta={meta} /> : null}
      </Canvas>
    </>
  );
}

function Scene({ meta }) {
  useAlignXYZ();
  useKeybind();
  useMouse();
  useSlice(meta);

  useMask(meta);
  useVolume(meta);
  useSegment(meta);
  useSegmentSDF();

  return (
    <>
      <Cube />
      <Volume />
      <Segment />
    </>
  );
}
