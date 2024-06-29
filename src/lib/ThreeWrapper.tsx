import React, { useEffect, useRef, useState } from "react";

export default function ThreeWrapper({
  script,
  App,
}: {
  App: any;
  script: (threeNodeRef: HTMLCanvasElement) => void;
}) {
  const threeNodeRef = useRef<any>();
  const [threeIsLoaded, setThreeIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = script(threeNodeRef.current);
    setThreeIsLoaded(true);
  }, [script]);

  return (
    <>
      <App threeIsLoaded={threeIsLoaded} />
      <canvas ref={threeNodeRef}></canvas>
    </>
  );
}
