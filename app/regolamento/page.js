export const metadata = { title: 'Regolamento — Cuginidicerignolacampagna' };

// Regolamento: descrive le regole così come il sito le applica.
// Ogni sezione ha un'ancora: l'indice in alto ci porta con un tocco.
const SECTIONS = [
  {
    id: 'chi', title: 'Chi partecipa',
    body: (
      <ul>
        <li>Per ogni gara l&apos;amministratore sceglie chi partecipa. Le gare a cui non partecipi non le vedi.</li>
        <li>Chi si iscrive al sito entra in una gara quando l&apos;amministratore lo aggiunge.</li>
        <li>Per comparire in classifica serve anche aver collegato Strava e dato il consenso a mostrare i propri tempi agli altri partecipanti.</li>
        <li>Chi partecipa ma non ha ancora un tempo compare in fondo alla classifica.</li>
      </ul>
    ),
  },
  {
    id: 'corse', title: 'Quali corse valgono',
    body: (
      <ul>
        <li>Solo attività Strava di tipo corsa su strada, registrate con il GPS.</li>
        <li>Non valgono il tapis roulant, il trail, le corse virtuali e le attività inserite a mano o senza traccia GPS.</li>
        <li>Valgono anche le attività impostate su Strava come visibili «Solo io».</li>
        <li>La corsa deve superare i km della gara. Non serve fermarsi: si può correre di più.</li>
      </ul>
    ),
  },
  {
    id: 'tempo', title: 'Il tempo',
    body: (
      <ul>
        <li>Conta il tempo al passaggio dei primi km della gara, dalla partenza: per una gara da 10&nbsp;km, il tempo al decimo chilometro.</li>
        <li>Si calcola sommando i parziali al chilometro registrati da Strava. La precisione è di un paio di secondi.</li>
        <li>È il tempo trascorso, come il cronometro di una gara: le soste e le pause dell&apos;orologio sono comprese.</li>
        <li>Se Strava non fornisce i parziali al chilometro, la corsa non ha un tempo e non conta.</li>
        <li>
          Accanto a ogni tempo c&apos;è il dislivello netto sui km della gara: la differenza di quota tra la partenza
          e il passaggio all&apos;ultimo km (↓ discesa, ↑ salita). È solo un&apos;informazione, non cambia la classifica.
        </li>
      </ul>
    ),
  },
  {
    id: 'periodo', title: 'Il periodo di gara',
    body: (
      <ul>
        <li>Ora italiana: si parte alle 00:00 del giorno di inizio e si chiude alle 24:00 del giorno di fine.</li>
        <li>Conta l&apos;ora in cui è partita la corsa. Una corsa fatta prima della chiusura vale anche se arriva su Strava dopo.</li>
      </ul>
    ),
  },
  {
    id: 'classifica', title: 'La classifica a tempo',
    body: (
      <ul>
        <li>Per ognuno conta il miglior tempo tra tutte le sue corse valide. Vince il tempo più basso.</li>
        <li>A parità di tempo è davanti chi l&apos;ha fatto per primo.</li>
        <li>«Volte» è il numero di corse valide, cioè quante volte si sono superati i km della gara.</li>
        <li>Chi non ha ancora un tempo compare in fondo, in ordine alfabetico.</li>
        <li>Accanto a ogni tempo c&apos;è il dislivello netto: solo un&apos;informazione, non sposta nessuno in classifica.</li>
      </ul>
    ),
  },
  {
    id: 'eta', title: 'La classifica a punteggio',
    body: (
      <>
        <p>
          C&apos;è solo nelle gare in cui l&apos;amministratore applica il coefficiente età e sesso:
          nelle altre la classifica è solo a tempo.
        </p>
        <p>
          Per confrontare cugini di età e sesso diversi il sito usa l&apos;age grading, con le tabelle
          USATF MLDR Road Age Standards 2025 curate da Alan Jones e approvate il 10 gennaio 2025
          dal Masters Long Distance Running Council della federazione di atletica statunitense.
          Sono le tabelle pensate per la corsa su strada e coprono età da 5 a 100 anni.
        </p>
        <ul>
          <li>Per ogni età, sesso e distanza la tabella indica lo «standard»: il miglior tempo al mondo per quell&apos;età e quel sesso.</li>
          <li>Il punteggio è lo standard diviso per il tuo tempo, in percentuale. Il 100% è un record mondiale di categoria. Più alto è meglio.</li>
          <li>Conta l&apos;età compiuta il giorno della corsa. Per ognuno vale il miglior punteggio; a parità, chi l&apos;ha fatto prima.</li>
          <li>
            Le tabelle danno i valori per alcune distanze (5&nbsp;km, 6&nbsp;km, 8&nbsp;km, 10&nbsp;km, 12&nbsp;km, 15&nbsp;km, 20&nbsp;km, mezza maratona e altre).
            Per le distanze in mezzo il sito usa il metodo di interpolazione ufficiale dell&apos;edizione 2025.
            Sotto il miglio (1,6&nbsp;km) le tabelle non valgono, e per quelle gare il punteggio non c&apos;è.
          </li>
          <li>
            Servono sesso e data di nascita, da inserire nel <a href="/account#profilo">tuo account</a>.
            La data di nascita non viene mai mostrata: gli altri vedono solo il punteggio.
          </li>
        </ul>
        <h3>Qualche esempio sui 10&nbsp;km</h3>
        <table className="rules-table">
          <thead>
            <tr><th scope="col">Chi</th><th scope="col">Tempo</th><th scope="col">Standard</th><th scope="col">Punteggio</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Uomo, 25 anni</th><td>45:00</td><td>26:24</td><td>58,7%</td></tr>
            <tr><th scope="row">Uomo, 40 anni</th><td>50:00</td><td>27:24</td><td>54,8%</td></tr>
            <tr><th scope="row">Uomo, 62 anni</th><td>55:00</td><td>33:03</td><td>60,1%</td></tr>
            <tr><th scope="row">Donna, 55 anni</th><td>55:00</td><td>34:33</td><td>62,8%</td></tr>
          </tbody>
        </table>
        <p className="rules-note">
          Nella classifica a punteggio la donna di 55 anni sta davanti al venticinquenne, anche se ha corso dieci minuti più lenta.
        </p>
      </>
    ),
  },
  {
    id: 'aggiornamento', title: 'Aggiornamento dei tempi',
    body: (
      <ul>
        <li>Ogni notte il sito legge da Strava le corse nuove di tutti i partecipanti.</li>
        <li>In Le mie corse il pulsante «Aggiorna adesso da Strava» legge subito le proprie.</li>
        <li>Se una gara viene allungata o anticipata, le corse del nuovo periodo arrivano con l&apos;aggiornamento successivo.</li>
      </ul>
    ),
  },
  {
    id: 'gare', title: 'Le gare',
    body: (
      <ul>
        <li>Le gare le crea, modifica ed elimina l&apos;amministratore del sito.</li>
        <li>Ogni gara ha un nome, i km (interi, da 1 a 100), una data di inizio, una di fine e i suoi partecipanti.</li>
        <li>Nome, km, date e partecipanti si possono cambiare anche a gara partita: classifiche e tempi si ricalcolano.</li>
        <li>Per ogni gara l&apos;amministratore decide se applicare il coefficiente età e sesso: se non lo applica, c&apos;è solo la classifica a tempo.</li>
        <li>Eliminare una gara toglie la sua classifica, ma non le corse: restano valide per le altre gare.</li>
      </ul>
    ),
  },
  {
    id: 'privacy', title: 'Cosa vedono gli altri',
    body: (
      <ul>
        <li>
          Gli altri partecipanti della stessa gara vedono il nome Strava, la foto (quella caricata nel sito o, se non c&apos;è, quella di Strava), date, km, tempi, parziali al km
          e dislivello delle corse valide, il numero di volte e, nelle gare con il coefficiente, il punteggio.
        </li>
        <li>Chi non partecipa a una gara non vede niente di quella gara.</li>
        <li>Nessuno vede email, password, data di nascita né i titoli delle corse di Strava.</li>
        <li>
          L&apos;amministratore vede in più l&apos;email degli iscritti, lo stato del collegamento a Strava, quante corse
          sono salvate e se sesso e data di nascita sono inseriti, ma non la data. Può eliminare un utente: spariscono
          account, collegamento a Strava e corse salvate.
        </li>
      </ul>
    ),
  },
];

const num = (i) => String(i + 1).padStart(2, '0');

export default function Regolamento() {
  return (
    <main className="rules" id="inizio">
      <h1>Regolamento</h1>
      <p className="rules-lead">Le regole della gara dei cugini, così come il sito le applica.</p>

      <nav className="rules-toc" aria-labelledby="indice">
        <h2 id="indice">Indice</h2>
        <ol>
          {SECTIONS.map((s, i) => (
            <li key={s.id}><a href={`#${s.id}`}><span className="n">{num(i)}</span>{s.title}</a></li>
          ))}
        </ol>
      </nav>

      {SECTIONS.map((s, i) => (
        <section key={s.id} id={s.id} className="rules-section" aria-labelledby={`${s.id}-t`}>
          <h2 id={`${s.id}-t`}><span className="n" aria-hidden="true">{num(i)}</span>{s.title}</h2>
          {s.body}
          <a className="to-toc" href="#indice">Torna all&apos;indice</a>
        </section>
      ))}
    </main>
  );
}
