"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const STALE_MS = 5 * 60_000;

/**
 * The iPad home-screen app can sit in the background overnight and come back
 * showing yesterday ("Today is done.", last night's Bow). When the page
 * returns after five minutes or more, or is restored from the back/forward
 * cache, fetch fresh server data so what she sees is true. Renders nothing.
 */
export function ResumeRefresh() {
  const router = useRouter();
  useEffect(() => {
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt && Date.now() - hiddenAt >= STALE_MS) router.refresh();
      hiddenAt = 0;
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) router.refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [router]);
  return null;
}
