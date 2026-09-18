import useScrollReveal from "../hooks/useScrollReveal.js";

/** Wraps children in a div that fades/slides in the first time it scrolls into view. */
export default function Reveal({
  as: Tag = "div",
  className = "",
  children,
  delay = 0,
}) {
  const [ref, visible] = useScrollReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}
