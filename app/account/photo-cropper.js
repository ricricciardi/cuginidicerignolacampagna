'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const OUT = 256;     // lato della foto salvata, in pixel
const MAX_ZOOM = 4;  // ingrandimento massimo rispetto alla foto che riempie il cerchio

// Editor della foto: la foto riempie un riquadro quadrato con il cerchio di anteprima.
// Si trascina per spostarla, si allargano due dita (o rotellina, o cursore) per ingrandirla.
// Stato: z = ingrandimento (1 = la foto copre appena il riquadro), x/y = posizione dell'angolo
// in alto a sinistra della foto rispetto al riquadro, in pixel (sempre <= 0: la foto lo copre tutto).
export default function PhotoCropper({ file, onCancel, onDone }) {
  const dialog = useRef(null);
  const stage = useRef(null);
  const [img, setImg] = useState(null); // { el, url, w, h }
  const [side, setSide] = useState(0);  // lato del riquadro, in pixel
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const pointers = useRef(new Map());
  const start = useRef(null);

  useEffect(() => {
    let live = true; // un caricamento annullato (cambio file, chiusura) non deve chiudere l'editor
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.src = url;
    el.decode()
      .then(() => live && setImg({ el, url, w: el.naturalWidth, h: el.naturalHeight }))
      .catch(() => live && onCancel(true));
    return () => { live = false; URL.revokeObjectURL(url); };
  }, [file, onCancel]);

  useEffect(() => { dialog.current?.showModal(); }, []);

  // Riquadro misurato quando la foto è pronta: si parte con la foto centrata.
  useLayoutEffect(() => {
    if (!img) return;
    const v = stage.current.clientWidth;
    const s = v / Math.min(img.w, img.h);
    setSide(v);
    setView({ z: 1, x: (v - img.w * s) / 2, y: (v - img.h * s) / 2 });
  }, [img]);

  const base = img && side ? side / Math.min(img.w, img.h) : 1;
  const clamp = (z, x, y) => {
    const s = base * z;
    return { z, x: Math.min(0, Math.max(side - img.w * s, x)), y: Math.min(0, Math.max(side - img.h * s, y)) };
  };
  // Ingrandisce tenendo fermo il punto (px, py) del riquadro sotto le dita.
  const zoomAt = (v, z, px, py) => {
    const nz = Math.min(MAX_ZOOM, Math.max(1, z));
    const k = nz / v.z;
    return clamp(nz, px - (px - v.x) * k, py - (py - v.y) * k);
  };

  const local = (e) => {
    const r = stage.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const snapshot = (v) => {
    const pts = [...pointers.current.values()];
    const mid = pts.length === 2 ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 } : pts[0];
    const dist = pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    start.current = { view: v, mid, dist };
  };

  const onPointerDown = (e) => {
    if (!img) return;
    stage.current.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, local(e));
    snapshot(view);
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId) || !start.current) return;
    pointers.current.set(e.pointerId, local(e));
    const pts = [...pointers.current.values()];
    const { view: v0, mid: m0, dist: d0 } = start.current;
    if (pts.length === 1) {
      setView(clamp(v0.z, v0.x + pts[0].x - m0.x, v0.y + pts[0].y - m0.y));
    } else if (pts.length === 2 && d0 > 0) {
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const zoomed = zoomAt(v0, v0.z * (d / d0), m0.x, m0.y);
      setView(clamp(zoomed.z, zoomed.x + mid.x - m0.x, zoomed.y + mid.y - m0.y));
    }
  };
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    // Da due dita a una: si riparte dalla posizione attuale, senza salti.
    if (pointers.current.size) setView((v) => { snapshot(v); return v; });
    else start.current = null;
  };

  // Rotellina (o pizzico sul trackpad): serve un ascoltatore non passivo per bloccare lo scroll.
  useEffect(() => {
    const el = stage.current;
    if (!el || !img || !side) return;
    const onWheel = (e) => {
      e.preventDefault();
      const p = local(e);
      setView((v) => zoomAt(v, v.z * Math.exp(-e.deltaY / 300), p.x, p.y));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  // Tastiera: frecce per spostare, + e − per ingrandire.
  const onKeyDown = (e) => {
    const step = 10;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) { e.preventDefault(); setView((v) => clamp(v.z, v.x + moves[e.key][0], v.y + moves[e.key][1])); }
    if (e.key === '+' || e.key === '=') setView((v) => zoomAt(v, v.z * 1.15, side / 2, side / 2));
    if (e.key === '-') setView((v) => zoomAt(v, v.z / 1.15, side / 2, side / 2));
  };

  const done = async () => {
    const s = base * view.z;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img.el, -view.x / s, -view.y / s, side / s, side / s, 0, 0, OUT, OUT);
    onDone(await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', 0.85)));
  };

  const s = base * view.z;
  return (
    <dialog ref={dialog} className="cropper" aria-labelledby="cropper-title"
            onCancel={(e) => { e.preventDefault(); onCancel(); }}>
      <h2 id="cropper-title">Sistema la foto</h2>
      <p className="hint">Trascina per spostarla, allarga due dita per ingrandirla.</p>
      <div ref={stage} className="crop-stage" tabIndex={0} aria-label="Anteprima: frecce per spostare, + e − per ingrandire"
           onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
           onPointerCancel={onPointerUp} onKeyDown={onKeyDown}>
        {img && side > 0 && (
          <img src={img.url} alt="" draggable={false}
               style={{ width: img.w * s, height: img.h * s, transform: `translate(${view.x}px, ${view.y}px)` }} />
        )}
        <span className="crop-mask" aria-hidden="true" />
      </div>
      <label className="crop-zoom">
        <span aria-hidden="true">−</span>
        <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={view.z} aria-label="Ingrandimento"
               onChange={(e) => setView((v) => zoomAt(v, Number(e.target.value), side / 2, side / 2))} />
        <span aria-hidden="true">+</span>
      </label>
      <div className="crop-actions">
        <button type="button" className="quiet" onClick={() => onCancel()}>Annulla</button>
        <button type="button" onClick={done} disabled={!img}>Usa foto</button>
      </div>
    </dialog>
  );
}
