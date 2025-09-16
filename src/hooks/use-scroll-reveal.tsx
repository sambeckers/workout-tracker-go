import { useEffect } from "react";

type Options = {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
  hiddenClass?: string;
  visibleClass?: string;
};

// Simple IntersectionObserver-based reveal-on-scroll hook
// Usage: add data-reveal and optional data-reveal-delay to elements
export function useScrollReveal({
  root = null,
  rootMargin = "0px",
  threshold = 0.15,
  once = true,
  hiddenClass = "reveal-hidden",
  visibleClass = "reveal-visible",
}: Options = {}) {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]")
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            const delay = el.dataset.revealDelay
              ? parseInt(el.dataset.revealDelay, 10)
              : 0;
            if (delay) {
              setTimeout(() => {
                el.classList.add(visibleClass);
                el.classList.remove(hiddenClass);
              }, delay);
            } else {
              el.classList.add(visibleClass);
              el.classList.remove(hiddenClass);
            }
            if (once) observer.unobserve(el);
          } else if (!once) {
            el.classList.remove(visibleClass);
            el.classList.add(hiddenClass);
          }
        });
      },
      { root, rootMargin, threshold }
    );

    elements.forEach((el) => {
      el.classList.add(hiddenClass);
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [root, rootMargin, threshold, once, hiddenClass, visibleClass]);
}

// Utility to attach basic CSS via a style tag if needed (keeps it self-contained)
export function ScrollRevealStyles() {
  return (
    <style>{`
      .reveal-hidden { opacity: 0; transform: translateY(24px); }
      .reveal-visible { opacity: 1; transform: none; transition: opacity 700ms ease, transform 700ms ease; }
    `}</style>
  );
}
