'use client';
import { usePathname } from 'next/navigation';
import Avatar from './avatar';
import SegmentedLinks from './segmented-links';

// L'ultimo tab è il proprio account: solo la foto Strava (o le iniziali).
export default function Nav({ name, avatar }) {
  const path = usePathname();
  const on = (href) => path.startsWith(href);
  return (
    <SegmentedLinks className="tabs" label="Sezioni" items={[
      { href: '/gare', label: 'Gare', current: on('/gare') },
      { href: '/dashboard', label: 'Le mie corse', current: on('/dashboard') },
      { href: '/account', label: <Avatar name={name} src={avatar} size="sm" />, current: on('/account'),
        className: 'tab-account', ariaLabel: 'Il mio account', title: 'Il mio account', thumb: false },
    ]} />
  );
}
