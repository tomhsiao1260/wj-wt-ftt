import * as THREE from "three";
import Tunnel from "../../lib/Tunnel";
import { VolumeMaterial } from "./VolumeMaterial.js";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { NRRDLoader } from "three/examples/jsm/loaders/NRRDLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import textureViridis from "./textures/cm_viridis.png";

import { MeshBVH } from "three-mesh-bvh";
import { GenerateSDFMaterial } from "./GenerateSDFMaterial.js";

export default class ViewerCore {
  constructor({ meta, renderer, canvas }) {
    this.meta = meta;
    this.canvas = canvas;
    this.renderer = renderer;
    this.render = this.render.bind(this);

    this.raycaster = new THREE.Raycaster();
    this.inverseBoundsMatrix = new THREE.Matrix4();
    this.volumePass = new FullScreenQuad(new VolumeMaterial());
    this.cmtextures = {
      viridis: new THREE.TextureLoader().load(textureViridis),
    };

    // mouse position
    this.mouse = new THREE.Vector2();
    this.spacePress = false;
    this.shiftPress = false;

    // parameters setup
    this.params = {};
    this.params.colorful = false;
    this.params.volume = true;
    this.params.min = 0;
    this.params.max = 1;
    this.params.dot = 0.05;
    this.params.depth = 10;
    this.params.erase = false;
    this.params.sliceHelper = false;
    this.params.select = 1;
    this.params.option = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    this.params.slice = new THREE.Vector3();
    this.meshList = [];

    this.init();
  }

  async init() {
    // scene setup
    this.scene = new THREE.Scene();

    // cube & slice helper
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    const slice = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial()
    );

    this.cubeHelper = new THREE.BoxHelper(cube, 0xffff00);
    this.sliceXHelper = new THREE.BoxHelper(slice.clone(), 0xff0000);
    this.sliceYHelper = new THREE.BoxHelper(slice.clone(), 0x9999ff);
    this.sliceZHelper = new THREE.BoxHelper(slice.clone(), 0x00ff00);

    this.sliceXHelper.object.rotation.set(0, Math.PI / 2, 0);
    this.sliceYHelper.object.rotation.set(Math.PI / 2, 0, 0);
    this.sliceZHelper.object.rotation.set(0, 0, 0);

    this.scene.add(this.cubeHelper);
    this.scene.add(this.sliceXHelper, this.sliceYHelper, this.sliceZHelper);

    // camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.01,
      50
    );
    this.camera.position.copy(
      new THREE.Vector3(0, 0, -1.5).multiplyScalar(1.0)
    );
    this.camera.up.set(0, -1, 0);
    this.camera.far = 5;
    this.camera.updateProjectionMatrix();

    window.addEventListener(
      "resize",
      () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.render();
      },
      false
    );

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enabled = false;
    this.controls.addEventListener("change", this.render);

    this.cmtextures.viridis.minFilter = THREE.NearestFilter;
    this.cmtextures.viridis.maxFilter = THREE.NearestFilter;
    this.volumePass.material.uniforms.cmdata.value = this.cmtextures.viridis;

    this.direction = new THREE.Vector3();

    this.objInit();

    await this.volumeGenerate();

    this.maskInit();

    this.eventHandling();

    this.sendDotPixel();
  }

  sendDotPixel() {
    // assume cube size is 1
    const va = new THREE.Vector3(-0.5, 0, -0.5);
    const vb = new THREE.Vector3(0.5, 0, -0.5);
    va.project(this.camera);
    vb.project(this.camera);

    let radius = Math.abs(va.x - vb.x) * 0.5;
    radius *= window.innerWidth;
    radius *= this.params.dot;

    Tunnel.send("dot-say", radius);
  }

  eventHandling() {
    window.addEventListener("wheel", (e) => {
      if (this.spacePress) return;
      if (this.shiftPress) return;

      const axis = this.getMaxAxisIndex(this.direction);
      let layer = this.params.slice[axis];
      layer += 0.001 * e.deltaY * Math.sign(this.direction[axis]);
      this.params.slice[axis] = Math.max(0, Math.min(1, layer));

      this.render();
    });

    window.addEventListener("wheel", (e) => {
      if (!this.spacePress) return;
      this.sendDotPixel();
    });

    window.addEventListener("wheel", (e) => {
      if (!this.shiftPress) return;

      this.params.dot += 0.001 * e.deltaY;
      this.params.dot = this.params.dot.toFixed(3);
      this.params.dot = Math.max(0, Math.min(0.2, this.params.dot));

      this.sendDotPixel();
      this.render();
    });

    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        this.spacePress = true;
        this.controls.enabled = true;
        this.controls.enableZoom = true;
      }
      if (e.key === "Shift") {
        this.shiftPress = true;
      }
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        this.spacePress = false;
        this.controls.enabled = false;
        this.controls.enableZoom = false;
      }
      if (e.key === "Shift") {
        this.shiftPress = false;
      }
    });

    window.addEventListener("keypress", (e) => {
      if (e.code === "KeyZ") {
        this.camera.position.set(0, 0, -1.5);
        this.camera.rotation.set(Math.PI, 0, 0);
        this.controls.update();
        this.render();
      }
      if (e.code === "KeyY") {
        this.camera.position.set(0, 1.5, 0);
        this.camera.rotation.set(-Math.PI / 2, 0, 0);
        this.controls.update();
        this.render();
      }
      if (e.code === "KeyX") {
        this.camera.position.set(-1.5, 0, 0);
        this.camera.rotation.set(-Math.PI / 2, -Math.PI / 2, Math.PI / 2);
        this.controls.update();
        this.render();
      }
      if (e.code === "KeyE") {
        this.params.erase = !this.params.erase;
      }
    });
  }

  getMaxAxisIndex(vector) {
    const absValues = [
      Math.abs(vector.x),
      Math.abs(vector.y),
      Math.abs(vector.z),
    ];
    const maxIndex = absValues.indexOf(Math.max(...absValues));

    const axes = ["x", "y", "z"];
    return axes[maxIndex];
  }

  async objInit() {
    const segmentPath = this.meta.segments[0];
    const object = await new OBJLoader().loadAsync(segmentPath);

    const geometry = object.children[0].geometry;
    const material = new THREE.MeshNormalMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    const { x: xmin, y: ymin, z: zmin, size } = this.meta;
    const center = new THREE.Vector3(
      xmin + size / 2,
      ymin + size / 2,
      zmin + size / 2
    );
    const s = 1 / size;
    mesh.scale.set(s, s, s);
    mesh.position.copy(center.clone().multiplyScalar(-s));

    this.meshList.push(mesh);
    this.scene.add(mesh);

    const bSize = Math.round(size / 10);
    const scaling = new THREE.Vector3(size, size, size);
    const [sdfTex, _] = this.sdfTexGenerate(geometry, center, scaling, bSize);

    this.volumePass.material.uniforms.sdfTex.value = sdfTex.texture;
  }

  sdfTexGenerate(geometry, center, scaling, size) {
    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    matrix.compose(center, quat, scaling);

    const pxWidth = 1 / size;
    const halfWidth = 0.5 * pxWidth;

    const bvh = new MeshBVH(geometry, { maxLeafTris: 1 });
    const generateSdfPass = new FullScreenQuad(new GenerateSDFMaterial());
    generateSdfPass.material.uniforms.bvh.value.updateFrom(bvh);
    generateSdfPass.material.uniforms.matrix.value.copy(matrix);

    const sdfTex = new THREE.WebGL3DRenderTarget(size, size, size);
    sdfTex.texture.format = THREE.RedFormat;
    sdfTex.texture.type = THREE.FloatType;
    sdfTex.texture.minFilter = THREE.LinearFilter;
    sdfTex.texture.magFilter = THREE.LinearFilter;

    // render into each layer
    for (let i = 0; i < size; i++) {
      generateSdfPass.material.uniforms.zValue.value = i * pxWidth + halfWidth;

      this.renderer.setRenderTarget(sdfTex, i);
      generateSdfPass.render(this.renderer);
    }

    generateSdfPass.material.dispose();
    this.renderer.setRenderTarget(null);

    return [sdfTex, bvh];
  }

  async volumeGenerate() {
    // mask handling
    const mask = await new NRRDLoader().loadAsync(this.meta.mask);

    const { xLength: w, yLength: h, zLength: d } = mask;
    const matrix = new THREE.Matrix4();
    const center = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scaling = new THREE.Vector3();
    const s = 1 / Math.max(w, h, d);

    scaling.set(w * s, h * s, d * s);
    matrix.compose(center, quat, scaling);
    this.inverseBoundsMatrix.copy(matrix).invert();

    const maskTex = new THREE.Data3DTexture(mask.data, w, h, d);
    maskTex.internalFormat = "R8UI";
    maskTex.format = THREE.RedIntegerFormat;
    maskTex.type = THREE.UnsignedByteType;
    maskTex.minFilter = THREE.NearestFilter;
    maskTex.magFilter = THREE.NearestFilter;
    maskTex.needsUpdate = true;

    // volumes handling
    const promiseList = this.meta.volume.map((p) =>
      new NRRDLoader().loadAsync(p)
    );
    const volumeList = await Promise.all(promiseList);

    const volumeTexList = volumeList.map((volume) => {
      const texture = new THREE.Data3DTexture(volume.data, w, h, d);
      texture.format = THREE.RedFormat;
      texture.type = THREE.UnsignedByteType;
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.needsUpdate = true;
      return texture;
    });

    this.volumePass.material.uniforms.volumeTex.value = volumeTexList[0];
    this.volumePass.material.uniforms.maskTex.value = maskTex;
    this.volumePass.material.uniforms.size.value.set(w, h, d);
    this.volumePass.material.uniforms.cmdata.value = this.cmtextures.viridis;

    window.addEventListener("keypress", (e) => {
      volumeTexList.forEach((volumeTex, i) => {
        if (e.code === `Digit${i + 1}`) {
          this.volumePass.material.uniforms.volumeTex.value = volumeTex;
          this.render();
        }
      });
    });

    this.render();
  }

  maskInit() {
    const maskTex = this.volumePass.material.uniforms.maskTex.value;
    const { x: w, y: h, z: d } = this.volumePass.material.uniforms.size.value;

    this.render3DTarget = new THREE.WebGL3DRenderTarget(w, h, d);
    this.render3DTarget.texture = maskTex;

    // create a compute shader to write data
    this.sketchShader = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        resolution: { value: new THREE.Vector2() },
        mouse: { value: new THREE.Vector2() },
        dot: { value: 0 },
        erase: { value: this.params.erase },
      },
      vertexShader: `
            precision highp float;
            precision highp int;

            in vec3 position;
            out vec2 uv;

            void main() {
                gl_Position = vec4(position, 1.0);
                uv = position.xy * 0.5 + 0.5;
            }
        `,
      fragmentShader: `
            precision highp float; 
            precision highp int;

            uniform vec2 resolution;
            uniform vec2 mouse;
            uniform float dot;
            uniform bool erase;
            out uvec4 fragColor;

            void main() {
                vec2 r = resolution.xy;
                vec2 c = gl_FragCoord.xy;
                vec2 m = mouse * r;
                vec2 o = c / r;

                vec2 grid = c - mod(c, 1.0);
                vec2 target = m - mod(m, 1.0);
                float distance = length(target - grid);

                if (distance > r.x * dot) discard;
                fragColor = erase ? uvec4(0, 0, 0, 0) : uvec4(1.0, 0, 0, 0);
            }`,
    });
    this.sketchRenderer = new FullScreenQuad(this.sketchShader);

    // mouse event handling
    const handleMouseMove = (e) => this.editMask(e);

    window.addEventListener("mousedown", (e) => {
      if (e.target.tagName.toLowerCase() !== "canvas") return;
      if (this.spacePress) return;

      handleMouseMove(e);

      window.addEventListener("mousemove", handleMouseMove);
    });

    window.addEventListener("mouseup", (e) => {
      if (e.target.tagName.toLowerCase() !== "canvas") return;
      if (this.spacePress) return;

      window.removeEventListener("mousemove", handleMouseMove);
    });
  }

  editMask(e) {
    const point = this.raycast(e);
    if (!point) return;

    const axis = this.getMaxAxisIndex(this.direction);
    const facing = Math.abs(this.direction[axis]) > 0.99;
    if (!facing) return;

    const { x: w, y: h, z: d } = this.volumePass.material.uniforms.size.value;

    this.renderer.autoClear = false;
    // this.renderer.setSize(w, h); // bottle neck, perhaps don't need this

    // compute the next frame
    this.sketchShader.uniforms.mouse.value.set(point.x, point.y);
    this.sketchShader.uniforms.resolution.value.set(w, h);
    this.sketchShader.uniforms.dot.value = this.params.dot;
    this.sketchShader.uniforms.erase.value = this.params.erase;

    const { depth } = this.params;
    for (let i = -depth; i <= depth; i++) {
      const layer = point.z * d + i;
      if (layer < 0 || layer >= d) continue;
      this.renderer.setRenderTarget(this.render3DTarget, layer);
      this.sketchRenderer.render(this.renderer);
    }

    this.renderer.autoClear = true;
    // this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderer.setRenderTarget(null);
    this.volumePass.render(this.renderer);
    // this.render();
  }

  raycast(e) {
    // update mouse
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects([
      this.cubeHelper.object,
    ]);

    if (intersects.length) {
      const point = intersects[0].point;
      const axis = this.getMaxAxisIndex(point);
      point.add(new THREE.Vector3(0.5, 0.5, 0.5));
      point[axis] = this.params.slice[axis];

      return point;
    }

    return;
  }

  render() {
    if (!this.renderer) return;

    this.renderer.clear();
    this.renderer.autoClear = false;

    this.sliceXHelper.object.position.x = this.params.slice.x - 0.5;
    this.sliceYHelper.object.position.y = this.params.slice.y - 0.5;
    this.sliceZHelper.object.position.z = this.params.slice.z - 0.5;

    this.sliceXHelper.visible = this.params.sliceHelper;
    this.sliceYHelper.visible = this.params.sliceHelper;
    this.sliceZHelper.visible = this.params.sliceHelper;

    this.sliceXHelper.update();
    this.sliceYHelper.update();
    this.sliceZHelper.update();

    this.renderer.render(this.scene, this.camera);

    this.volumePass.material.uniforms.colorful.value = this.params.colorful;
    this.volumePass.material.uniforms.volume.value = this.params.volume;
    this.volumePass.material.uniforms.clim.value.x = this.params.min;
    this.volumePass.material.uniforms.clim.value.y = this.params.max;
    this.volumePass.material.uniforms.piece.value = this.params.select;
    this.volumePass.material.uniforms.slice.value.copy(this.params.slice);

    this.camera.getWorldDirection(this.direction);
    this.camera.updateMatrixWorld();

    this.volumePass.material.uniforms.direction.value = this.direction;
    this.volumePass.material.uniforms.projectionInverse.value.copy(
      this.camera.projectionMatrixInverse
    );
    this.volumePass.material.uniforms.sdfTransformInverse.value
      .copy(new THREE.Matrix4())
      .invert()
      .premultiply(this.inverseBoundsMatrix)
      .multiply(this.camera.matrixWorld);

    this.volumePass.render(this.renderer);

    this.renderer.autoClear = true;
  }
}
