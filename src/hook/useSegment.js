import * as THREE from "three";
import { useEffect, useContext } from "react";
import { useThree } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { DataContext } from "../provider/DataProvider";
import { parseBuffer } from "../component/FileSystem";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

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
      const pathList = meta.chunks[0].segments;

      if (!pathList.length) {
        console.log("no segment, skipped");

        const empty = { target: null, loaded: true };
        setSegmentList([empty]);
        return;
      }

      console.log("load segment");

      const promiseList = pathList.map((path) => parseBuffer(files, path));
      const bufferList = await Promise.all(promiseList);
      const objList = bufferList.map((data) => new OBJLoader().parse(data));
      const targetList = objList.map((obj) => {
        const geometry = obj.children[0].geometry;
        const { x, y, z, size } = meta.chunks[0];
        const position = { x, y, z, w: size, h: size, d: size };

        return { target: geometry, loaded: true, ...position };
      });

      setSegmentList(targetList);
    }
  }, []);
}

export function useSegmentSDF() {
  const { gl } = useThree();
  const { segmentList, setSdf } = useContext(DataContext);

  useEffect(() => {
    if (segmentList[0].loaded) {
      generateData();
    }

    async function generateData() {
      if (!segmentList[0].target) {
        console.log("no segment SDF, skipped");

        const empty = { target: null, loaded: true };
        setSdf(empty);
        return;
      }

      console.log("generate segment SDF");

      const { x, y, z, w, h, d } = segmentList[0];
      const quat = new THREE.Quaternion();
      const scaling = new THREE.Vector3(w, h, d);
      const center = new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2);

      const position = { x, y, z, w, h, d };
      const matrix = new THREE.Matrix4();
      matrix.compose(center, quat, scaling);

      const geometryList = segmentList.map(({ target: geometry }) => geometry);
      const geometry = BufferGeometryUtils.mergeGeometries(geometryList);

      const t = 100;
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

      geometry.dispose();
      bvh.geometry.dispose();
      generateSdfPass.material.dispose();

      gl.setRenderTarget(null);

      setSdf({ target: render3DTarget, loaded: true, ...position });
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
