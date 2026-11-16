import { lazy, Suspense, useEffect, useRef } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { christmasScene, clearSnow, climberPose, depositSnow } from "@/lib/christmas-simulation";

const SnowClimber = lazy(() => import("./SnowClimber"));

export function ChristmasSnow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let width = 0;
    let height = 0;
    let previous = 0;
    const flakes = Array.from({ length: 48 }, () => ({
      x: Math.random(), y: Math.random(), size: 1.5 + Math.random() * 2.5,
      speed: 25 + Math.random() * 35, phase: Math.random() * Math.PI * 2,
    }));
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * scale;
      canvas.height = height * scale;
      context.setTransform(scale, 0, 0, scale, 0, 0);
    };
    const colors = getComputedStyle(document.documentElement);
    const snow = colors.getPropertyValue("--snow").trim();
    const edge = colors.getPropertyValue("--snow-edge").trim();
    let surfaces: HTMLElement[] = [];
    const measure = () => {
      surfaces = Array.from(document.querySelectorAll<HTMLElement>("header .snow-logo, header .snow-letter, .snow-headline .snow-letter"));
      christmasScene.surfaces = surfaces.map((el, i) => {
        const r = el.getBoundingClientRect();
        const font = parseFloat(getComputedStyle(el).fontSize);
        return { x: r.x, y: r.y + (el.classList.contains("snow-logo") ? 0 : font * 0.16), width: r.width, depth: christmasScene.surfaces[i]?.depth ?? 2.5 };
      });
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    void document.fonts.ready.then(measure);
    const draw = (time: number) => {
      const delta = Math.min((time - previous) / 1000, 0.05);
      previous = time;
      context.clearRect(0, 0, width, height);
      if (!document.hidden && !motion.matches) {
        christmasScene.time += delta;
        const visible = christmasScene.surfaces.filter(s => s.y > 85 && s.y < height - 20);
        christmasScene.pose = climberPose(christmasScene.time, visible);
        const pose = christmasScene.pose;
        christmasScene.surfaces.forEach((surface, i) => {
          surface.depth = depositSnow(surface.depth, delta);
          if (pose.sweeping && Math.abs(surface.y - pose.y) < 12 && Math.abs(surface.x + surface.width / 2 - pose.x) < 48) {
            surface.depth = clearSnow(surface.depth, delta);
          }
          surfaces[i]?.style.setProperty("--snow-depth", `${surface.depth}px`);
        });
      }
      if (!motion.matches && !document.hidden) {
        for (const flake of flakes) {
          flake.y += delta * flake.speed / height;
          if (flake.y > 1.02) flake.y = -0.02;
          const x = flake.x * width + Math.sin(time / 2000 + flake.phase) * 18;
          const y = flake.y * height;
          context.fillStyle = snow;
          context.strokeStyle = edge;
          context.lineWidth = 0.6;
          context.beginPath();
          context.arc(x, y, flake.size, 0, Math.PI * 2);
          context.fill();
          context.stroke();
        }
      }
      frame = requestAnimationFrame(draw);
    };
    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, []);
  return <canvas ref={canvasRef} className="christmas-snowfall" aria-hidden="true" />;
}

export function SnowText({ children }: { children: string }) {
  return (
    <span aria-label={children}>
      {children.split(" ").map((word, index) => (
        <span key={index}>
          {index > 0 && " "}
          <span className="snow-word" aria-hidden="true">
            {Array.from(word).map((letter, i) => <span key={i} className="snow-letter">{letter}</span>)}
          </span>
        </span>
      ))}
    </span>
  );
}

export function OlafSweeper() {
  return <ClientOnly fallback={null}><Suspense fallback={null}><SnowClimber /></Suspense></ClientOnly>;
}
