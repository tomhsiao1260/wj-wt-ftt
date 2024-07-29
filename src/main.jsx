import "./style.css";
import App from "./App";
import ReactDOM from "react-dom/client";
import ControlProvider from "./provider/ControlProvider";
import DataProvider from "./provider/DataProvider";
import { StrictMode } from "react";
import Dot from "./component/Dot";

const root = ReactDOM.createRoot(document.querySelector("#root"));

root.render(
  <StrictMode>
    <ControlProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </ControlProvider>
  </StrictMode>
);
