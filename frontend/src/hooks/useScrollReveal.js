import { useEffect, useRef, useState } from "react";

/**
 * Tiny IntersectionObserver hook: returns a ref to attach to an element and
 * a boolean that flips to true once the element scrolls into view. Used to
 * fade/slide sections in as the visitor scrolls down the landing page.
 */
export default function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}
