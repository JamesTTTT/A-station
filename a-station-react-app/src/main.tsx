import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./routes";
import "./index.css";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useThemeInit } from "@/hooks/useThemeInit";

function App() {
  const auth = useAuth();
  useThemeInit();
  return <RouterProvider router={router} context={{ auth }} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
