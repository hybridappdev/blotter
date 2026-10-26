import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@hybridappdev/primitives/tokens.css";
import "@hybridappdev/primitives/styles.css";
import { App } from "./app";
import "./screen.css";

export function mount(element: HTMLElement): () => void {
  element.classList.add("screen-root");
  const root = createRoot(element);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  return () => root.unmount();
}
