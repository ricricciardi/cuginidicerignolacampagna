'use client';
import { usePathname } from 'next/navigation';

const TABS = [
  ['/gare', 'Gare'],
  ['/dashboard', 'Le mie corse'],
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="tabs" aria-label="Sezioni">
      {TABS.map(([href, label]) => (
        <a key={href} href={href} aria-current={path.startsWith(href) ? 'page' : undefined}>{label}</a>
      ))}
    </nav>
  );
}
