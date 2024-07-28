import * as THREE from "three";
import { useEffect, useContext } from "react";
import { NRRDLoader } from "three/examples/jsm/loaders/NRRDLoader";
import { DataContext } from "../provider/DataProvider";

export function useVolume(meta) {
  const { volumeList, setVolumeList } = useContext(DataContext);

  useEffect(() => {
    if (!volumeList[0].loaded) {
      loadData();
    }

    async function loadData() {
      console.log("load volume");

      const pathList = meta.chunks[0].volume;
      const promiseList = pathList.map((path) =>
        new NRRDLoader().loadAsync(path)
      );
      const nrrdList = await Promise.all(promiseList);

      const targetList = nrrdList.map((nrrd) => {
        const { xLength: w, yLength: h, zLength: d } = nrrd;

        const volumeTex = new THREE.Data3DTexture(nrrd.data, w, h, d);
        volumeTex.format = THREE.RedFormat;
        volumeTex.type = THREE.UnsignedByteType;
        volumeTex.minFilter = THREE.NearestFilter;
        volumeTex.magFilter = THREE.NearestFilter;
        volumeTex.needsUpdate = true;

        const render3DTarget = new THREE.WebGL3DRenderTarget(w, h, d);
        render3DTarget.texture = volumeTex;

        return { target: render3DTarget, loaded: true };
      });

      setVolumeList(targetList);
    }
  }, [volumeList]);
}
