'use client';
import { useEffect, useState } from 'react';
import { useT } from './lang-provider';

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

function Guide({ state, onInstall, hideIntro = false }) {
  const t = useT();
  if (state === 'prompt') {
    return (
      <>
        {!hideIntro && <p>{t('Installa Cugini come app: si apre dalla sua icona, come le altre app, e ricevi le notifiche.')}</p>}
        <button type="button" onClick={onInstall}>{t('Installa l\'app')}</button>
      </>
    );
  }
  if (state === 'ios-safari') {
    return (
      <>
        {!hideIntro && <p>{t('Aggiungi Cugini alla schermata Home: si apre come un\'app e puoi ricevere le notifiche.')}</p>}
        <ol className="install-steps">
          <li>{t('Tocca')} <ShareIcon /> <strong>{t('Condividi')}</strong> {t('nella barra di Safari.')}</li>
          <li>{t('Scorri e tocca')} <strong>{t('Aggiungi alla schermata Home')}</strong>.</li>
          <li>{t('Tocca')} <strong>{t('Aggiungi')}</strong>{t(', poi apri Cugini dall\'icona.')}</li>
        </ol>
      </>
    );
  }
  if (state === 'ios-other') {
    return <p>{t('Per aggiungere Cugini alla schermata Home apri questo sito in')} <strong>Safari</strong>{t(': dagli altri browser su iPhone non si può.')}</p>;
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
  const t = useT();
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    try { setHidden(Boolean(localStorage.getItem('install-hint'))); } catch { setHidden(false); }
  }, [state]);
  if (hidden || !state || state === 'installed' || state === 'none') return null;
  const close = () => { try { localStorage.setItem('install-hint', 'closed'); } catch {} setHidden(true); };
  return (
    <aside className="install-banner" aria-label={t('Aggiungi alla schermata Home')}>
      <button type="button" className="quiet install-close" onClick={close} aria-label={t('Chiudi')}>✕</button>
      <Guide state={state} onInstall={install} />
    </aside>
  );
}

// Scheda «App», sempre visibile in fondo all'account: cosa fare su questo dispositivo.
export function InstallCard() {
  const state = useInstallState();
  const t = useT();
  return (
    <section className="card" id="installa" aria-labelledby="installa-title">
      <div className="card-head">
        <h2 id="installa-title">{t('App')}</h2>
        {state === 'installed' && <span className="pill ok">{t('Installata')}</span>}
      </div>
      <p>{t('Installa Cugini come app: si apre dalla sua icona, come le altre app, e ricevi le notifiche.')}</p>
      {state === 'installed' ? (
        <p className="hint">{t('Stai già usando l\'app ✓')}</p>
      ) : state === 'none' ? (
        <p className="hint">
          {t('Questo browser non la propone da solo: cerca nel suo menu')} <strong>{t('Installa app')}</strong> {t('o')}
          <strong> {t('Aggiungi alla schermata Home')}</strong>. {t('Sul telefono funziona con Chrome su Android e con Safari su iPhone.')}
        </p>
      ) : state ? (
        <div className="install-guide"><Guide state={state} onInstall={install} hideIntro /></div>
      ) : null}
    </section>
  );
}
