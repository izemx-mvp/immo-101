import * as React from "react";
import { createPortal } from "react-dom";

/** Renders the page's primary button(s) into the top bar. */
export function PageAction({ children }: { children: React.ReactNode }) {
  const [el, setEl] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => { setEl(document.getElementById("page-action")); }, []);
  return el ? createPortal(children, el) : null;
}

export function Crumbs({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span aria-hidden>/</span>}
          {it.onClick ? <button onClick={it.onClick} className="hover:text-foreground hover:underline">{it.label}</button> : <span aria-current="page" className="text-foreground">{it.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}
