'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useT } from './lang-provider';

// Guida di benvenuto: poche schermate che spiegano l'app, la prima volta che si entra con Strava
// collegato. Una volta chiusa non ricompare (ricordo sul dispositivo). «Rivedi la guida»
// nell'account la riapre con l'evento 'apri-guida'.
const STEPS = [
  { icon: '👋', title: 'Benvenuto nella sfida!',
    text: 'Tu corri come sempre con il tuo orologio o il telefono: Strava registra la corsa e questo sito fa la classifica tra cugini. Niente da inserire a mano.' },
  { icon: '🏁', title: 'Le gare',
    text: 'In «Gare» trovi le gare a cui partecipi. Ogni gara ha la sua distanza e le sue date: conta il tempo che ci metti a percorrerla, all\'aperto, su strada.' },
  { icon: '🏆', title: 'La classifica',
    text: '«Tempo» mette in fila i tempi migliori. «Punteggio» tiene conto di età e sesso, così giovani e meno giovani si sfidano alla pari. Tocca un nome per vedere i suoi km uno per uno.' },
  { icon: '🏃', title: 'Le tue corse',
    text: 'Le corse arrivano da sole ogni mattina. Se hai appena corso e non vuoi aspettare, in «Le mie corse» premi «Aggiorna adesso da Strava».' },
  { icon: '👤', title: 'Il tuo account',
    text: 'Tocca la tua foto in alto a destra: puoi cambiare foto, controllare sesso e data di nascita, attivare le notifiche e mettere l\'app sulla schermata Home.' },
  { icon: '🌈', title: 'Pronti?',
    text: 'È tutto qui. Se ti perdi, la guida la ritrovi nel tuo account. #andràtuttobene' },
];

const KEY = 'guida-vista';
const seen = () => { try { return Boolean(localStorage.getItem(KEY)); } catch { return true; } };
const markSeen = () => { try { localStorage.setItem(KEY, '1'); } catch {} };

// Pagine dove la guida non si apre da sola (accesso, collegamento a Strava).
const SKIP = ['/login', '/register', '/collega-strava'];

export default function Tour({ enabled }) {
  const path = usePathname();
  const dialog = useRef(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const t = useT();
  const [dir, setDir] = useState(1); // 1 avanti, -1 indietro: da che lato entra la schermata
  const swipe = useRef(null);

  useEffect(() => {
    if (enabled && !seen() && !SKIP.some((p) => path.startsWith(p))) { setDir(1); setStep(0); setOpen(true); }
  }, [enabled, path]);
  useEffect(() => {
    const reopen = () => { setStep(0); setOpen(true); };
    window.addEventListener('apri-guida', reopen);
    return () => window.removeEventListener('apri-guida', reopen);
  }, []);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const close = () => { markSeen(); setOpen(false); };
  const last = step === STEPS.length - 1;
  const go = (d) => {
    const n = step + d;
    if (n < 0) return;
    if (n >= STEPS.length) { close(); return; }
    setDir(d); setStep(n);
  };

  // Swipe: dito a sinistra = avanti, a destra = indietro (almeno 40 px, più in orizzontale che in verticale).
  const onPointerDown = (e) => { swipe.current = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e) => {
    const s0 = swipe.current;
    swipe.current = null;
    if (!s0) return;
    const dx = e.clientX - s0.x, dy = e.clientY - s0.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0 && !last) go(1);
    if (dx > 0) go(-1);
  };
  const s = STEPS[step];

  return (
    <dialog ref={dialog} className="tour" aria-labelledby="tour-title"
            onCancel={(e) => { e.preventDefault(); close(); }}>
      {open && (
        <>
          <button type="button" className="quiet tour-skip" onClick={close}>{t('Salta')}</button>
          <div className="tour-step" key={step} data-dir={dir < 0 ? 'back' : undefined}
               onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { swipe.current = null; }}>
            <div className="tour-icon" aria-hidden="true">{s.icon}</div>
            <h2 id="tour-title">{t(s.title)}</h2>
            <p>{t(s.text)}</p>
          </div>
          <div className="tour-dots" aria-label={t('Passo {n} di {tot}', { n: step + 1, tot: STEPS.length })}>
            {STEPS.map((_, i) => <span key={i} className={i === step ? 'on' : undefined} />)}
          </div>
          <div className="tour-actions">
            {step > 0
              ? <button type="button" className="quiet" onClick={() => go(-1)}>{t('Indietro')}</button>
              : <span />}
            <button type="button" onClick={() => go(1)}>
              {last ? t('Iniziamo') : t('Avanti')}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}

// Pulsante «Rivedi la guida» (account).
export function ReopenTour() {
  const t = useT();
  return (
    <button type="button" className="quiet rules-link" onClick={() => window.dispatchEvent(new Event('apri-guida'))}>
      {t('Rivedi la guida')}
    </button>
  );
}
