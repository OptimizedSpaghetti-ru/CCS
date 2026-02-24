import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppProvider } from "./context/AppContext";

export default function App() {
  return (
    <AppProvider>
      <div className="app-container">
        <RouterProvider router={router} />
      </div>
    </AppProvider>
  );
}
