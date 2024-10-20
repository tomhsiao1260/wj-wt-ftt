import * as THREE from 'three';
import * as fflate from 'three/examples/jsm/libs/fflate.module.js';
import { useControls, button } from 'leva';
import { useThree } from '@react-three/fiber';
import { useState, useEffect, useContext } from 'react';
import { NRRDLoader } from 'three/examples/jsm/loaders/NRRDLoader';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { DataContext } from '../provider/DataProvider';
import { ControlContext } from '../provider/ControlProvider';
import { parseBuffer } from '../component/FileSystem';
import maskFragment from '../core/mask.glsl';
import settings from '../settings.json';
import { fetchPythonAPIBuffer } from '../../utils/fetchPythonAPI';

export function useMask(meta) {
  const { mask, setMask } = useContext(DataContext);

  useEffect(() => {
    if (!mask.loaded) {
      loadData();
    }

    async function loadData() {
      console.log('load mask');

      const files = meta.files;
      const path = meta.chunks[0].mask;
      const data = await parseBuffer(files, path);
      const nrrd = new NRRDLoader().parse(data);
      // const nrrd = await new NRRDLoader().loadAsync(path);
      const { xLength: w, yLength: h, zLength: d } = nrrd;

      const maskTex = new THREE.Data3DTexture(nrrd.data, w, h, d);
      maskTex.internalFormat = 'R8UI';
      maskTex.format = THREE.RedIntegerFormat;
      maskTex.type = THREE.UnsignedByteType;
      maskTex.minFilter = THREE.NearestFilter;
      maskTex.magFilter = THREE.NearestFilter;
      maskTex.needsUpdate = true;

      const render3DTarget = new THREE.WebGL3DRenderTarget(w, h, d);
      render3DTarget.texture = maskTex;

      const { x, y, z, size } = meta.chunks[0];
      setMask({ target: render3DTarget, loaded: true, x, y, z, size });
    }
  }, [mask]);
}

export function useExport() {
  const { gl: renderer } = useThree();
  const { mask, setMask } = useContext(DataContext);

  useControls(
    'export',
    {
      // compute: button(() => { console.log('compute') }),
      save: button(async () => {
        const arrayBuffer = readBuffer(renderer, mask.target);
        const data = addHeader(arrayBuffer, mask.x, mask.y, mask.z, mask.size);

        fetchPythonAPIBuffer('/handle_nrrd', data);
        console.log('mask saved ', arrayBuffer);
      }),
    },
    { collapsed: true },
    [mask],
  );
}

export function useSketch() {
  const { camera, gl } = useThree();
  const { align } = useContext(ControlContext);
  const { dot, setDot } = useContext(ControlContext);
  const { label, setLabel } = useContext(ControlContext);
  const { spacePress, shiftPress } = useContext(ControlContext);

  const [{ dot: dotRadius, depth, erase }, set] = useControls(
    'sketch',
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
    [label],
  );

  useEffect(() => {
    function sendDotPixel() {
      const { width } = gl.getSize(new THREE.Vector2()); // window.innerWidth

      // assume cube size is 1
      if (align === 'z') {
        const va = new THREE.Vector3(-0.5, 0, -0.5).project(camera);
        const vb = new THREE.Vector3(0.5, 0, -0.5).project(camera);
        const radius = 0.5 * width * dotRadius * Math.abs(va.x - vb.x);
        return radius;
      }
      if (align === 'y') {
        const va = new THREE.Vector3(-0.5, -0.5, 0).project(camera);
        const vb = new THREE.Vector3(0.5, -0.5, 0).project(camera);
        const radius = 0.5 * width * dotRadius * Math.abs(va.x - vb.x);
        return radius;
      }
      if (align === 'x') {
        const va = new THREE.Vector3(-0.5, 0, -0.5).project(camera);
        const vb = new THREE.Vector3(-0.5, 0, 0.5).project(camera);
        const radius = 0.5 * width * dotRadius * Math.abs(va.x - vb.x);
        return radius;
      }

      return 0;
    }

    setDot({ r: dotRadius, rPixel: sendDotPixel(), erase });

    function update() {
      if (spacePress) setDot({ r: dotRadius, rPixel: sendDotPixel(), erase });
    }
    window.addEventListener('wheel', update);
    return () => window.removeEventListener('wheel', update);
  }, [dotRadius, erase, spacePress, align]);

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
      if (e.key === 'e') {
        set({ erase: !erase });
      }
    }

    window.addEventListener('keydown', update);
    return () => window.removeEventListener('keydown', update);
  }, [erase]);

  useEffect(() => {
    function update(e) {
      if (e.key === 'e') {
        set({ erase: !erase });
      }
    }

    window.addEventListener('keydown', update);
    return () => window.removeEventListener('keydown', update);
  }, [erase]);

  useEffect(() => {
    function update(e) {
      if (!shiftPress) return;
      set({ dot: dotRadius + settings.dpi * e.deltaY });
    }

    window.addEventListener('wheel', update);
    return () => window.removeEventListener('wheel', update);
  }, [shiftPress, dotRadius]);

  return { dotRadius, depth, erase };
}

