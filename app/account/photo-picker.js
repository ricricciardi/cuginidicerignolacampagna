'use client';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import Avatar from '../avatar';

const SIZE = 256; // lato della foto salvata, in pixel

// Ritaglia al centro un quadrato e lo rimpicciolisce a 256x256 JPEG (~20 KB), nel browser.
async function toSquareJpeg(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, SIZE, SIZE);
    return await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', 0.85));
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Foto dell'account: tocca per sceglierne una dal telefono; si può tornare a quella di Strava.
export default function PhotoPicker({ name, src, custom, strava }) {
  const router = useRouter();
  const input = useRef(null);
  const [state, setState] = useState('idle'); // idle | saving | error
  const [preview, setPreview] = useState(null);

  const send = async (init) => {
    setState('saving');
    try {
      const res = await fetch('/api/foto', init);
      if (!res.ok) throw new Error();
      setState('idle');
      router.refresh();
    } catch {
      setPreview(null);
      setState('error');
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let blob;
    try {
      blob = await toSquareJpeg(file);
    } catch {
      setState('error');
      return;
    }
    setPreview(URL.createObjectURL(blob));
    const fd = new FormData();
    fd.append('photo', blob, 'foto.jpg');
    send({ method: 'POST', body: fd });
  };

  return (
    <div className="photo-picker">
      <button type="button" className="photo-button" onClick={() => input.current?.click()}
              aria-label="Cambia foto" disabled={state === 'saving'}>
        <Avatar name={name} src={preview ?? src} size="lg" />
        <span className="photo-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9 4 7.2 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.2L15 4H9Zm3 4.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"/></svg>
        </span>
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={onFile} />
      <div className="photo-actions">
        {state === 'saving' && <span className="hint">Salvataggio…</span>}
        {state === 'error' && <span className="field-error" role="status">Foto non caricata. Riprova con un&apos;altra immagine.</span>}
        {custom && state !== 'saving' && (
          <button type="button" className="quiet" onClick={() => { setPreview(null); send({ method: 'DELETE' }); }}>
            {strava ? 'Usa la foto di Strava' : 'Togli la foto'}
          </button>
        )}
      </div>
    </div>
  );
}
