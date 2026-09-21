'use client';
import { useEffect, useState } from 'react';

// Chiave pubblica VAPID (base64 url) nel formato che vuole il browser.
const keyBytes = (b64) => {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

async function currentSubscription() {
  const reg = await navigator.serviceWorker.getRegistration('/');
  return reg ? reg.pushManager.getSubscription() : null;
}

// Scheda «Notifiche»: attiva o disattiva le notifiche push su questo dispositivo.
// Su iPhone funzionano solo dall'app aggiunta alla schermata Home (iOS 16.4 o successivo).
export default function PushToggle({ publicKey }) {
  // loading | unsupported | ios | off | on | denied | busy
  const [state, setState] = useState('loading');
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState(ios && !standalone ? 'ios' : 'unsupported');
      return;
    }
    if (Notification.permission === 'denied') { setState('denied'); return; }
    currentSubscription().then((sub) => setState(sub ? 'on' : 'off')).catch(() => setState('off'));
  }, []);

  const enable = async () => {
    setState('busy'); setMsg(null);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      if ((await Notification.requestPermission()) !== 'granted') { setState('denied'); return; }
      const sub = (await reg.pushManager.getSubscription())
        ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
      const res = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      if (!res.ok) throw new Error();
      setState('on');
    } catch {
      setState('off'); setMsg('Non sono riuscito ad attivarle. Riprova.');
    }
  };

  const disable = async () => {
    setState('busy'); setMsg(null);
    try {
      const sub = await currentSubscription();
      if (sub) {
        await fetch('/api/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setState('off');
    } catch {
      setState('on'); setMsg('Non sono riuscito a disattivarle. Riprova.');
    }
  };

  const test = async () => {
    setMsg('Invio…');
    const res = await fetch('/api/push/prova', { method: 'POST' }).catch(() => null);
    setMsg(res?.ok ? 'Mandata: dovrebbe arrivarti tra un attimo.' : 'Non è partita: prova a disattivare e riattivare.');
  };

  const pill = state === 'on' ? <span className="pill ok">Attive</span> : <span className="pill">Spente</span>;
  return (
    <section className="card" id="notifiche" aria-labelledby="notifiche-title">
      <div className="card-head">
        <h2 id="notifiche-title">Notifiche</h2>
        {state !== 'loading' && pill}
      </div>
      <p className="hint">Sorpassi e nuovi record nelle tue gare, gare che partono o finiscono, quando ti aggiungono a una gara e gli auguri di compleanno.</p>

      {!publicKey ? (
        <p className="hint">Le notifiche non sono ancora attive sul sito.</p>
      ) : state === 'ios' ? (
        <div className="notice">
          Su iPhone le notifiche arrivano solo dall&apos;app: aggiungila alla schermata Home
          seguendo i passi nella scheda <a href="#installa">App</a> qui sotto.
        </div>
      ) : state === 'unsupported' ? (
        <p className="hint">Questo browser non supporta le notifiche.</p>
      ) : state === 'denied' ? (
        <div className="notice error">
          Le notifiche sono bloccate per questo sito. Riattivale dalle impostazioni del browser (o del telefono) e ricarica la pagina.
        </div>
      ) : (
        <div className="push-actions">
          {state === 'on' ? (
            <>
              <button type="button" className="button secondary" onClick={test}>Mandami una prova</button>
              <button type="button" className="quiet" onClick={disable}>Disattiva su questo dispositivo</button>
            </>
          ) : (
            <button type="button" onClick={enable} disabled={state === 'busy' || state === 'loading'}>
              {state === 'busy' ? 'Attivazione…' : 'Attiva le notifiche'}
            </button>
          )}
        </div>
      )}
      {msg && <p className="hint push-msg" role="status">{msg}</p>}
    </section>
  );
}
