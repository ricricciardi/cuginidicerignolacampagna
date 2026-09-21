'use client';

// Corsa apribile dello storico: quando la apri con un tocco, la pagina scorre per portarla
// sotto l'intestazione fissa e mostrare i parziali. Non scorre al caricamento né quando si chiude.
export default function RunDetails({ open, head, children }) {
  const onToggle = (e) => {
    const d = e.currentTarget;
    if (!d.open || !d.dataset.tapped) return;
    delete d.dataset.tapped;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() =>
      d.querySelector('summary').scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' }));
  };
  return (
    <details open={open} onToggle={onToggle}>
      <summary className="run-row" onClick={(e) => { e.currentTarget.parentElement.dataset.tapped = '1'; }}>
        {head}
      </summary>
      {children}
    </details>
  );
}
