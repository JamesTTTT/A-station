import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./routes";
import "./index.css";
import { useAuthInit } from "@/hooks/useAuthInit";
import { Toaster } from "@/components/ui/sonner";
import { initCanvasRebuild } from "@/stores/canvasRebuild";

function App() {
  const { isInitialized } = useAuthInit();

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}

initCanvasRebuild();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
