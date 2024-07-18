import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import Tunnel from "../../lib/Tunnel";

export default function Dot() {
  const [xPos, setXPos] = useState(0);
  const [yPos, setYPos] = useState(0);
  const [radius, setRadius] = useState(0);

  useEffect(() => {
    document.addEventListener("mousemove", onMouseUpdate);
    document.addEventListener("mouseenter", onMouseUpdate);

    Tunnel.on("dot-say", (r) => {
      setRadius(r);
    });

    function onMouseUpdate(e: { pageX: any; pageY: any }) {
      const x = e.pageX;
      const y = e.pageY;
      setXPos(x);
      setYPos(y);
    }
  }, []);

  return (
    <div
      className="bg-red-600 opacity-30 z-50 rounded-full fixed translate-x-[-50%] translate-y-[-50%] pointer-events-none"
      style={{
        left: xPos,
        top: yPos,
        width: radius * 2,
        height: radius * 2,
      }}
    ></div>
  );
}
