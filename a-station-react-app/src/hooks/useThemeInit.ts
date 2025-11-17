import { useEffect } from "react";
import { useThemeStore } from "@/stores/themeStore";

export const useThemeInit = () => {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);
};
