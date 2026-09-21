'use client';

// Logo dell'intestazione: la «C» a tre anelli (lime, rosa, azzurro), disegnata in SVG così ogni
// anello si anima per conto suo (vedi .logo in globals.css: ogni 10 secondi fanno un giro).
// Un tocco riporta in cima alla pagina (come la barra di stato su iOS).
function Logo() {
  return (
    <svg className="logo" viewBox="60 60 336 392" aria-hidden="true" focusable="false">
      <path className="ring ring-lime" d="M372.7 139.3A165 165 0 1 0 372.7 372.7" strokeWidth={52} />
      <path className="ring ring-pink" d="M328.5 183.5A102.5 102.5 0 1 0 328.5 328.5" strokeWidth={31} />
      <path className="ring ring-cyan" d="M295.2 216.8A55.5 55.5 0 1 0 295.2 295.2" strokeWidth={21} />
    </svg>
  );
}

export default function Brand() {
  const toTop = (e) => {
    e.preventDefault();
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  };
  return (
    <a className="brand" href="#" onClick={toTop} aria-label="Cuginidicerignolacampagna, torna in cima">
      <Logo />
      <span aria-hidden="true">uginidicerignolacampagna</span>
    </a>
  );
}
