import { lazy, Suspense, useEffect, useRef } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { christmasScene, clearSnow, climberPose, depositSnow } from "@/lib/christmas-simulation";

const SnowClimber = lazy(() => import("./SnowClimber"));

export function ChristmasSnow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const letterRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    // Letter snow lives on a page-anchored layer so it scrolls natively with the letters (no lag).
    const letterCanvas = letterRef.current;
    const letterContext = letterCanvas?.getContext("2d");
    if (!canvas || !context || !letterCanvas || !letterContext) return;
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
    const contours = new Map<HTMLElement, { x: number; y: number }[]>();
    let surfaces: HTMLElement[] = [];
    let headlineSurfaces: number[] = [];
    let pageRects: { x: number; y: number }[] = [];
    let layerWidth = 0;
    let layerHeight = 0;
    const measure = () => {
      surfaces = Array.from(document.querySelectorAll<HTMLElement>("header .snow-logo, header .snow-letter, .snow-headline .snow-letter"));
      christmasScene.surfaces = surfaces.map((el, i) => {
        const viewportRect = el.getBoundingClientRect();
        // Page coordinates: independent of scroll position.
        const r = { x: viewportRect.x + window.scrollX, y: viewportRect.y + window.scrollY, width: viewportRect.width, height: viewportRect.height };
        const style = getComputedStyle(el);
        const font = parseFloat(style.fontSize);
        if (!el.classList.contains("snow-logo")) {
          const mask = document.createElement("canvas");
          mask.width = Math.ceil(r.width + 12); mask.height = Math.ceil(font * 1.6);
          const paint = mask.getContext("2d");
          if (paint) {
            paint.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            paint.fillStyle = snow;
            paint.fillText(el.textContent ?? "", 4, font);
            const pixels = paint.getImageData(0, 0, mask.width, mask.height).data;
            const points: { x: number; y: number }[] = [];
            for (let x = 0; x < mask.width; x++) {
              for (let y = 0; y < mask.height; y++) {
                if ((pixels[(y * mask.width + x) * 4 + 3] ?? 0) > 100) {
                  points.push({ x: x - 4, y: y + (r.height - font) / 2 - font * 0.18 }); break;
                }
              }
            }
            contours.set(el, points);
          }
        }
        return { x: r.x, y: r.y + (el.classList.contains("snow-logo") ? 0 : font * 0.16), width: r.width, depth: christmasScene.surfaces[i]?.depth ?? 3.5 };
      });
      pageRects = christmasScene.surfaces.map((_, i) => {
        const r = surfaces[i]!.getBoundingClientRect();
        return { x: r.x + window.scrollX, y: r.y + window.scrollY };
      });
      headlineSurfaces = surfaces.flatMap((el, i) => (el.closest(".snow-headline") ? [i] : []));
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      layerWidth = document.documentElement.clientWidth;
      layerHeight = Math.ceil(Math.max(0, ...pageRects.map(r => r.y)) + 120);
      letterCanvas.style.width = `${layerWidth}px`;
      letterCanvas.style.height = `${layerHeight}px`;
      letterCanvas.width = layerWidth * scale;
      letterCanvas.height = layerHeight * scale;
      letterContext.setTransform(scale, 0, 0, scale, 0, 0);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("resize", measure);
    void document.fonts.ready.then(measure);
    const draw = (time: number) => {
      const delta = Math.min((time - previous) / 1000, 0.05);
      previous = time;
      context.clearRect(0, 0, width, height);
      letterContext.clearRect(0, 0, layerWidth, layerHeight);
      if (!document.hidden && !motion.matches) {
        christmasScene.time += delta;
        // Climb only the headline letters, in page coordinates, so scrolling never changes the route.
        const route = headlineSurfaces.map(i => christmasScene.surfaces[i]!).filter(Boolean);
        christmasScene.pose = climberPose(christmasScene.time, route);
        const pose = christmasScene.pose;
        christmasScene.surfaces.forEach((surface, i) => {
          surface.depth = depositSnow(surface.depth, delta);
          if (pose.sweeping && Math.abs(surface.y - pose.y) < 12 && Math.abs(surface.x + surface.width / 2 - pose.x) < 48) {
            surface.depth = clearSnow(surface.depth, delta);
          }
          surfaces[i]?.style.setProperty("--snow-depth", `${surface.depth}px`);
        });
      }
      surfaces.forEach((el, i) => {
        const surface = christmasScene.surfaces[i];
        if (!surface || el.classList.contains("snow-logo")) return;
        const points = contours.get(el) ?? [];
        const r = pageRects[i];
        if (!r) return;
        const context = letterContext;
        context.fillStyle = snow; context.strokeStyle = edge; context.lineWidth = 0.5;
        if (surface.depth < 0.2) return;
        const segments: typeof points[] = [];
        for (const point of points) {
          const segment = segments[segments.length - 1];
          const last = segment?.[segment.length - 1];
          if (!segment || !last || point.x - last.x > 2 || Math.abs(point.y - last.y) > 8) {
            segments.push([point]);
          } else {
            segment.push(point);
          }
        }
        for (const segment of segments) {
          if (segment.length < 2) continue;
          context.beginPath();
          segment.forEach((point, j) => {
            const drift = surface.depth * (0.75 + 0.18 * Math.sin(point.x * 0.13 + i) + 0.07 * Math.sin(point.x * 0.31));
            const x = r.x + point.x;
            const y = r.y + point.y - drift;
            if (j === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
          });
          for (let j = segment.length - 1; j >= 0; j--) {
            const point = segment[j];
            if (point) context.lineTo(r.x + point.x, r.y + point.y + surface.depth * 0.18);
          }
          context.closePath();
          context.fill(); context.stroke();
        }
      });
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
      observer.disconnect();
    };
  }, []);
  return (
    <>
      <canvas ref={letterRef} className="christmas-letter-snow" aria-hidden="true" />
      <canvas ref={canvasRef} className="christmas-snowfall" aria-hidden="true" />
    </>
  );
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
