import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { christmasScene } from "@/lib/christmas-simulation";

export default function SnowClimber() {
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};
    void import("three").then((T) => {
      if (disposed) return;
      let renderer: InstanceType<typeof T.WebGLRenderer>;
      try { renderer = new T.WebGLRenderer({ alpha: true, antialias: true }); }
      catch { return; }
      renderer.setSize(140, 180);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0, 0);
      host.appendChild(renderer.domElement);
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(35, 140 / 180, 0.1, 100);
      camera.position.set(0, 1.65, 7);
      camera.lookAt(0, 1.65, 0);
      const css = getComputedStyle(document.documentElement);
      const token = (name: string) => {
        const swatch = document.createElement("canvas");
        swatch.width = swatch.height = 1;
        const paint = swatch.getContext("2d");
        if (!paint) return new T.Color();
        paint.fillStyle = css.getPropertyValue(name).trim();
        paint.fillRect(0, 0, 1, 1);
        const pixel = paint.getImageData(0, 0, 1, 1).data;
        return new T.Color().setRGB((pixel[0] ?? 0) / 255, (pixel[1] ?? 0) / 255, (pixel[2] ?? 0) / 255, T.SRGBColorSpace);
      };
      const snowColor = token("--snow");
      const twigColor = token("--olaf-twig");
      const coalColor = token("--foreground");
      const carrotColor = token("--olaf-carrot");
      const textureCanvas = document.createElement("canvas");
      textureCanvas.width = textureCanvas.height = 128;
      const ctx = textureCanvas.getContext("2d");
      const snowEdgeStyle = token("--snow-edge").getStyle();
      if (ctx) {
        ctx.fillStyle = snowColor.getStyle(); ctx.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 2000; i++) {
          ctx.globalAlpha = Math.random() * 0.1;
          ctx.fillStyle = snowEdgeStyle;
          ctx.fillRect(Math.random() * 128, Math.random() * 128, 1, 1);
        }
      }
      const texture = new T.CanvasTexture(textureCanvas);
      texture.colorSpace = T.SRGBColorSpace;
      const snow = new T.MeshStandardMaterial({ color: snowColor, map: texture, roughness: 0.88 });
      const twig = new T.MeshStandardMaterial({ color: twigColor, roughness: 0.9 });
      const coal = new T.MeshStandardMaterial({ color: coalColor, roughness: 0.65 });
      const carrot = new T.MeshStandardMaterial({ color: carrotColor, roughness: 0.8 });
      const body = new T.Group(); scene.add(body);
      const ball = (parent: InstanceType<typeof T.Group>, x: number, y: number, z: number, sx: number, sy: number, sz: number, material = snow) => {
        const mesh = new T.Mesh(new T.SphereGeometry(1, 24, 16), material);
        mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); parent.add(mesh); return mesh;
      };
      const stick = (parent: InstanceType<typeof T.Group>, a: number[], b: number[], radius = 0.025) => {
        const from = new T.Vector3(a[0], a[1], a[2]);
        const to = new T.Vector3(b[0], b[1], b[2]);
        const direction = to.clone().sub(from);
        const mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, direction.length(), 8), twig);
        mesh.position.copy(from.add(to).multiplyScalar(0.5));
        mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize()); parent.add(mesh);
      };
      ball(body, 0, 0.62, 0, 0.56, 0.59, 0.44);
      ball(body, 0, 1.39, 0, 0.38, 0.43, 0.33);
      const head = new T.Group(); head.position.y = 2.19; body.add(head);
      ball(head, 0, 0, 0, 0.43, 0.63, 0.34);
      ball(head, -0.16, 0.17, 0.3, 0.14, 0.19, 0.09);
      ball(head, 0.16, 0.17, 0.3, 0.14, 0.19, 0.09);
      ball(head, -0.13, 0.16, 0.39, 0.052, 0.075, 0.026, coal);
      ball(head, 0.13, 0.16, 0.39, 0.052, 0.075, 0.026, coal);
      const nose = new T.Mesh(new T.ConeGeometry(0.115, 0.65, 18), carrot);
      nose.rotation.x = Math.PI / 2; nose.position.set(0, -0.04, 0.6); head.add(nose);
      ball(head, 0, -0.29, 0.3, 0.23, 0.14, 0.05, coal);
      const tooth = new T.Mesh(new T.BoxGeometry(0.18, 0.13, 0.05), snow);
      tooth.position.set(0, -0.23, 0.37); head.add(tooth);
      for (let i = 0; i < 3; i++) stick(head, [(i - 1) * 0.08, 0.53, 0], [(i - 1) * 0.19, 0.87 + (i % 2) * 0.1, 0]);
      for (const y of [0.7, 1.26, 1.5]) ball(body, 0, y, y < 1 ? 0.43 : 0.31, 0.065, 0.07, 0.035, coal);
      const feet = [-1, 1].map(side => ball(body, side * 0.29, 0.12, 0.17, 0.25, 0.14, 0.31));
      const arms = [-1, 1].map(side => {
        const arm = new T.Group(); arm.position.set(side * 0.3, 1.56, 0); body.add(arm);
        stick(arm, [0, 0, 0], [side * 0.62, 0.22, 0]);
        for (let i = 0; i < 3; i++) stick(arm, [side * 0.62, 0.22, 0], [side * (0.8 + i * 0.04), 0.17 + i * 0.11, 0]);
        return arm;
      });
      scene.add(new T.HemisphereLight(token("--snow"), token("--snow-edge"), 2));
      const key = new T.DirectionalLight(token("--snow"), 3); key.position.set(-3, 5, 5); scene.add(key);
      const rim = new T.DirectionalLight(token("--holiday-gold"), 0.8); rim.position.set(3, 3, -2); scene.add(rim);
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      let frame = 0;
      const draw = () => {
        if (disposed) return;
        const { pose, time } = christmasScene;
        // Page coordinates: the snowman stays with the headline while the page scrolls.
        const headline = document.querySelector(".snow-headline")?.getBoundingClientRect();
        const x = motion.matches ? (headline?.right ?? 200) + window.scrollX - 75 : pose.x;
        const y = motion.matches ? (headline?.bottom ?? 350) + window.scrollY : pose.y;
        host.style.transform = `translate3d(${Math.max(0, Math.min(document.documentElement.clientWidth - 130, x - 65))}px, ${Math.max(80, y - 148)}px, 0)`;
        const wave = Math.sin(time * (pose.climbing ? 8 : 5));
        body.rotation.y = pose.facing * 0.32;
        body.rotation.z = motion.matches ? 0 : wave * (pose.climbing ? 0.09 : 0.035);
        arms.forEach((arm, i) => { arm.rotation.z = motion.matches ? 0 : (i ? 1 : -1) * (pose.climbing ? wave * 0.8 : 0.15) + (pose.sweeping && i === 1 ? wave * 0.65 : 0); });
        feet.forEach((foot, i) => { foot.position.y = 0.12 + (pose.climbing && !motion.matches ? Math.max(0, Math.sin(time * 8 + i * Math.PI)) * 0.2 : 0); });
        if (!document.hidden) renderer.render(scene, camera);
        host.dataset["sceneReady"] = "true";
        frame = requestAnimationFrame(draw);
      };
      draw();
      cleanup = () => {
        cancelAnimationFrame(frame);
        scene.traverse(object => { if (object instanceof T.Mesh) object.geometry.dispose(); });
        [snow, twig, coal, carrot].forEach(m => m.dispose());
        texture.dispose(); renderer.dispose(); renderer.domElement.remove();
      };
    });
    return () => { disposed = true; cleanup(); };
  }, []);
  return createPortal(<div ref={hostRef} className="snow-climber-3d" role="img" aria-label="A 3D snowman climbing between letters and brushing snow away" />, document.body);
}