import { useEffect, useRef } from "react";

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
    const draw = (time: number) => {
      const delta = Math.min((time - previous) / 1000, 0.05);
      previous = time;
      context.clearRect(0, 0, width, height);
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
  return (
    <div className="olaf-sweeper" role="img" aria-label="Olaf sweeping away the snow">
      <svg viewBox="0 0 180 220" className="h-full w-full" aria-hidden="true">
        <g className="olaf-body">
          <path d="M74 91 28 72m5 2-8-13m8 13-15 1" className="olaf-twig" />
          <ellipse cx="82" cy="190" rx="32" ry="29" className="olaf-snow" />
          <ellipse cx="83" cy="144" rx="24" ry="27" className="olaf-snow" />
          <ellipse cx="64" cy="214" rx="18" ry="6" className="olaf-snow" />
          <ellipse cx="100" cy="214" rx="18" ry="6" className="olaf-snow" />
          <path d="M60 35Q51 52 61 80L69 103Q83 116 97 103L105 79Q118 50 103 35Q80 23 60 35Z" className="olaf-snow" />
          <path d="M76 32 70 12m14 18 3-24m3 25 12-17" className="olaf-twig" />
          <ellipse cx="73" cy="53" rx="9" ry="12" className="olaf-snow" />
          <ellipse cx="94" cy="53" rx="9" ry="12" className="olaf-snow" />
          <ellipse cx="76" cy="54" rx="3" ry="5" className="olaf-coal" />
          <ellipse cx="92" cy="54" rx="3" ry="5" className="olaf-coal" />
          <path d="M62 39q9-7 17-2m8 0q9-5 17 2" className="olaf-twig" />
          <path d="M80 62Q86 56 91 65L123 72 86 76Q79 73 80 62Z" className="olaf-carrot" />
          <path d="M65 79Q85 94 102 79Q99 104 83 102Q70 101 65 79Z" className="olaf-coal" />
          <path d="M77 84h15v9H77Z" className="olaf-tooth" />
          <circle cx="83" cy="135" r="4" className="olaf-coal" />
          <circle cx="83" cy="151" r="4" className="olaf-coal" />
          <circle cx="82" cy="184" r="5" className="olaf-coal" />
          <g className="olaf-wiping-arm">
            <path d="m105 116 37-17m-5 2 7-13m-7 13 15 2" className="olaf-twig" />
            <path d="m146 83-17 100" className="olaf-broom-handle" />
            <path d="m119 181 20 3 8 25-41-6Z" className="olaf-broom" />
            <path d="m120 187-8 14m17-12-4 15m10-14 5 16" className="olaf-broom-detail" />
          </g>
        </g>
        <g className="olaf-snow-spray">
          <circle cx="143" cy="210" r="3" /><circle cx="154" cy="198" r="2" /><circle cx="163" cy="208" r="3" />
        </g>
      </svg>
      <span className="olaf-snowbank" aria-hidden="true" />
    </div>
  );
}