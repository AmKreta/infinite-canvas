import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Canvas from "@infinite-canvas/canvas";
import App from "./App";

console.log(Canvas);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
