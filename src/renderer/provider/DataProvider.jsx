import * as THREE from "three";
import { createContext, useState } from "react";

export const DataContext = createContext();

export default function DataProvider({ children }) {
  const maskInit = { target: targetInteger(), loaded: false };
  const [mask, setMask] = useState(maskInit);

  const volumeInit = { target: targetFloat(), loaded: false };
  const [volumeList, setVolumeList] = useState([volumeInit]);

  const posInit = { x: 0, y: 0, z: 0, w: 0, h: 0, d: 0 };
  const segmentInit = { target: null, loaded: false, ...posInit };
  const [segmentList, setSegmentList] = useState([segmentInit]);

  const sdfInit = { target: targetFloat(), loaded: false, ...posInit };
  const [sdf, setSdf] = useState(sdfInit);

  return (
    <DataContext.Provider
      value={{
        mask,
        volumeList,
        segmentList,
        sdf,
        setMask,
        setVolumeList,
        setSegmentList,
        setSdf,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function targetFloat() {
  const texture = new THREE.Data3DTexture(new Uint8Array([0]), 1, 1, 1);
  texture.format = THREE.RedFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;

  const render3DTarget = new THREE.WebGL3DRenderTarget(1, 1, 1);
  render3DTarget.texture = texture;
  return render3DTarget;
}

export function targetInteger() {
  const texture = new THREE.Data3DTexture(new Uint8Array([0]), 1, 1, 1);
  texture.internalFormat = "R8UI";
  texture.format = THREE.RedIntegerFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;

  const render3DTarget = new THREE.WebGL3DRenderTarget(1, 1, 1);
  render3DTarget.texture = texture;
  return render3DTarget;
}
