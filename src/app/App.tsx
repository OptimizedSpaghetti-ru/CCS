import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppProvider, useApp } from "./context/AppContext";

function AppShell() {
  const { themePreference } = useApp();

  return (
    <div className="app-container">
      <RouterProvider key={themePreference} router={router} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
