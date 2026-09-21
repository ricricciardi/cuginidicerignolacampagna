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
export default function SegmentedLinks({ items, label, className, scroll = true, replace = false }) {
  const current = items.findIndex((it) => it.current);
  const [active, setActive] = useState(current);
  useEffect(() => setActive(current), [current]);

  const nav = useRef(null);
  const links = useRef([]);
  const thumbEl = useRef(null);

  // A ogni tocco il cursore si gonfia e rimbalza alla sua misura (anche sulla voce già scelta).
  // Usa la proprietà scale, separata da transform, così non disturba lo scorrimento.
  const pulse = () => {
    const el = thumbEl.current;
    if (!el?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.animate(
      [{ scale: '1' }, { scale: '1.12', offset: 0.3 }, { scale: '0.95', offset: 0.6 }, { scale: '1.03', offset: 0.8 }, { scale: '1' }],
      { duration: 520, easing: 'ease-out' },
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
    <nav ref={nav} className={`${className} sliding`} aria-label={label} style={style}
         data-ready={thumb ? '' : undefined} data-animate={thumb?.animate ? '' : undefined}>
      <span ref={thumbEl} className="slide-thumb" aria-hidden="true" data-hidden={thumb && !thumb.show ? '' : undefined} />
      {items.map((it, i) => (
        <Link key={it.href} href={it.href} scroll={scroll} replace={replace}
              ref={(el) => { links.current[i] = el; }}
              className={it.className} aria-label={it.ariaLabel} title={it.title}
              aria-current={i === active ? 'page' : undefined}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                setActive(i);
                if (items[i].thumb !== false) pulse();
              }}>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
