import * as THREE from "three";
import { useState, useEffect, useContext } from "react";
import { useThree, invalidate } from "@react-three/fiber";
import { useControls } from "leva";
import { useFrame } from "@react-three/fiber";
import { ControlContext } from "../provider/Control/ControlProvider";

export function useAlignXYZ() {
  const { camera } = useThree();
  const { align, setAlign } = useContext(ControlContext);

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
  const { spacePress, setSpacePress } = useContext(ControlContext);
  const { shiftPress, setShiftPress } = useContext(ControlContext);

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
  const { click, setClick } = useContext(ControlContext);

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

export function useSlice(meta) {
  const { x, y, z, size } = meta.chunks[0];

  const { align, spacePress, shiftPress, setSlice } =
    useContext(ControlContext);

  const [{ posX, posY, posZ }, set] = useControls("position", () => ({
    posX: { min: x, max: x + size, value: x, label: "x" },
    posY: { min: y, max: y + size, value: y, label: "y" },
    posZ: { min: z, max: z + size, value: z, label: "z" },
  }));

  useEffect(() => {
    const dpi = 0.0001;

    function update(e) {
      if (spacePress || shiftPress) return;
      if (align === "x") set({ posX: posX + dpi * e.deltaY * size });
      if (align === "y") set({ posY: posY + dpi * e.deltaY * size });
      if (align === "z") set({ posZ: posZ + dpi * e.deltaY * size });
    }

    window.addEventListener("wheel", update);
    return () => window.removeEventListener("wheel", update);
  }, [spacePress, shiftPress, align, posX, posY, posZ]);

  useEffect(() => {
    setSlice({
      x: (posX - x) / size,
      y: (posY - y) / size,
      z: (posZ - z) / size,
    });
  }, [posX, posY, posZ]);
}
