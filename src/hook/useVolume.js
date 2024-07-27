import * as THREE from "three";
import { useEffect, useContext } from "react";
import { NRRDLoader } from "three/examples/jsm/loaders/NRRDLoader";
import { TextureContext } from "../provider/TextureProvider";

export function useVolume(meta) {
  const { volume, setVolume } = useContext(TextureContext);

  useEffect(() => {
    if (!volume.loaded) {
      loadData();
    }

    async function loadData() {
      console.log("load volume");

      const path = meta.chunks[0].volume[0];
      const nrrd = await new NRRDLoader().loadAsync(path);
      const { xLength: w, yLength: h, zLength: d } = nrrd;

      const volumeTex = new THREE.Data3DTexture(nrrd.data, w, h, d);
      volumeTex.format = THREE.RedFormat;
      volumeTex.type = THREE.UnsignedByteType;
      volumeTex.minFilter = THREE.NearestFilter;
      volumeTex.magFilter = THREE.NearestFilter;
      volumeTex.needsUpdate = true;

      const render3DTarget = new THREE.WebGL3DRenderTarget(w, h, d);
      render3DTarget.texture = volumeTex;

      setVolume({ target: render3DTarget, loaded: true });
    }
  }, [volume]);
}
