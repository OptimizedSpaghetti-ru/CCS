import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { applyThemePreference, getStoredThemePreference } from "./app/theme";

applyThemePreference(getStoredThemePreference());

createRoot(document.getElementById("root")!).render(<App />);
