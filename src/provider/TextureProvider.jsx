import * as THREE from "three";
import { createContext, useState } from "react";

export const TextureContext = createContext();

export default function TextureProvider({ children }) {
  const maskInit = { target: targetInteger(), loaded: false };
  const [mask, setMask] = useState(maskInit);

  const volumeInit = { target: targetFloat(), loaded: false };
  const [volumeList, setVolumeList] = useState([volumeInit]);

  return (
    <TextureContext.Provider
      value={{
        mask,
        volumeList,
        setMask,
        setVolumeList,
      }}
    >
      {children}
    </TextureContext.Provider>
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
