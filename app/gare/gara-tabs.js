'use client';
import { usePathname } from 'next/navigation';
import SegmentedLinks from '../segmented-links';

// Classifica / Confronto: la voce attiva si ricava dall'indirizzo, perché la testata sta nel
// layout e non si ridisegna quando si cambia sezione.
export default function GaraTabs({ id, ariaLabel, labels: [classifica, confronto] }) {
  const onConfronto = usePathname().endsWith('/confronto');
  return (
    <SegmentedLinks className="subtabs" label="Sezioni della gara" ariaLabel={ariaLabel} scroll={false} items={[
      { href: `/gare/${id}`, label: classifica, current: !onConfronto },
      { href: `/gare/${id}/confronto`, label: confronto, current: onConfronto },
    ]} />
  );
}
