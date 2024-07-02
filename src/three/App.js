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

  const viewer = new ViewerCore({ renderer, canvas });
  update(viewer);
}

function update(viewer) {
  viewer.render();
  updateGUI(viewer);
}

function updateGUI(viewer) {
  const gui = new GUI();
  gui.add(viewer.params, "colorful").name("color").onChange(viewer.render);
  gui.add(viewer.params, "volume").name("volume").onChange(viewer.render);
  gui.add(viewer.params, "min", 0, 1, 0.01).name("min").onChange(viewer.render);
  gui.add(viewer.params, "max", 0, 1, 0.01).name("max").onChange(viewer.render);

  const slice = gui.addFolder("slice").close();
  slice.add(viewer.params.slice, "x", 0, 1, 0.01).onChange(viewer.render);
  slice.add(viewer.params.slice, "y", 0, 1, 0.01).onChange(viewer.render);
  slice.add(viewer.params.slice, "z", 0, 1, 0.01).onChange(viewer.render);
}

export default ThreeApp;
