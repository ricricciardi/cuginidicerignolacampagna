'use client';
import { useEffect } from 'react';

// Effetto pressione dei pulsantoni, in tutto il sito: premendo il pulsante si gonfia un attimo
// e poi si schiaccia; lasciandolo torna su con un rimbalzo. Usa la proprietà `scale`, separata
// da `transform`, così si somma all'abbassamento di 1 px del CSS (:active).
const BIG = 'button:not(.quiet):not(.reveal):not(.photo-button), .button';

const PRESS = [{ scale: '1' }, { scale: '1.05', offset: 0.35 }, { scale: '0.94' }];
const RELEASE = [{ scale: '0.94' }, { scale: '1.04', offset: 0.45 }, { scale: '0.99', offset: 0.75 }, { scale: '1' }];

export default function PressFx() {
  useEffect(() => {
    if (!Element.prototype.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let pressed = null;

    const down = (e) => {
      if (e.button !== 0) return;
      const el = e.target.closest?.(BIG);
      if (!el || el.disabled) return;
      pressed?.getAnimations().forEach((a) => a.cancel());
      pressed = el;
      el.animate(PRESS, { duration: 180, easing: 'ease-out', fill: 'forwards' });
    };
    const up = () => {
      const el = pressed;
      if (!el) return;
      pressed = null;
      // Riparte dallo schiacciamento anche se la pressione era più breve dell'animazione.
      el.getAnimations().forEach((a) => a.cancel());
      el.animate(RELEASE, { duration: 420, easing: 'ease-out' });
    };

    document.addEventListener('pointerdown', down, { passive: true });
    document.addEventListener('pointerup', up, { passive: true });
    document.addEventListener('pointercancel', up, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
    };
  }, []);
  return null;
}
