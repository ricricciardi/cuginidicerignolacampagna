'use client';
import { usePathname } from 'next/navigation';
import Avatar from './avatar';
import SegmentedLinks from './segmented-links';
import { useT } from './lang-provider';

// L'ultimo tab è il proprio account: solo la foto. Quando sei lì il cursore lime va anche su di lei.
export default function Nav({ name, avatar }) {
  const path = usePathname();
  const t = useT();
  // Nella pagina «Collega Strava» non ci sono tab: finché non colleghi Strava non c'è altro da fare.
  if (path.startsWith('/collega-strava')) return null;
  const on = (href) => path.startsWith(href);
  return (
    <SegmentedLinks className="tabs" label="Sezioni" ariaLabel={t('Sezioni')} items={[
      { href: '/gare', label: t('Gare'), current: on('/gare') },
      { href: '/dashboard', label: t('Le mie corse'), current: on('/dashboard') },
      { href: '/account', label: <Avatar name={name} src={avatar} size="sm" me />, current: on('/account'),
        className: 'tab-account', ariaLabel: t('Il mio account'), title: t('Il mio account') },
    ]} />
  );
}
