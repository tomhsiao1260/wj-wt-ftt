import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Tunnel from "../lib/Tunnel";

async function ThreeApp(threeNode: HTMLCanvasElement) {
  Tunnel.on("react-say", (data) => {
    console.log(data);
  });
  Tunnel.send("three-say", "hi-react!");

  // Sizes
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  window.addEventListener("resize", () => {
    // Save sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
  });

  // Scene
  const scene = new THREE.Scene();

  // Camera
  const camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    100
  );
  camera.position.z = 3;
  scene.add(camera);

  // Test
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshNormalMaterial()
  );
  scene.add(cube);

  // Renderer
  const canvas = threeNode;

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(sizes.width, sizes.height);

  // Controls
  const controls = new OrbitControls(camera, canvas);
  controls.target = new THREE.Vector3(0, 0, 0);
  controls.enableDamping = true;

  // Tick
  const tick = () => {
    // Update
    cube.rotation.y += 0.01;

    // Controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Keep looping
    window.requestAnimationFrame(tick);
  };
  tick();
}

export default ThreeApp;
