const PX = { sm: 32, md: 40, lg: 72 };

// Foto profilo del cugino (caricata o di Strava). Senza foto, le iniziali.
// me: è il tuo avatar. Da fermo ha attorno un cerchio lime; ogni 3 secondi, con il logo, il cerchio
// si apre nella C, compaiono gli anelli rosa e azzurro e girano, poi si richiude (globals.css).
export default function Avatar({ name, src, size = 'md', me = false }) {
  const initials = (name ?? '')
    .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  const face = src ? (
    <img className={`avatar ${size}`} src={src} alt="" width={PX[size]} height={PX[size]} />
  ) : (
    <span className={`avatar ${size} initials`} aria-hidden="true">{initials}</span>
  );
  if (!me) return face;
  return (
    <span className={`avatar-me ${size}`}>
      {face}
      <svg className="me-rings" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle className="ring ring-lime" cx="50" cy="50" r="47" pathLength="100" strokeWidth={4.5} />
        <path className="ring ring-pink" d="M80.05 19.95A42.5 42.5 0 1 0 80.05 80.05" strokeWidth={3} />
        <path className="ring ring-cyan" d="M77.44 22.56A38.8 38.8 0 1 0 77.44 77.44" strokeWidth={2.2} />
      </svg>
    </span>
  );
}
