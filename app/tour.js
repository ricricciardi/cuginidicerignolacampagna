'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Guida di benvenuto: poche schermate che spiegano l'app, la prima volta che si entra con Strava
// collegato. Una volta chiusa non ricompare (ricordo sul dispositivo). «Rivedi la guida»
// nell'account la riapre con l'evento 'apri-guida'.
const STEPS = [
  { icon: '👋', title: 'Benvenuto nella sfida!',
    text: 'Tu corri come sempre con il tuo orologio o il telefono: Strava registra la corsa e questo sito fa la classifica tra cugini. Niente da inserire a mano.' },
  { icon: '🏁', title: 'Le gare',
    text: 'In «Gare» trovi le gare a cui partecipi. Ogni gara ha i suoi km e le sue date: conta il tempo che ci metti a fare quei km, all\'aperto, su strada.' },
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

  useEffect(() => {
    if (enabled && !seen() && !SKIP.some((p) => path.startsWith(p))) { setStep(0); setOpen(true); }
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
  const s = STEPS[step];

  return (
    <dialog ref={dialog} className="tour" aria-labelledby="tour-title"
            onCancel={(e) => { e.preventDefault(); close(); }}>
      {open && (
        <>
          <button type="button" className="quiet tour-skip" onClick={close}>Salta</button>
          <div className="tour-step" key={step}>
            <div className="tour-icon" aria-hidden="true">{s.icon}</div>
            <h2 id="tour-title">{s.title}</h2>
            <p>{s.text}</p>
          </div>
          <div className="tour-dots" aria-label={`Passo ${step + 1} di ${STEPS.length}`}>
            {STEPS.map((_, i) => <span key={i} className={i === step ? 'on' : undefined} />)}
          </div>
          <div className="tour-actions">
            {step > 0
              ? <button type="button" className="quiet" onClick={() => setStep(step - 1)}>Indietro</button>
              : <span />}
            <button type="button" onClick={() => (last ? close() : setStep(step + 1))}>
              {last ? 'Iniziamo' : 'Avanti'}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}

// Pulsante «Rivedi la guida» (account).
export function ReopenTour() {
  return (
    <button type="button" className="quiet rules-link" onClick={() => window.dispatchEvent(new Event('apri-guida'))}>
      Rivedi la guida
    </button>
  );
}
