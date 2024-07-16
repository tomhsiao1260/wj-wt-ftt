import { useEffect } from "react";
import Tunnel from "../lib/Tunnel";
import "./App.css";

function App({ threeIsLoaded }: { threeIsLoaded: boolean }) {
  useEffect(() => {
    const unsub = Tunnel.on("three-say", (data) => {
      console.log(data);
    });
    Tunnel.on("dot-say", (data) => {
      console.log(data);
    });
    if (threeIsLoaded) {
      Tunnel.send("react-say", "hi-three!");
    }
    return () => {
      unsub();
    };
  }, [threeIsLoaded]);

  return <div className="react-three">WE JUST WANT TO FIND THE TITLE</div>;
}

export default App;
