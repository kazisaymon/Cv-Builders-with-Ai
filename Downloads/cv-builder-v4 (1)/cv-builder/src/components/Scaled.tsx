"use client";
import { useEffect, useRef, useState } from "react";

// Scales a fixed-width (794px) A4 page to fit its container. Print resets the transform via CSS.
export default function Scaled({ children, width = 794, height = 1123 }: { children: React.ReactNode; width?: number; height?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(Math.min(1, el.clientWidth / width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={box} className="w-full">
      <div className="print-root" style={{ width: width * k, height: height * k }}>
        <div className="print-root origin-top-left shadow-xl" style={{ transform: `scale(${k})`, width }}>{children}</div>
      </div>
    </div>
  );
}