// create a compute shader to write data
const sketchShader = new THREE.RawShaderMaterial({
  glslVersion: THREE.GLSL3,
  uniforms: {
    resolution: { value: new THREE.Vector2() },
    mouse: { value: new THREE.Vector2() },
    align: { value: 3 }, // 0: not align, 1: x, 2: y, 3: z
    erase: { value: false },
    dot: { value: 0.01 },
    depth: { value: 0 },
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

export function editMask(
  renderer,
  render3DTarget,
  dot,
  depth,
  point,
  align,
) {
  sketchShader.uniforms.mouse.value.set(point.x, point.y);

  renderer.autoClear = false;

  const { depth: d } = render3DTarget;
  const half = align === 'z' ? depth : parseInt(dot * d);

  // compute the next frame
  for (let i = -half; i <= half; i++) {
    const layer = point.z * d + i;
    if (layer < 0 || layer >= d) continue;

    const factor = align === 'z' ? 1 : Math.sqrt(1 - (i / half) * (i / half));
    sketchShader.uniforms.dot.value = dot * factor;

    renderer.setRenderTarget(render3DTarget, layer);
    sketchRenderer.render(renderer);

    // console.log(render3DTarget);
  }

  renderer.autoClear = true;
  renderer.setRenderTarget(null);
}

// extract the result from each layer
function readBuffer(renderer, renderTarget) {
  const { data, width } = renderTarget.texture.source.data;

  const shape = { w: width, h: width, d: width }
  const layerData = new Uint8Array(shape.w * shape.h);

  for (let layer = 0; layer < shape.d; layer++) {
    const offset = layer * shape.w * shape.h;
    renderer.setRenderTarget(renderTarget, layer);
    renderer.readRenderTargetPixels(
      renderTarget,
      0,
      0,
      shape.w,
      shape.h,
      layerData,
    );
    data.set(layerData, offset);
  }
  renderer.setRenderTarget(null);

  return data;
}

// nrrd header & gzip
function addHeader(data, x, y, z, size) {
  let header = 'NRRD0005\n'
  header += `type: unsigned uint8\n`
  header += `dimension: 3\n`
  header += `space: left-posterior-superior\n`
  header += `space directions: (1,0,0) (0,1,0) (0,0,1)\n`
  header += `kinds: domain domain domain\n`
  header += `sizes: ${size} ${size} ${size}\n`
  header += `encoding: gzip\n`
  header += `space origin: (${z},${y},${x})\n`
  header += '\n'

  const codes = Array.from(header, char => char.charCodeAt(0));
  const headerBytes = new Uint8Array(new ArrayBuffer(codes.length));
  for ( let i = 0; i < codes.length; i++ ) { headerBytes[i] = codes[i]; }
  // write data info into buffer (compress it as well)
  // Todo: only deal with 'gz' encoding case, should support 'ascii', 'raw' as well
  const dataBytes = fflate.gzipSync(data);
  const bytes = new Uint8Array([ ...headerBytes, ...dataBytes ]);
  data = new Blob( [ bytes ], { type: 'application/octet-stream' } );

  return data
}

export const compressArrayBuffer = async (input) => {
  //create the stream
  const cs = new CompressionStream('gzip');
  //create the writer
  const writer = cs.writable.getWriter();
  //write the buffer to the writer
  writer.write(input);
  writer.close();
  //create the output
  const output = [];
  const reader = cs.readable.getReader();
  let totalSize = 0;
  //go through each chunk and add it to the output
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    output.push(value);
    totalSize += value.byteLength;
  }
  const concatenated = new Uint8Array(totalSize);
  let offset = 0;
  //finally build the compressed array and return it
  for (const array of output) {
    concatenated.set(array, offset);
    offset += array.byteLength;
  }
  return concatenated;
};

export const decompressArrayBuffer = async (input) => {
  //create the stream
  const ds = new DecompressionStream('gzip');
  // create the writer
  const writer = ds.writable.getWriter();
  //write the buffer to the writer thus decompressing it
  writer.write(input);
  writer.close();
  //create the output
  const output = [];
  //create the reader
  const reader = ds.readable.getReader();
  let totalSize = 0;
  //go through each chunk and add it to the output
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    output.push(value);
    totalSize += value.byteLength;
  }
  const concatenated = new Uint8Array(totalSize);
  let offset = 0;
  //finally build the compressed array and return it
  for (const array of output) {
    concatenated.set(array, offset);
    offset += array.byteLength;
  }
  return concatenated;
};
