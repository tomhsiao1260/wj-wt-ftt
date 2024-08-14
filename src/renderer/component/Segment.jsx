import * as THREE from "three";
import { useEffect, useContext } from "react";
import { DataContext } from "../provider/DataProvider";

export default function Segment() {
  const { segmentList } = useContext(DataContext);

  return (
    <>
      {segmentList.map(({ target: geometry, loaded, x, y, z, w: size }, i) => {
        if (!loaded || !geometry) return null;

        const s = 1 / size;
        const px = -s * (x + size / 2);
        const py = -s * (y + size / 2);
        const pz = -s * (z + size / 2);
        const position = [px, py, pz];

        return (
          <mesh
            key={i}
            geometry={geometry}
            position={position}
            scale={[s, s, s]}
          >
            <meshNormalMaterial side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </>
  );
}
