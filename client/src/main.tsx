
import React from "react";
import { createRoot } from "react-dom/client";
import App from "@/pages/App";
import "./index.css";

// Add global error handlers to catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent default browser behavior
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
