// Foto profilo Strava del cugino. Senza foto, le iniziali.
export default function Avatar({ name, src, size = 'md' }) {
  const initials = (name ?? '')
    .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  return src ? (
    <img className={`avatar ${size}`} src={src} alt="" width={size === 'lg' ? 72 : 40} height={size === 'lg' ? 72 : 40} />
  ) : (
    <span className={`avatar ${size} initials`} aria-hidden="true">{initials}</span>
  );
}
