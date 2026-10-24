import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { applyThemePreference, getStoredThemePreference } from "./app/theme";
import { Capacitor } from '@capacitor/core';

applyThemePreference(getStoredThemePreference());

createRoot(document.getElementById("root")!).render(<App />);

// Android bundles its own shell. Web requires a prior successful online visit.
if (import.meta.env.PROD && !Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(error => {
      console.warn('Offline app shell could not be cached.', error);
    });
  }, { once: true });
}
