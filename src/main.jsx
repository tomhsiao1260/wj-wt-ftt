import "./style.css";
import App from "./App";
import ReactDOM from "react-dom/client";
import ControlProvider from "./provider/Control/ControlProvider";
import { StrictMode } from "react";

const root = ReactDOM.createRoot(document.querySelector("#root"));

root.render(
  <StrictMode>
    <ControlProvider>
      <App />
    </ControlProvider>
  </StrictMode>
);
