'use client';

// Logo dell'intestazione: un tocco riporta in cima alla pagina (come la barra di stato su iOS).
export default function Brand() {
  const toTop = (e) => {
    e.preventDefault();
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  };
  return (
    <a className="brand" href="#" onClick={toTop} aria-label="Cuginidicerignolacampagna, torna in cima">
      <img src="/logo.png" alt="" width="29" height="32" />
      <span aria-hidden="true">uginidicerignolacampagna</span>
    </a>
  );
}
