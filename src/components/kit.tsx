import * as React from "react";
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import { Home, KeyRound, Building2, Landmark, TrendingUp, HelpCircle, MessageCircle, Mail, Globe, Instagram, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEMP_LABEL, TYPE_LABEL, STATUS_LABEL, STATUS_TONE, SOURCE_LABEL, AI_DISCLAIMER, type LeadType, type Source, type Status, type Temp, type Tone } from "@/lib/domain";

const TONE: Record<Tone, string> = {
  success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info", neutral: "bg-muted text-muted-foreground", primary: "bg-primary-soft text-primary", cold: "bg-cold-soft text-cold",
};
const DOT: Record<Tone, string> = { success: "bg-success", warning: "bg-warning", danger: "bg-danger", info: "bg-info", neutral: "bg-muted-foreground", primary: "bg-primary", cold: "bg-cold" };

export function Pill({ tone = "neutral", children, dot = true, className, sub }: { tone?: Tone; children: React.ReactNode; dot?: boolean; className?: string; sub?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", TONE[tone], className)}>
      {dot && <span className={cn("size-1.5 rounded-full", DOT[tone])} aria-hidden />}
      {children}
      {sub && <span className="opacity-70 font-normal">· {sub}</span>}
    </span>
  );
}
export const StatusBadge = ({ s, sub }: { s: Status; sub?: string }) => <Pill tone={STATUS_TONE[s]} sub={sub}>{STATUS_LABEL[s]}</Pill>;
export const TempBadge = ({ t }: { t: Temp }) => <Pill tone={t === "chaud" ? "success" : t === "tiede" ? "warning" : "cold"}>{TEMP_LABEL[t]}</Pill>;

export const TYPE_ICON: Record<LeadType, React.ComponentType<{ className?: string }>> = { acheteur: Home, locataire: KeyRound, vendeur: Landmark, bailleur: Building2, investisseur: TrendingUp, autre: HelpCircle };
const TYPE_TONE: Record<LeadType, Tone> = { acheteur: "primary", locataire: "info", vendeur: "warning", bailleur: "success", investisseur: "neutral", autre: "cold" };
export function TypeBadge({ t, short }: { t: LeadType; short?: boolean }) {
  const I = TYPE_ICON[t];
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", TONE[TYPE_TONE[t]], t === "investisseur" && "bg-ink text-ink-foreground")}><I className="size-3.5" />{short ? { acheteur: "Acheteur", locataire: "Locataire", vendeur: "Vendeur", bailleur: "Bailleur", investisseur: "Investisseur", autre: "Autre" }[t] : TYPE_LABEL[t]}</span>;
}
export const SOURCE_ICON: Record<Source, React.ComponentType<{ className?: string }>> = { whatsapp: MessageCircle, email: Mail, site: Globe, instagram: Instagram };
export function SourceIcon({ s, label }: { s: Source; label?: boolean }) {
  const I = SOURCE_ICON[s];
  return <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground" title={SOURCE_LABEL[s]}><I className={cn("size-4", s === "whatsapp" && "text-success", s === "instagram" && "text-primary")} />{label && SOURCE_LABEL[s]}<span className="sr-only">{SOURCE_LABEL[s]}</span></span>;
}

export function Avatar({ name, size = 32, className }: { name?: string | null; size?: number; className?: string }) {
  if (!name) return <span className={cn("inline-flex items-center justify-center rounded-full border border-dashed text-[10px] text-muted-foreground", className)} style={{ width: size, height: size }} title="Sans conseiller">—</span>;
  const ini = name.split(" ").map((x) => x[0]).slice(0, 2).join("");
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return <span title={name} className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-primary-foreground", className)} style={{ width: size, height: size, fontSize: size * 0.36, background: `oklch(0.55 0.12 ${hue})` }}>{ini}</span>;
}

export function Panel({ className, children, spotlight = true, ...p }: React.HTMLAttributes<HTMLDivElement> & { spotlight?: boolean }) {
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", e.clientX - r.left + "px");
    e.currentTarget.style.setProperty("--my", e.clientY - r.top + "px");
  };
  return <div onMouseMove={spotlight ? onMove : undefined} className={cn("glass rounded-3xl border p-5", spotlight && "spotlight", className)} {...p}>{children}</div>;
}
export const PanelTitle = ({ children, right, sub }: { children: React.ReactNode; right?: React.ReactNode; sub?: React.ReactNode }) => (
  <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="font-display text-lg">{children}</h3>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>{right}</div>
);

