import { useState, useEffect } from "react";
import { useThree, invalidate } from "@react-three/fiber";

export function useAlignXYZ() {
  const { camera } = useThree();

  useEffect(() => {
    window.addEventListener("keypress", (e) => {
      if (e.code === "KeyZ") {
        camera.position.set(0, 0, -1.5);
        camera.rotation.set(Math.PI, 0, 0);
        invalidate();
      }
      if (e.code === "KeyY") {
        camera.position.set(0, 1.5, 0);
        camera.rotation.set(-Math.PI / 2, 0, 0);
        invalidate();
      }
      if (e.code === "KeyX") {
        camera.position.set(-1.5, 0, 0);
        camera.rotation.set(-Math.PI / 2, -Math.PI / 2, Math.PI / 2);
        invalidate();
      }
    });
  }, []);
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
