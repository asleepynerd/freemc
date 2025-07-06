"use client";
import { useEffect, useRef } from "react";

const HEART_COLORS = ["#b3baff", "#ffb3d1", "#b3ffd1", "#b3e0ff", "#ffd1b3"];
const NUM_HEARTS = 24;

function randomBetween(a: number, b: number) {
  return Math.random() * (b - a) + a;
}

export default function AnimatedBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const hearts = Array.from(ref.current.children) as HTMLDivElement[];
    hearts.forEach((heart, i) => {
      const duration = randomBetween(8, 18);
      const delay = randomBetween(0, 10);
      heart.animate(
        [
          { transform: `translateY(0px) scale(${randomBetween(0.7, 1.2)})`, opacity: 0.7 },
          { transform: `translateY(-60vh) scale(${randomBetween(0.7, 1.2)})`, opacity: 0.2 },
        ],
        { duration: duration * 1000, delay: delay * 1000, iterations: Infinity, direction: "alternate" }
      );
    });
  }, []);

  return (
    <div ref={ref} style={{
      position: "fixed",
      inset: 0,
      zIndex: 0,
      pointerEvents: "none",
      overflow: "hidden",
    }}>
      {Array.from({ length: NUM_HEARTS }).map((_, i) => {
        const left = randomBetween(2, 98);
        const top = randomBetween(10, 90);
        const size = randomBetween(16, 32);
        const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              opacity: 0.18,
              filter: "blur(0.5px)",
              transform: `translateY(0px) scale(${randomBetween(0.7, 1.2)})`,
            }}
          >
            <svg width={size} height={size} viewBox="0 0 32 29" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.6 2.6c-2.6 0-4.9 1.7-5.6 4.1C16.3 4.3 14 2.6 11.4 2.6 7.5 2.6 4.4 5.7 4.4 9.6c0 7.1 11.6 15.8 12.1 16.2.2.1.5.1.7 0 .5-.4 12.1-9.1 12.1-16.2 0-3.9-3.1-7-7-7z" fill={color} />
            </svg>
          </div>
        );
      })}
    </div>
  );
} 