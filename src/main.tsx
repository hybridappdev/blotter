import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@hybridappdev/primitives/tokens.css";
import "@hybridappdev/primitives/styles.css";
import { App } from "./app";
import "./screen.css";

const root = document.querySelector(".screen-root");
if (!root) throw new Error("Root element missing");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
