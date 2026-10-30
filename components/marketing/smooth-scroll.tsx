"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.1,
      smoothWheel: true,
      stopInertiaOnNavigate: true,
    });

    function handleAnchorClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const eventTarget = event.target;
      if (!(eventTarget instanceof Element)) return;

      const link = eventTarget.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;

      const targetUrl = new URL(link.href);
      if (
        targetUrl.origin !== window.location.origin ||
        targetUrl.pathname !== window.location.pathname ||
        targetUrl.search !== window.location.search ||
        !targetUrl.hash
      ) {
        return;
      }

      const targetId = decodeURIComponent(targetUrl.hash.slice(1));
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target, { duration: 1.1 });
      if (window.location.hash !== targetUrl.hash) {
        window.history.pushState(null, "", targetUrl.href);
      }
    }

    document.addEventListener("click", handleAnchorClick, true);

    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
      lenis.destroy();
    };
  }, []);

  return null;
}
