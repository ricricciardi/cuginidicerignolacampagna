'use client';
import { useEffect } from 'react';

// I pulsanti dell'amministratore mandano un POST e tornano qui con #admin: il browser
// salta alla scheda mentre quelle sopra (Notifiche, App) stanno ancora decidendo cosa
// mostrare, e quando cambiano altezza lo scroll finisce altrove. La rimettiamo in vista
// a montaggio fatto, e di nuovo poco dopo per i riquadri che si assestano in ritardo.
export default function ScrollTo({ id }) {
  useEffect(() => {
    const go = () => document.getElementById(id)?.scrollIntoView({ block: 'start' });
    go();
    const t = setTimeout(go, 300);
    return () => clearTimeout(t);
  }, [id]);
  return null;
}
