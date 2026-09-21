// Mentre arriva Classifica o Confronto: la testata resta, qui sotto un segnaposto alto quanto
// lo schermo, così la pagina non si accorcia e lo scroll resta dov'è.
export default function Loading() {
  return (
    <div className="skeleton sk-section" aria-busy="true">
      <div className="sk sk-card small" />
      <div className="sk sk-card" />
      <div className="sk sk-card" />
      <div className="sk sk-card" />
    </div>
  );
}
