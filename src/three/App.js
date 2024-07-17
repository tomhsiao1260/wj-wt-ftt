import * as THREE from "three";
import Tunnel from "../lib/Tunnel";
import ViewerCore from "./core/ViewerCore.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

async function ThreeApp(threeNode) {
  // async function ThreeApp(threeNode: HTMLCanvasElement) {
  Tunnel.on("react-say", (data) => {
    console.log(data);
  });
  Tunnel.send("three-say", "hi-react!");

  // renderer setup
  const canvas = threeNode;
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const metaJson = await fetch("./meta.json").then((res) => res.json());
  const meta = metaJson.chunks[0];

  const viewer = new ViewerCore({ meta, renderer, canvas });
  update(viewer);
}

function update(viewer) {
  viewer.render();
  updateGUI(viewer);
}

function updateGUI(viewer) {
  const { x: xmin, y: ymin, z: zmin, size } = viewer.meta;
  const sliceLayer = new THREE.Vector3(xmin, ymin, zmin);

  const gui = new GUI();
  // gui
  //   .add(viewer.params, "select", viewer.params.option)
  //   .name("piece")
  //   .onChange(viewer.render);

  // temporary solution
  window.addEventListener("wheel", (e) => {
    if (viewer.spacePress) return;

    sliceLayer.x = parseInt(xmin + viewer.params.slice.x * size);
    sliceLayer.y = parseInt(ymin + viewer.params.slice.y * size);
    sliceLayer.z = parseInt(zmin + viewer.params.slice.z * size);
  });

  const slice = gui.addFolder("slice").close();
  slice.add(viewer.params, "sliceHelper").onChange(viewer.render);
  slice
    .add(sliceLayer, "x", xmin, xmin + size - 1, 1)
    .listen()
    .onChange(() => {
      viewer.params.slice.x = (sliceLayer.x - xmin) / size;
      viewer.render();
    });
  slice
    .add(sliceLayer, "y", ymin, ymin + size - 1, 1)
    .listen()
    .onChange(() => {
      viewer.params.slice.y = (sliceLayer.y - ymin) / size;
      viewer.render();
    });
  slice
    .add(sliceLayer, "z", zmin, zmin + size - 1, 1)
    .listen()
    .onChange(() => {
      viewer.params.slice.z = (sliceLayer.z - zmin) / size;
      viewer.render();
    });

  const sketch = gui.addFolder("sketch").close();
  sketch
    .add(viewer.params, "dot", 0, 0.2, 0.01)
    .name("dot")
    .listen()
    .onChange(() => {
      viewer.sendDotPixel();
      viewer.render();
    });
  sketch
    .add(viewer.params, "depth", 0, 50, 1)
    .name("depth")
    .onChange(viewer.render);
  sketch.add(viewer.params, "erase").listen().onChange(viewer.render);

  const display = gui.addFolder("display").close();
  display.add(viewer.params, "colorful").name("color").onChange(viewer.render);
  display
    .add(viewer.params, "min", 0, 1, 0.01)
    .name("min")
    .onChange(viewer.render);
  display
    .add(viewer.params, "max", 0, 1, 0.01)
    .name("max")
    .onChange(viewer.render);
}

export default ThreeApp;
