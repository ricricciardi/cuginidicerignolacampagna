'use client';
import { useEffect, useState } from 'react';

// Aggiungere il sito alla schermata Home.
// - Android/computer (Chrome, Edge): il browser segnala che si può installare con l'evento
//   beforeinstallprompt; lo teniamo da parte e il nostro pulsante apre la sua finestra.
// - iPhone/iPad: Apple non lo permette dal sito; mostriamo la guida (in Safari) o chiediamo
//   di aprire il sito in Safari (negli altri browser).
// - Già installato (aperto dall'icona): niente.

let deferred = null; // evento beforeinstallprompt tenuto da parte
const listeners = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; listeners.forEach((f) => f()); });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    try { localStorage.setItem('install-hint', 'done'); } catch {}
    listeners.forEach((f) => f());
  });
}

function detect() {
  const ua = navigator.userAgent;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone) return 'installed';
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua) ? 'ios-other' : 'ios-safari';
  return deferred ? 'prompt' : 'none';
}

function useInstallState() {
  const [state, setState] = useState(null); // null finché non sappiamo (niente sfarfallio al caricamento)
  useEffect(() => {
    const update = () => setState(detect());
    update();
    listeners.add(update);
    return () => listeners.delete(update);
  }, []);
  return state;
}

// Icona «Condividi» di Safari: quadrato con la freccia in su.
const ShareIcon = () => (
  <svg className="share-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          d="M12 3v12M8 7l4-4 4 4M7 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1" />
  </svg>
);

function Guide({ state, onInstall }) {
  if (state === 'prompt') {
    return (
      <>
        <p>Installa Cugini come app: si apre dalla sua icona, come le altre app, e ricevi le notifiche.</p>
        <button type="button" onClick={onInstall}>Installa l&apos;app</button>
      </>
    );
  }
  if (state === 'ios-safari') {
    return (
      <>
        <p>Aggiungi Cugini alla schermata Home: si apre come un&apos;app e puoi ricevere le notifiche.</p>
        <ol className="install-steps">
          <li>Tocca <ShareIcon /> <strong>Condividi</strong> nella barra di Safari.</li>
          <li>Scorri e tocca <strong>Aggiungi alla schermata Home</strong>.</li>
          <li>Tocca <strong>Aggiungi</strong>, poi apri Cugini dall&apos;icona.</li>
        </ol>
      </>
    );
  }
  if (state === 'ios-other') {
    return <p>Per aggiungere Cugini alla schermata Home apri questo sito in <strong>Safari</strong>: dagli altri browser su iPhone non si può.</p>;
  }
  return null;
}

async function install() {
  if (!deferred) return;
  deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  if (outcome === 'accepted') { try { localStorage.setItem('install-hint', 'done'); } catch {} }
  listeners.forEach((f) => f());
}

// Avviso chiudibile (Le mie corse): una volta per dispositivo, finché non lo chiudi o installi.
export function InstallBanner() {
  const state = useInstallState();
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    try { setHidden(Boolean(localStorage.getItem('install-hint'))); } catch { setHidden(false); }
  }, [state]);
  if (hidden || !state || state === 'installed' || state === 'none') return null;
  const close = () => { try { localStorage.setItem('install-hint', 'closed'); } catch {} setHidden(true); };
  return (
    <aside className="install-banner" aria-label="Aggiungi alla schermata Home">
      <button type="button" className="quiet install-close" onClick={close} aria-label="Chiudi">✕</button>
      <Guide state={state} onInstall={install} />
    </aside>
  );
}

// Guida sempre disponibile (scheda Notifiche dell'account).
export function InstallGuide() {
  const state = useInstallState();
  if (!state || state === 'installed' || state === 'none') return null;
  return <div className="install-guide"><Guide state={state} onInstall={install} /></div>;
}
