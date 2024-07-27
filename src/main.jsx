import "./style.css";
import App from "./App";
import ReactDOM from "react-dom/client";
import ControlProvider from "./provider/ControlProvider";
import TextureProvider from "./provider/TextureProvider";
import { StrictMode } from "react";

const root = ReactDOM.createRoot(document.querySelector("#root"));

root.render(
  <StrictMode>
    <ControlProvider>
      <TextureProvider>
        <App />
      </TextureProvider>
    </ControlProvider>
  </StrictMode>
);
