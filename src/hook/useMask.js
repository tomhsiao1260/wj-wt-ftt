import * as THREE from "three";
import { useControls } from "leva";
import { useEffect, useContext } from "react";
import { NRRDLoader } from "three/examples/jsm/loaders/NRRDLoader";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { TextureContext } from "../provider/TextureProvider";
import { ControlContext } from "../provider/ControlProvider";
import maskFragment from "../core/mask.glsl";
import settings from "../settings.json";

export function useMask(meta) {
  const { mask, setMask } = useContext(TextureContext);

  useEffect(() => {
    if (!mask.loaded) {
      loadData();
    }

    async function loadData() {
      console.log("load mask");

      const path = meta.chunks[0].mask;
      const nrrd = await new NRRDLoader().loadAsync(path);
      const { xLength: w, yLength: h, zLength: d } = nrrd;

      const maskTex = new THREE.Data3DTexture(nrrd.data, w, h, d);
      maskTex.internalFormat = "R8UI";
      maskTex.format = THREE.RedIntegerFormat;
      maskTex.type = THREE.UnsignedByteType;
      maskTex.minFilter = THREE.NearestFilter;
      maskTex.magFilter = THREE.NearestFilter;
      maskTex.needsUpdate = true;

      const render3DTarget = new THREE.WebGL3DRenderTarget(w, h, d);
      render3DTarget.texture = maskTex;

      setMask({ target: render3DTarget, loaded: true });
    }
  }, [mask]);
}

export function useSketch() {
  const { spacePress, shiftPress } = useContext(ControlContext);

  const [{ dot, depth, erase }, set] = useControls(
    "sketch",
    () => ({
      dot: { min: 0, max: 0.2, value: 0.05, step: 0.01 },
      depth: { min: 0, max: 20, value: 5, step: 1 },
      erase: false,
    }),
    { collapsed: true }
  );

  useEffect(() => {
    function update(e) {
      if (e.key === "e") {
        set({ erase: !erase });
      }
    }

    window.addEventListener("keydown", update);
    return () => window.removeEventListener("keydown", update);
  }, [erase]);

  useEffect(() => {
    function update(e) {
      if (!shiftPress) return;
      set({ dot: dot + settings.dpi * e.deltaY });
    }

    window.addEventListener("wheel", update);
    return () => window.removeEventListener("wheel", update);
  }, [shiftPress, dot]);

  return { dot, depth, erase };
}

// create a compute shader to write data
const sketchShader = new THREE.RawShaderMaterial({
  glslVersion: THREE.GLSL3,
  uniforms: {
    resolution: { value: new THREE.Vector2() },
    mouse: { value: new THREE.Vector2() },
    erase: { value: false },
    dot: { value: 0.01 },
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

// To Do: make sketchShader into hook (auto update uniforms)
export function updateUniform(dot, erase) {
  sketchShader.uniforms.dot.value = dot;
  sketchShader.uniforms.erase.value = erase;
}

export function editMask(renderer, render3DTarget, point, depth) {
  const { width, height } = render3DTarget;
  sketchShader.uniforms.mouse.value.set(point.x, point.y);
  sketchShader.uniforms.resolution.value.set(width, height);

  renderer.autoClear = false;

  // compute the next frame
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
