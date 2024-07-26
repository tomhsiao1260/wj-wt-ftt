import * as THREE from "three";
import { useState, useEffect } from "react";
import { useThree, invalidate } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";

export function useAlignXYZ() {
  const { camera } = useThree();
  const [align, setAlign] = useState(null);

  useEffect(() => {
    window.addEventListener("keypress", (e) => {
      if (e.code === "KeyZ") {
        camera.position.set(0, 0, -1.5);
        camera.rotation.set(Math.PI, 0, 0);
        setAlign("z");
        invalidate();
      }
      if (e.code === "KeyY") {
        camera.position.set(0, 1.5, 0);
        camera.rotation.set(-Math.PI / 2, 0, 0);
        setAlign("y");
        invalidate();
      }
      if (e.code === "KeyX") {
        camera.position.set(-1.5, 0, 0);
        camera.rotation.set(-Math.PI / 2, -Math.PI / 2, Math.PI / 2);
        setAlign("x");
        invalidate();
      }
    });
  }, []);

  useFrame(() => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    const thres = 0.95;
    if (Math.abs(direction.x) > thres) {
      if (align != "x") setAlign("x");
      return;
    }
    if (Math.abs(direction.y) > thres) {
      if (align != "y") setAlign("y");
      return;
    }
    if (Math.abs(direction.z) > thres) {
      if (align != "z") setAlign("z");
      return;
    }
    if (align) setAlign(null);
  });

  return { align };
}

export function useKeybind() {
  const [spacePress, setSpacePress] = useState(false);
  const [shiftPress, setShiftPress] = useState(false);

  useEffect(() => {
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        setSpacePress(true);
      }
      if (e.key === "Shift") {
        setShiftPress(true);
      }
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        setSpacePress(false);
      }
      if (e.key === "Shift") {
        setShiftPress(false);
      }
    });
  }, []);

  return { spacePress, shiftPress };
}

export function useMouse() {
  const [click, setClick] = useState(false);

  useEffect(() => {
    window.addEventListener("mousedown", (e) => {
      setClick(true);
    });
    window.addEventListener("mouseup", (e) => {
      setClick(false);
    });
  }, []);

  return { click };
}
