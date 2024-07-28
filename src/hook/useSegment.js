import * as THREE from "three";
import { useEffect, useContext } from "react";
import { useThree } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { DataContext } from "../provider/DataProvider";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";

import {
  MeshBVH,
  MeshBVHUniformStruct,
  shaderStructs,
  shaderIntersectFunction,
  shaderDistanceFunction,
} from "three-mesh-bvh";

export function useSegment(meta) {
  const { segmentList, setSegmentList } = useContext(DataContext);

  useEffect(() => {
    if (!segmentList[0].loaded) {
      loadData();
    }

    async function loadData() {
      console.log("load segment");

      const pathList = meta.chunks[0].segments;
      const promiseList = pathList.map((path) =>
        new OBJLoader().loadAsync(path)
      );
      const objList = await Promise.all(promiseList);

      const targetList = objList.map((obj) => {
        const geometry = obj.children[0].geometry;
        const { x, y, z, size } = meta.chunks[0];
        const position = { x, y, z, w: 768, h: 768, d: 768 };
        // const position = { x, y, z, w: size, h: size, d: size };

        return { target: geometry, loaded: true, ...position };
      });

      setSegmentList(targetList);
    }
  }, [segmentList]);
}

export function useSegmentSDF() {
  const { gl } = useThree();
  const { segmentList, setSdfList } = useContext(DataContext);

  useEffect(() => {
    if (segmentList[0].loaded) {
      generateData();
    }

    async function generateData() {
      console.log("generate segment SDF");

      const targetList = segmentList.map(
        ({ target: geometry, x, y, z, w: size }) => {
          const position = { x, y, z, w: size, h: size, d: size };

          const matrix = new THREE.Matrix4();
          const quat = new THREE.Quaternion();
          const scaling = new THREE.Vector3(size, size, size);
          const center = new THREE.Vector3(
            x + size / 2,
            y + size / 2,
            z + size / 2
          );
          matrix.compose(center, quat, scaling);

          const t = 100;
          // const t = Math.round(size / 10);
          const pxWidth = 1 / t;
          const halfWidth = 0.5 * pxWidth;

          const bvh = new MeshBVH(geometry, { maxLeafTris: 1 });
          const generateSdfPass = new FullScreenQuad(new SDFMaterial());
          generateSdfPass.material.uniforms.bvh.value.updateFrom(bvh);
          generateSdfPass.material.uniforms.matrix.value.copy(matrix);

          const render3DTarget = new THREE.WebGL3DRenderTarget(t, t, t);
          render3DTarget.texture.format = THREE.RedFormat;
          render3DTarget.texture.type = THREE.FloatType;
          render3DTarget.texture.minFilter = THREE.LinearFilter;
          render3DTarget.texture.magFilter = THREE.LinearFilter;

          // render into each layer
          for (let i = 0; i < t; i++) {
            generateSdfPass.material.uniforms.zValue.value =
              i * pxWidth + halfWidth;

            gl.setRenderTarget(render3DTarget, i);
            generateSdfPass.render(gl);
          }

          bvh.geometry.dispose();
          generateSdfPass.material.dispose();
          gl.setRenderTarget(null);

          return { target: render3DTarget, loaded: true, ...position };
        }
      );

      setSdfList(targetList);
    }
  }, [segmentList]);
}

export class SDFMaterial extends THREE.ShaderMaterial {
  constructor(params) {
    super({
      uniforms: {
        matrix: { value: new THREE.Matrix4() },
        zValue: { value: 0 },
        bvh: { value: new MeshBVHUniformStruct() },
      },

      vertexShader: /* glsl */ `
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}
			`,

      fragmentShader: /* glsl */ `
        precision highp isampler2D;
        precision highp usampler2D;
        ${shaderStructs}
				${shaderIntersectFunction}
				${shaderDistanceFunction}
				varying vec2 vUv;
        uniform BVH bvh;
				uniform float zValue;
				uniform mat4 matrix;
				void main() {
          // compute the point in space to check
          vec3 point = vec3( vUv, zValue );
          point -= vec3( 0.5 );
          point = ( matrix * vec4( point, 1.0 ) ).xyz;
          // retrieve the distance and other values
          uvec4 faceIndices;
          vec3 faceNormal;
          vec3 barycoord;
          float side;
          vec3 outPoint;
          float dist = bvhClosestPointToPoint( bvh, point.xyz, faceIndices, faceNormal, barycoord, side, outPoint );
          // if the triangle side is the back then it must be on the inside and the value negative
          gl_FragColor = vec4( dist, 0.0, 0, 0 );
          // gl_FragColor = vec4( side * dist, 0, 0, 0 );
				}
			`,
    });

    this.setValues(params);
  }
}
