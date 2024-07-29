import * as THREE from "three";
import { useControls, button } from "leva";
import { useThree } from "@react-three/fiber";
import { useState, useEffect, useContext } from "react";
import { NRRDLoader } from "three/examples/jsm/loaders/NRRDLoader";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { DataContext } from "../provider/DataProvider";
import { ControlContext } from "../provider/ControlProvider";
import maskFragment from "../core/mask.glsl";
import settings from "../settings.json";

export function useMask(meta) {
  const { mask, setMask } = useContext(DataContext);

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
  const { camera, gl } = useThree();
  const { dot, setDot } = useContext(ControlContext);
  const { label, setLabel } = useContext(ControlContext);
  const { spacePress, shiftPress } = useContext(ControlContext);

  const [{ dot: dotRadius, depth, erase }, set] = useControls(
    "sketch",
    () => ({
      dot: { min: 0, max: 0.2, value: 0.05, step: 0.01 },
      depth: { min: 0, max: 20, value: 5, step: 1 },
      erase: false,
      label: {
        value: label.select,
        options: label.options,
        onChange: updateLabel,
      },
      addLabel: button(addLabel),
    }),
    { collapsed: true },
    [label]
  );

  useEffect(() => {
    function sendDotPixel() {
      // assume cube size is 1
      const va = new THREE.Vector3(-0.5, 0, -0.5);
      const vb = new THREE.Vector3(0.5, 0, -0.5);
      va.project(camera);
      vb.project(camera);

      // window.innerWidth
      const { width } = gl.getSize(new THREE.Vector2());
      const radius = 0.5 * width * dotRadius * Math.abs(va.x - vb.x);
      return radius;
    }

    setDot({ r: dotRadius, rPixel: sendDotPixel(), erase });

    function update() {
      if (spacePress) setDot({ r: dotRadius, rPixel: sendDotPixel(), erase });
    }
    window.addEventListener("wheel", update);
    return () => window.removeEventListener("wheel", update);
  }, [dotRadius, erase, spacePress]);

  function updateLabel(selectLabel) {
    setLabel(({ select, options }) => ({ select: selectLabel, options }));

    const sketchShader = getSketchShader();
    sketchShader.uniforms.label.value = selectLabel;
  }

  function addLabel() {
    setLabel((label) => {
      const { select, options } = label;
      const lastIndex = options.length - 1;
      const newLabel = options[lastIndex] + 1;
      return { select, options: [...options, newLabel] };
    });
  }

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
      set({ dot: dotRadius + settings.dpi * e.deltaY });
    }

    window.addEventListener("wheel", update);
    return () => window.removeEventListener("wheel", update);
  }, [shiftPress, dotRadius]);

  return { dotRadius, depth, erase };
}

// create a compute shader to write data
const sketchShader = new THREE.RawShaderMaterial({
  glslVersion: THREE.GLSL3,
  uniforms: {
    resolution: { value: new THREE.Vector2() },
    mouse: { value: new THREE.Vector2() },
    erase: { value: false },
    dot: { value: 0.01 },
    label: { value: 1 },
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
export function getSketchShader() {
  return sketchShader;
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
