import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { setupWindowBehavior } from "@/lib/window";
import { setupEscapeHide } from "@/lib/escape";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

setupWindowBehavior(() => {
  document.getElementById("search-input")?.focus();
});

setupEscapeHide();
