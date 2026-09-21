'use client';
import { useState } from 'react';
import SegmentedLinks from '../../segmented-links';

// Tempo, Miglior parziale e Punteggio arrivano già tutte dal server: si passa dall'una all'altra
// nel browser. Prima si navigava, e mentre arrivava la vista nuova la schermata di caricamento
// accorciava la pagina e faceva tornare in cima.
export default function ViewTabs({ items, panels, initial, ariaLabel }) {
  const [active, setActive] = useState(initial);
  return (
    <>
      <SegmentedLinks className="segmented view-switch" label="Tipo di classifica" ariaLabel={ariaLabel}
        items={items.map((it, i) => ({ ...it, current: i === active }))}
        onSelect={(i) => {
          setActive(i);
          // L'indirizzo segue la vista (per ricaricare o condividere), senza navigare.
          window.history.replaceState(null, '', items[i].href);
        }} />
      {panels.map((p, i) => <div key={items[i].href} hidden={i !== active}>{p}</div>)}
    </>
  );
}
