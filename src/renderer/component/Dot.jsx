import React, { useEffect, useState, useContext } from 'react';
import { ControlContext } from '../provider/ControlProvider';

export default function Dot() {
  const [xPos, setXPos] = useState(0);
  const [yPos, setYPos] = useState(0);
  const [radius, setRadius] = useState(0);
  const { dot } = useContext(ControlContext);

  useEffect(() => {
    document.addEventListener('mousemove', onMouseUpdate);
    document.addEventListener('mouseenter', onMouseUpdate);

    function onMouseUpdate(e) {
      const x = e.pageX;
      const y = e.pageY;
      setXPos(x);
      setYPos(y);
    }
  }, []);

  useEffect(() => {
    setRadius(dot.rPixel);
  }, [dot]);

  return (
    <div
      className={`${
        dot.erase ? 'bg-stone-50' : 'bg-purple-950'
      } opacity-30 z-50 rounded-full fixed translate-x-[-50%] translate-y-[-50%] pointer-events-none`}
      style={{
        left: xPos,
        top: yPos,
        width: radius * 2,
        height: radius * 2,
      }}
    ></div>
  );
}
