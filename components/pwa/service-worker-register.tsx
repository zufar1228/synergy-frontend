"use client";

import { useEffect } from "react";

const SERVICE_WORKER_URL = "/sw.js";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isLocalhost = window.location.hostname === "localhost";
    const isSecureContext =
      window.isSecureContext || window.location.protocol === "https:";

    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (!isSecureContext && !isLocalhost) {
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          SERVICE_WORKER_URL,
          {
            scope: "/",
          }
        );

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener("statechange", () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.info(
                "[PWA] New content available; will be used when all tabs are closed."
              );
            }
          });
        });
      } catch (error) {
        console.warn("[PWA] Service worker registration failed:", error);
      }
    };

    register();
  }, []);

  return null;
}
