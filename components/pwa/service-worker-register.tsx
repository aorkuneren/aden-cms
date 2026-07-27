"use client";

import { useEffect } from "react";

const SERVICE_WORKER_PATH = "/sw.js";

function isHostingerPreviewHost(hostname: string) {
  return hostname.endsWith(".hostingersite.com");
}

async function clearServiceWorkersAndCaches() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    // Domain transfer / Hostinger preview: SW offline fallback gerçek 503'ü gizler.
    if (isHostingerPreviewHost(window.location.hostname)) {
      void clearServiceWorkersAndCaches();
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          SERVICE_WORKER_PATH,
          {
            scope: "/",
          }
        );

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
              installingWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      } catch (error) {
        // Silent in production UI; keep only browser console output for diagnostics.
        console.error("Service worker registration failed:", error);
      }
    };

    if (document.readyState === "complete") {
      void registerServiceWorker();
      return;
    }

    window.addEventListener("load", () => void registerServiceWorker(), {
      once: true,
    });
  }, []);

  return null;
}
