import { useEffect } from "react";

export function useRefresh(callback: () => void) {
  useEffect(() => {
    callback();

    const handler = () => callback();

    window.addEventListener("refreshData", handler);

    return () => {
      window.removeEventListener("refreshData", handler);
    };
  }, []);
}
