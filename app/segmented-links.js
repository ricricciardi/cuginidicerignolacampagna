'use client';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Ultima posizione del cursore per ogni selettore: se la pagina nuova ricrea il selettore
// (es. Classifica → Confronto), il cursore riparte da dove era invece di comparire già arrivato.
const lastThumb = new Map();

// Selettore di sezioni che cambia pagina senza ricaricarla. Un cursore colorato scorre
// subito sotto la voce toccata, mentre la nuova vista arriva dal server.
// items: [{ href, label, current, className?, ariaLabel?, title?, thumb? }]; thumb: false = voce
// senza cursore (il tab dell'account ha già il suo anello attorno alla foto).
// label: identificativo interno (usato anche da .nav-content[data-nav]); ariaLabel: il nome letto, tradotto.
// onSelect(i): la vista cambia nel browser senza navigare (le viste sono già tutte nella pagina):
// niente skeleton né attesa del server, e lo scroll resta dov'è. Senza onSelect si naviga.
export default function SegmentedLinks({ items, label, ariaLabel, className, scroll = true, replace = false, onSelect }) {
  const current = items.findIndex((it) => it.current);
  const [active, setActive] = useState(current);
  useEffect(() => setActive(current), [current]);

  // Mentre arriva la vista nuova, il contenuto sotto il selettore (.nav-content con
  // data-nav = label) diventa uno skeleton. Si toglie quando la vista cambia o, per sicurezza, dopo 8 s.
  useEffect(() => {
    if (document.documentElement.dataset.navPending === label) delete document.documentElement.dataset.navPending;
  }, [current, label]);
  const startPending = () => {
    const root = document.documentElement;
    root.dataset.navPending = label;
    setTimeout(() => { if (root.dataset.navPending === label) delete root.dataset.navPending; }, 8000);
  };

  const nav = useRef(null);
  const links = useRef([]);
  const thumbEl = useRef(null);

  // A ogni tocco il cursore si gonfia e rimbalza alla sua misura (anche sulla voce già scelta).
  // Usa la proprietà scale, separata da transform, così non disturba lo scorrimento.
  const pulse = (el = thumbEl.current) => {
    if (!el?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.animate(
      [{ scale: '1' }, { scale: '1.06', offset: 0.3 }, { scale: '0.98', offset: 0.65 }, { scale: '1' }],
      { duration: 420, easing: 'ease-out' },
    );
  };
  const [thumb, setThumb] = useState(null); // { x, w, show, animate }

  useLayoutEffect(() => {
    const measure = (animate) => {
      const el = links.current[active];
      const show = Boolean(el) && items[active]?.thumb !== false;
      const next = show ? { x: el.offsetLeft, w: el.offsetWidth, show, animate } : { ...lastThumb.get(label), show: false, animate };
      if (show) lastThumb.set(label, next);
      setThumb(next);
    };
    const prev = lastThumb.get(label);
    let raf;
    if (!thumb && prev) {
      // Primo disegno: parte dalla posizione precedente, al fotogramma dopo scorre su quella nuova.
      setThumb({ ...prev, animate: false });
      raf = requestAnimationFrame(() => { raf = requestAnimationFrame(() => measure(true)); });
    } else {
      measure(Boolean(thumb));
    }
    // Se cambia la larghezza (rotazione, font caricato) si riallinea senza animazione.
    let first = true;
    const ro = new ResizeObserver(() => { if (first) first = false; else measure(false); });
    ro.observe(nav.current);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, label]);

  const style = thumb ? { '--x': `${thumb.x ?? 0}px`, '--w': `${thumb.w ?? 0}px` } : undefined;
  return (
    <nav ref={nav} className={`${className} sliding`} aria-label={ariaLabel ?? label} style={style}
         data-ready={thumb ? '' : undefined} data-animate={thumb?.animate ? '' : undefined}>
      <span ref={thumbEl} className="slide-thumb" aria-hidden="true" data-hidden={thumb && !thumb.show ? '' : undefined} />
      {items.map((it, i) => (
        <Link key={it.href} href={it.href} scroll={scroll} replace={replace}
              ref={(el) => { links.current[i] = el; }}
              className={it.className} aria-label={it.ariaLabel} title={it.title}
              aria-current={i === active ? 'page' : undefined}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                if (onSelect) {
                  e.preventDefault();
                  onSelect(i);
                } else if (i !== active) startPending();
                setActive(i);
                // Senza cursore (tab dell'account) pulsa la foto al suo posto.
                pulse(items[i].thumb === false ? e.currentTarget.firstElementChild : undefined);
              }}>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
