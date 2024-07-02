import * as THREE from "three";
import { VolumeMaterial } from "./VolumeMaterial.js";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { NRRDLoader } from "three/examples/jsm/loaders/NRRDLoader.js";
import textureViridis from "./textures/cm_viridis.png";

export default class ViewerCore {
  constructor({ renderer, canvas }) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.render = this.render.bind(this);

    this.inverseBoundsMatrix = new THREE.Matrix4();
    this.volumePass = new FullScreenQuad(new VolumeMaterial());
    this.cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    this.cmtextures = {
      viridis: new THREE.TextureLoader().load(textureViridis),
    };

    this.params = {};
    this.params.colorful = true;
    this.params.volume = true;
    this.params.min = 0;
    this.params.max = 1;
    this.params.slice = new THREE.Vector3();

    this.init();
  }

  async init() {
    // scene setup
    this.scene = new THREE.Scene();
    this.scene.add(this.cube);

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

    const controls = new OrbitControls(this.camera, this.canvas);
    controls.addEventListener("change", this.render);

    this.cmtextures.viridis.minFilter = THREE.NearestFilter;
    this.cmtextures.viridis.maxFilter = THREE.NearestFilter;
    this.volumePass.material.uniforms.cmdata.value = this.cmtextures.viridis;

    this.sdfTexGenerate();
  }

  async sdfTexGenerate() {
    // const volume = await new NRRDLoader().loadAsync("cube.nrrd");
    const volume = await new NRRDLoader().loadAsync("volume_0_2408_4560.nrrd");

    const { xLength: w, yLength: h, zLength: d } = volume;

    const matrix = new THREE.Matrix4();
    const center = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scaling = new THREE.Vector3();
    const s = 1 / Math.max(w, h, d);

    scaling.set(w * s, h * s, d * s);
    matrix.compose(center, quat, scaling);
    this.inverseBoundsMatrix.copy(matrix).invert();

    const volumeTex = new THREE.Data3DTexture(volume.data, w, h, d);
    volumeTex.format = THREE.RedFormat;
    volumeTex.type = THREE.UnsignedByteType;
    volumeTex.minFilter = THREE.NearestFilter;
    volumeTex.magFilter = THREE.NearestFilter;
    volumeTex.needsUpdate = true;

    this.volumePass.material.uniforms.volumeTex.value = volumeTex;
    this.volumePass.material.uniforms.size.value.set(w, h, d);
    this.volumePass.material.uniforms.cmdata.value = this.cmtextures.viridis;

    this.render();
  }

  render() {
    if (!this.renderer) return;

    // this.renderer.render(this.scene, this.camera);

    this.volumePass.material.uniforms.colorful.value = this.params.colorful;
    this.volumePass.material.uniforms.volume.value = this.params.volume;
    this.volumePass.material.uniforms.clim.value.x = this.params.min;
    this.volumePass.material.uniforms.clim.value.y = this.params.max;
    this.volumePass.material.uniforms.slice.value.copy(this.params.slice);

    this.camera.updateMatrixWorld();

    this.volumePass.material.uniforms.direction.value =
      this.camera.getWorldDirection(new THREE.Vector3());
    this.volumePass.material.uniforms.projectionInverse.value.copy(
      this.camera.projectionMatrixInverse
    );
    this.volumePass.material.uniforms.sdfTransformInverse.value
      .copy(new THREE.Matrix4())
      .invert()
      .premultiply(this.inverseBoundsMatrix)
      .multiply(this.camera.matrixWorld);

    this.volumePass.render(this.renderer);
  }
}
