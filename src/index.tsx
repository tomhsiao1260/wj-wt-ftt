import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./react/App";
import ThreeWrapper from "./lib/ThreeWrapper";
import ThreeApp from "./three/App.js";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<ThreeWrapper script={ThreeApp} App={App} />);