export function CountUp({ value, className, format = (n: number) => Math.round(n).toLocaleString("fr-FR") }: { value: number; className?: string; format?: (n: number) => string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const prev = React.useRef(0);
  React.useEffect(() => {
    const c = animate(prev.current, value, { duration: 1.1, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = format(v); } });
    prev.current = value; return () => c.stop();
  }, [value]);
  return <span ref={ref} className={cn("tnum", className)}>{format(0)}</span>;
}

export function Tilt({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const rx = useTransform(y, [-0.5, 0.5], [6, -6]), ry = useTransform(x, [-0.5, 0.5], [-6, 6]);
  return (
    <motion.div style={{ rotateX: rx, rotateY: ry, transformPerspective: 800 }} className={className} onClick={onClick}
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX - r.left) / r.width - 0.5); y.set((e.clientY - r.top) / r.height - 0.5); }}
      onMouseLeave={() => { x.set(0); y.set(0); }}>{children}</motion.div>
  );
}

export function ScoreRing({ score, size = 56, stroke = 5 }: { score: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const col = score >= 70 ? "var(--success)" : score >= 40 ? "var(--warning)" : "var(--cold)";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`Score IA ${score} sur 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={col} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - score / 100) }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <span className="absolute tnum font-semibold" style={{ fontSize: size * 0.3 }}>{score}</span>
    </div>
  );
}

export function Typing({ text, speed = 18, onDone, className }: { text: string; speed?: number; onDone?: () => void; className?: string }) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => { setN(0); }, [text]);
  React.useEffect(() => {
    if (n >= text.length) { onDone?.(); return; }
    const t = setTimeout(() => setN((v) => v + Math.max(1, Math.round(text.length / 120))), speed);
    return () => clearTimeout(t);
  }, [n, text]);
  return <span className={cn(n < text.length && "typing-caret", className)}>{text.slice(0, n)}</span>;
}

export function AiNote({ className }: { className?: string }) {
  return <p className={cn("flex items-center gap-1.5 text-[11px] text-muted-foreground", className)}><Sparkles className="size-3 text-primary" />{AI_DISCLAIMER}</p>;
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none" aria-hidden className="text-primary">
        <path d="M10 70h100" stroke="currentColor" strokeOpacity=".3" strokeWidth="2" />
        <path d="M25 70V40l20-14 20 14v30" stroke="currentColor" strokeWidth="2" />
        <path d="M65 70V30h30v40" stroke="currentColor" strokeOpacity=".6" strokeWidth="2" />
        <rect x="38" y="52" width="14" height="18" stroke="currentColor" strokeWidth="2" />
        <path d="M72 38h6M84 38h6M72 48h6M84 48h6M72 58h6M84 58h6" stroke="currentColor" strokeOpacity=".6" strokeWidth="2" />
      </svg>
      <p className="font-display text-lg">{title}</p>
      {text && <p className="max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action}
    </div>
  );
}

export function Seg<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; className?: string }) {
  const id = React.useId();
  return (
    <div className={cn("inline-flex rounded-xl bg-muted p-1", className)} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)} className="relative rounded-lg px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {value === o.value && <motion.span layoutId={id} className="absolute inset-0 rounded-lg bg-card shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />}
          <span className={cn("relative", value === o.value ? "text-foreground" : "text-muted-foreground")}>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: value + "%" }} transition={{ duration: 0.8 }} /></div>;
}

export const fmtDate = (t: number) => new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
export const fmtDateTime = (t: number) => new Date(t).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
export function ago(t: number) {
  const d = (Date.now() - t) / 1000;
  if (d < 0) { const f = -d; if (f < 86400) return "dans " + Math.round(f / 3600) + " h"; return "dans " + Math.round(f / 86400) + " j"; }
  if (d < 60) return "à l'instant"; if (d < 3600) return `il y a ${Math.floor(d / 60)} min`; if (d < 86400) return `il y a ${Math.floor(d / 3600)} h`;
  return `il y a ${Math.floor(d / 86400)} j`;
}
export const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = norm(text).indexOf(norm(q));
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark className="rounded bg-primary-soft px-0.5 text-primary">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}
