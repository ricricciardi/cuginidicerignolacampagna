const PX = { sm: 32, md: 40, lg: 72 };

// Foto profilo Strava del cugino. Senza foto, le iniziali.
export default function Avatar({ name, src, size = 'md' }) {
  const initials = (name ?? '')
    .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  return src ? (
    <img className={`avatar ${size}`} src={src} alt="" width={PX[size]} height={PX[size]} />
  ) : (
    <span className={`avatar ${size} initials`} aria-hidden="true">{initials}</span>
  );
}
