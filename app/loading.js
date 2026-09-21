// Mentre il server prepara la pagina: la sagoma (titolo, testo e schede) compare subito al tocco,
// così il cambio di schermata è immediato anche se i dati arrivano un attimo dopo.
export default function Loading() {
  return (
    <main className="skeleton" aria-busy="true">
      <span className="sr-only" role="status">Caricamento…</span>
      <div className="sk sk-title" />
      <div className="sk sk-line" />
      <div className="sk sk-line short" />
      <div className="sk sk-card" />
      <div className="sk sk-card" />
      <div className="sk sk-card small" />
    </main>
  );
}
