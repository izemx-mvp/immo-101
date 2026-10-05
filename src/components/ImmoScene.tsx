import * as React from "react";
import { cn } from "@/lib/utils";

export type SceneLevel = "hero" | "ambient" | "off";

/** Business-themed animated background: blueprint plans, rising city blocks,
 *  Rabat region pins, message bubbles flowing into a "Lead qualifié" node, floating keys. */
export function ImmoScene({ level, className }: { level: SceneLevel; className?: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    if (level === "off") return;
    const c = ref.current!; const ctx = c.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0, raf = 0, running = true, t0 = performance.now();
    const mouse = { x: 0, y: 0 };
    const resize = () => { W = c.clientWidth; H = c.clientHeight; c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); window.addEventListener("resize", resize);
    const onMove = (e: MouseEvent) => { mouse.x = e.clientX / window.innerWidth - 0.5; mouse.y = e.clientY / window.innerHeight - 0.5; };
    window.addEventListener("mousemove", onMove);
    const onVis = () => { running = !document.hidden; if (running) { t0 = performance.now() - last; loop(); } };
    document.addEventListener("visibilitychange", onVis);
    const css = getComputedStyle(document.documentElement);
    const primary = css.getPropertyValue("--primary").trim() || "#e62555";
    const isDark = document.documentElement.classList.contains("dark");
    const line = isDark ? "rgba(255,255,255,0.10)" : "rgba(26,24,24,0.08)";
    const ink = isDark ? "rgba(255,255,255,0.5)" : "rgba(26,24,24,0.35)";
    const amp = level === "hero" ? 1 : 0.55;

    // Blueprint floor plans
    const plans = Array.from({ length: 3 }, (_, i) => ({ x: 0.1 + i * 0.32, y: 0.15 + (i % 2) * 0.45, born: i * 4, s: 120 + i * 20 }));
    const planSegs = (s: number): [number, number, number, number][] => [[0, 0, s, 0], [s, 0, s, s * 0.7], [s, s * 0.7, 0, s * 0.7], [0, s * 0.7, 0, 0], [s * 0.45, 0, s * 0.45, s * 0.35], [s * 0.45, s * 0.5, s * 0.45, s * 0.7], [0, s * 0.35, s * 0.3, s * 0.35], [s * 0.45, s * 0.35, s, s * 0.35]];
    // City blocks
    const blocks = Array.from({ length: 14 }, (_, i) => ({ x: i / 14, w: 22 + ((i * 37) % 30), h: 40 + ((i * 53) % 140), d: i * 0.35, kind: i % 3 }));
    // Pins (Rabat region)
    const pins = [{ n: "Salé", x: 0.74, y: 0.22 }, { n: "Rabat", x: 0.7, y: 0.32 }, { n: "Témara", x: 0.64, y: 0.45 }, { n: "Skhirat", x: 0.58, y: 0.58 }];
    // Bubbles
    const node = { x: 0.82, y: 0.7 };
    const bubbles = Array.from({ length: level === "hero" ? 9 : 6 }, (_, i) => ({ off: i / 6, ch: i % 2, sy: 0.3 + ((i * 0.17) % 0.6) }));
    // Keys/sparkles
    const sparks = Array.from({ length: 26 }, (_, i) => ({ x: (i * 0.137) % 1, y: (i * 0.291) % 1, z: 0.3 + ((i * 0.07) % 0.7), key: i % 6 === 0 }));
    let last = 0;

    const drawKey = (x: number, y: number, s: number, a: number) => {
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a; ctx.strokeStyle = primary; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.moveTo(s, 0); ctx.lineTo(s * 3.5, 0); ctx.moveTo(s * 2.6, 0); ctx.lineTo(s * 2.6, s); ctx.moveTo(s * 3.3, 0); ctx.lineTo(s * 3.3, s * 0.8); ctx.stroke(); ctx.restore();
    };

    function frame(t: number) {
      ctx.clearRect(0, 0, W, H);
      // b) blueprint grid
      ctx.strokeStyle = line; ctx.lineWidth = 1;
      const g = 48, ox = mouse.x * 8, oy = mouse.y * 8;
      ctx.beginPath(); for (let x = (ox % g); x < W; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = (oy % g); y < H; y += g) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
      // plans drawing line by line
      plans.forEach((p, i) => {
        const cyc = 12, lt = ((t / 1000 + p.born) % cyc) / cyc;
        if (lt < 0.02) { p.x = 0.05 + ((p.x * 7.3 + i * 0.21) % 0.6); p.y = 0.08 + ((p.y * 5.1 + 0.3) % 0.5); }
        const segs = planSegs(p.s), prog = Math.min(1, lt / 0.6) * segs.length, fade = lt > 0.8 ? 1 - (lt - 0.8) / 0.2 : 1;
        ctx.save(); ctx.translate(p.x * W, p.y * H); ctx.strokeStyle = ink; ctx.globalAlpha = 0.6 * fade * amp; ctx.lineWidth = 1.4;
        segs.forEach((s, k) => { const f = Math.max(0, Math.min(1, prog - k)); if (f <= 0) return; ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[0] + (s[2] - s[0]) * f, s[1] + (s[3] - s[1]) * f); ctx.stroke(); });
        if (prog > segs.length - 1) { ctx.beginPath(); ctx.arc(p.s * 0.45, p.s * 0.35, p.s * 0.15, 0, Math.PI / 2); ctx.stroke(); }
        ctx.restore();
      });
      // c) isometric city
      const base = H - 10;
      blocks.forEach((b, i) => {
        const rise = Math.min(1, Math.max(0, (t / 1000 - b.d) / 3));
        const h = b.h * (0.5 + 0.5 * Math.sin(t / 9000 + i)) * rise * amp + 10, x = b.x * W * 0.6 + mouse.x * -12, w = b.w;
        ctx.globalAlpha = 0.5 * amp;
        ctx.fillStyle = isDark ? "rgba(255,255,255,0.05)" : "rgba(26,24,24,0.05)"; ctx.fillRect(x, base - h, w, h);
        ctx.fillStyle = isDark ? "rgba(255,255,255,0.03)" : "rgba(26,24,24,0.03)";
        ctx.beginPath(); ctx.moveTo(x + w, base - h); ctx.lineTo(x + w + 10, base - h - 6); ctx.lineTo(x + w + 10, base - 6); ctx.lineTo(x + w, base); ctx.fill();
        ctx.strokeStyle = line; ctx.strokeRect(x, base - h, w, h);
        for (let wy = base - h + 8; wy < base - 6; wy += 12) for (let wx = x + 5; wx < x + w - 5; wx += 8) {
          const lit = Math.sin(wx * 13.1 + wy * 7.7 + Math.floor(t / 1500 + i)) > 0.55;
          if (lit) { ctx.fillStyle = "rgba(255,190,90,0.75)"; ctx.fillRect(wx, wy, 3, 4); }
        }
      });
      ctx.globalAlpha = 1;
      // d) Rabat map + pins
      ctx.save(); ctx.globalAlpha = 0.7 * amp; ctx.strokeStyle = ink; ctx.setLineDash([4, 6]); ctx.beginPath();
      ctx.moveTo(W * 0.78, H * 0.1); ctx.bezierCurveTo(W * 0.72, H * 0.3, W * 0.62, H * 0.45, W * 0.52, H * 0.7); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = primary; ctx.globalAlpha = 0.25 * amp; ctx.beginPath(); ctx.moveTo(W * 0.7, H * 0.32); ctx.quadraticCurveTo(W * 0.76, H * 0.26, W * 0.74, H * 0.22); ctx.stroke(); ctx.restore();
      pins.forEach((p, i) => {
        const pt = ((t / 1000 + i * 1.3) % 6) / 6, drop = Math.min(1, pt * 5);
        const x = p.x * W + mouse.x * 10, y = p.y * H - (1 - drop) * 30;
        ctx.globalAlpha = 0.9 * amp; ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = primary; ctx.globalAlpha = (1 - pt) * 0.6 * amp; ctx.beginPath(); ctx.arc(x, p.y * H, 4 + pt * 22, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.7 * amp; ctx.fillStyle = ink; ctx.font = "11px Inter Tight, sans-serif"; ctx.fillText(p.n, x + 8, y + 4);
      });
      // e) message bubbles → Lead qualifié node (signature)
      const nx = node.x * W, ny = node.y * H;
      bubbles.forEach((b) => {
        const k = ((t / 7000 + b.off) % 1);
        const sx = W * 0.05, sy = b.sy * H, cx = W * 0.45, cy = sy - 120;
        const x = (1 - k) ** 2 * sx + 2 * (1 - k) * k * cx + k * k * nx, y = (1 - k) ** 2 * sy + 2 * (1 - k) * k * cy + k * k * ny;
        ctx.globalAlpha = Math.sin(k * Math.PI) * 0.85 * amp;
        ctx.fillStyle = b.ch ? (isDark ? "#2a2626" : "#fff") : "rgba(37,211,102,0.9)";
        ctx.beginPath(); ctx.roundRect(x - 13, y - 9, 26, 18, 8); ctx.fill();
        ctx.strokeStyle = b.ch ? primary : "#fff"; ctx.lineWidth = 1.4; ctx.beginPath();
        if (b.ch) { ctx.rect(x - 6, y - 4, 12, 8); ctx.moveTo(x - 6, y - 4); ctx.lineTo(x, y + 1); ctx.lineTo(x + 6, y - 4); }
        else { ctx.moveTo(x - 6, y); ctx.lineTo(x - 3, y + 3); ctx.lineTo(x + 1, y - 2); ctx.moveTo(x - 1, y + 1); ctx.lineTo(x + 1, y + 3); ctx.lineTo(x + 6, y - 3); }
        ctx.stroke();
      });
      const pulse = 0.5 + 0.5 * Math.sin(t / 600);
      ctx.globalAlpha = (0.15 + pulse * 0.15) * amp; ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(nx, ny, 26 + pulse * 6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.95 * amp; ctx.fillStyle = primary; ctx.beginPath(); ctx.roundRect(nx - 52, ny - 13, 104, 26, 13); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "600 11px Inter Tight, sans-serif"; ctx.textAlign = "center"; ctx.fillText("✓ Lead qualifié", nx, ny + 4); ctx.textAlign = "left";
      // f) keys & sparkles parallax
      sparks.forEach((s, i) => {
        const x = ((s.x + t / 90000 * s.z) % 1) * W + mouse.x * 40 * s.z, y = (s.y * H + Math.sin(t / 2000 + i) * 10) + mouse.y * 30 * s.z;
        if (s.key) drawKey(x, y, 4 * s.z + 2, 0.35 * amp);
        else { ctx.globalAlpha = (0.3 + 0.4 * Math.sin(t / 700 + i)) * amp; ctx.fillStyle = "rgba(255,200,120,1)"; ctx.beginPath(); ctx.arc(x, y, 1.4 * s.z + 0.4, 0, Math.PI * 2); ctx.fill(); }
      });
      ctx.globalAlpha = 1;
    }
    function loop() { if (!running) return; last = performance.now() - t0; frame(last); raf = requestAnimationFrame(loop); }
    if (reduced) frame(8000); else loop();
    return () => { running = false; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMove); document.removeEventListener("visibilitychange", onVis); };
  }, [level]);

  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 -z-0 overflow-hidden transition-opacity duration-700", level === "off" ? "opacity-0" : level === "ambient" ? "opacity-60" : "opacity-100", className)}>
      <div className="absolute inset-0 bg-dusk" style={{ animation: level === "off" ? undefined : "pulse 14s ease-in-out infinite" }} />
      {level !== "off" && <canvas ref={ref} className="absolute inset-0 h-full w-full" />}
    </div>
  );
}
