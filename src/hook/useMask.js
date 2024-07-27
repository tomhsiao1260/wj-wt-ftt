import * as THREE from "three";
import { useState, useEffect } from "react";
import { NRRDLoader } from "three/examples/jsm/loaders/NRRDLoader";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import maskFragment from "../core/mask.glsl";

let render3DTarget;

// create a compute shader to write data
const sketchShader = new THREE.RawShaderMaterial({
  glslVersion: THREE.GLSL3,
  uniforms: {
    resolution: { value: new THREE.Vector2() },
    mouse: { value: new THREE.Vector2() },
    erase: { value: false },
    dot: { value: 0 },
  },
  vertexShader: `
    precision highp float;
    in vec3 position;
    out vec2 uv;
    
    void main() {
        gl_Position = vec4(position, 1.0);
        uv = position.xy * 0.5 + 0.5;
    }`,
  fragmentShader: maskFragment,
});
const sketchRenderer = new FullScreenQuad(sketchShader);

export function useMask(meta) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      console.log("load mask");
      process();
    }

    async function process() {
      const path = meta.chunks[0].mask;
      const mask = await new NRRDLoader().loadAsync(path);
      const { xLength: w, yLength: h, zLength: d } = mask;

      const maskTex = new THREE.Data3DTexture(mask.data, w, h, d);
      maskTex.internalFormat = "R8UI";
      maskTex.format = THREE.RedIntegerFormat;
      maskTex.type = THREE.UnsignedByteType;
      maskTex.minFilter = THREE.NearestFilter;
      maskTex.magFilter = THREE.NearestFilter;
      maskTex.needsUpdate = true;

      render3DTarget = new THREE.WebGL3DRenderTarget(w, h, d);
      render3DTarget.texture = maskTex;

      sketchShader.uniforms.resolution.value.set(w, h);

      setLoaded(true);
    }
  }, [loaded]);
}

export function editMask(renderer, point) {
  renderer.autoClear = false;
  sketchShader.uniforms.mouse.value.set(point.x, point.y);

  // compute the next frame
  const depth = 10;
  // const { depth } = this.params;
  const { depth: d } = render3DTarget;
  for (let i = -depth; i <= depth; i++) {
    const layer = point.z * d + i;
    if (layer < 0 || layer >= d) continue;
    renderer.setRenderTarget(render3DTarget, layer);
    sketchRenderer.render(renderer);
  }

  renderer.autoClear = true;
  renderer.setRenderTarget(null);
}
