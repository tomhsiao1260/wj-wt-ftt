import { useEffect } from "react";
import Tunnel from "../lib/Tunnel";
import "./App.css";
import Dot from "./Dot/Dot";

function App({ threeIsLoaded }: { threeIsLoaded: boolean }) {
  useEffect(() => {
    if (threeIsLoaded) {
    }
    return () => {};
  }, [threeIsLoaded]);

  return (
    <div className="react-three">
      WE JUST WANT TO FIND THE TITLE
      <Dot />
    </div>
  );
}

export default App;
