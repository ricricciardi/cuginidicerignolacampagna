import Link from 'next/link';
import { getT } from '@/lib/lingua';
export async function generateMetadata() {
  const t = await getT();
  return { title: `${t('Regolamento')} — Cuginidicerignolacampagna` };
}

// Regolamento: descrive le regole così come il sito le applica.
// Ogni sezione ha un'ancora: l'indice in alto ci porta con un tocco.
const sections = (t) => [
  {
    id: 'chi', title: t('Chi partecipa'),
    body: (
      <ul>
        <li>{t('Per ogni gara l\'amministratore sceglie chi partecipa. Le gare a cui non partecipi non le vedi.')}</li>
        <li>{t('Chi si iscrive al sito entra in una gara quando l\'amministratore lo aggiunge.')}</li>
        <li>{t('Per comparire in classifica serve anche aver collegato Strava e dato il consenso a mostrare i propri tempi agli altri partecipanti.')}</li>
        <li>{t('Chi partecipa ma non ha ancora un tempo compare in fondo alla classifica.')}</li>
      </ul>
    ),
  },
  {
    id: 'corse', title: t('Quali corse valgono'),
    body: (
      <ul>
        <li>{t('Solo attività Strava di tipo corsa su strada, registrate con il GPS.')}</li>
        <li>{t('Non valgono il tapis roulant, il trail, le corse virtuali e le attività inserite a mano o senza traccia GPS.')}</li>
        <li>{t('Valgono anche le attività impostate su Strava come visibili «Solo io».')}</li>
        <li>{t('La corsa deve superare i km della gara. Non serve fermarsi: si può correre di più.')}</li>
      </ul>
    ),
  },
  {
    id: 'tempo', title: t('Il tempo'),
    body: (
      <ul>
        <li>{t('Conta il tempo al passaggio dei primi km della gara, dalla partenza: per una gara da 10 km, il tempo al decimo chilometro.')}</li>
        <li>{t('Si calcola sommando i parziali al chilometro registrati da Strava. La precisione è di un paio di secondi.')}</li>
        <li>{t('È il tempo trascorso, come il cronometro di una gara: le soste e le pause dell\'orologio sono comprese.')}</li>
        <li>{t('Se Strava non fornisce i parziali al chilometro, la corsa non ha un tempo e non conta.')}</li>
        <li>{t('Accanto a ogni tempo c\'è il dislivello netto sui km della gara: la differenza di quota tra la partenza e il passaggio all\'ultimo km (↓ discesa, ↑ salita). È solo un\'informazione, non cambia la classifica.')}</li>
      </ul>
    ),
  },
  {
    id: 'periodo', title: t('Il periodo di gara'),
    body: (
      <ul>
        <li>{t('Ora italiana: si parte alle 00:00 del giorno di inizio e si chiude alle 24:00 del giorno di fine.')}</li>
        <li>{t('Conta l\'ora in cui è partita la corsa. Una corsa fatta prima della chiusura vale anche se arriva su Strava dopo.')}</li>
      </ul>
    ),
  },
  {
    id: 'classifica', title: t('La classifica a tempo'),
    body: (
      <ul>
        <li>{t('Per ognuno conta il miglior tempo tra tutte le sue corse valide. Vince il tempo più basso.')}</li>
        <li>{t('A parità di tempo è davanti chi l\'ha fatto per primo.')}</li>
        <li>{t('«Volte» è il numero di corse valide, cioè quante volte si sono superati i km della gara.')}</li>
        <li>{t('Chi non ha ancora un tempo compare in fondo, in ordine alfabetico.')}</li>
        <li>{t('Accanto a ogni tempo c\'è il dislivello netto: solo un\'informazione, non sposta nessuno in classifica.')}</li>
      </ul>
    ),
  },
  {
    id: 'eta', title: t('La classifica a punteggio'),
    body: (
      <>
        <p>{t('C\'è solo nelle gare in cui l\'amministratore applica il coefficiente età e sesso: nelle altre la classifica è solo a tempo.')}</p>
        <p>{t('Per confrontare cugini di età e sesso diversi il sito usa l\'age grading, con le tabelle USATF MLDR Road Age Standards 2025 curate da Alan Jones e approvate il 10 gennaio 2025 dal Masters Long Distance Running Council della federazione di atletica statunitense. Sono le tabelle pensate per la corsa su strada e coprono età da 5 a 100 anni.')}</p>
        <ul>
          <li>{t('Per ogni età, sesso e distanza la tabella indica lo «standard»: il miglior tempo al mondo per quell\'età e quel sesso.')}</li>
          <li>{t('Il punteggio è lo standard diviso per il tuo tempo, in percentuale. Il 100% è un record mondiale di categoria. Più alto è meglio.')}</li>
          <li>{t('Conta l\'età compiuta il giorno della corsa. Per ognuno vale il miglior punteggio; a parità, chi l\'ha fatto prima.')}</li>
          <li>{t('Le tabelle danno i valori per alcune distanze (5 km, 6 km, 8 km, 10 km, 12 km, 15 km, 20 km, mezza maratona e altre). Per le distanze in mezzo il sito usa il metodo di interpolazione ufficiale dell\'edizione 2025. Sotto il miglio (1,6 km) le tabelle non valgono, e per quelle gare il punteggio non c\'è.')}</li>
          <li>
            {t('Servono sesso e data di nascita, da inserire nel')} <Link href="/account#profilo">{t('tuo account')}</Link>.
            {' '}{t('La data di nascita non viene mai mostrata: gli altri vedono solo il punteggio.')}
          </li>
        </ul>
        <h3>{t('Qualche esempio sui 10 km')}</h3>
        <table className="rules-table">
          <thead>
            <tr><th scope="col">{t('Chi')}</th><th scope="col">{t('Tempo')}</th><th scope="col">{t('Standard')}</th><th scope="col">{t('Punteggio')}</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">{t('Uomo, {n} anni', { n: 25 })}</th><td>45:00</td><td>26:24</td><td>58,7%</td></tr>
            <tr><th scope="row">{t('Uomo, {n} anni', { n: 40 })}</th><td>50:00</td><td>27:24</td><td>54,8%</td></tr>
            <tr><th scope="row">{t('Uomo, {n} anni', { n: 62 })}</th><td>55:00</td><td>33:03</td><td>60,1%</td></tr>
            <tr><th scope="row">{t('Donna, {n} anni', { n: 55 })}</th><td>55:00</td><td>34:33</td><td>62,8%</td></tr>
          </tbody>
        </table>
        <p className="rules-note">{t('Nella classifica a punteggio la donna di 55 anni sta davanti al venticinquenne, anche se ha corso dieci minuti più lenta.')}</p>
      </>
    ),
  },
  {
    id: 'aggiornamento', title: t('Aggiornamento dei tempi'),
    body: (
      <ul>
        <li>{t('Ogni mattina il sito legge da Strava le corse nuove di tutti i partecipanti.')}</li>
        <li>{t('In Le mie corse il pulsante «Aggiorna adesso da Strava» legge subito le proprie.')}</li>
        <li>{t('Se una gara viene allungata o anticipata, le corse del nuovo periodo arrivano con l\'aggiornamento successivo.')}</li>
      </ul>
    ),
  },
  {
    id: 'gare', title: t('Le gare'),
    body: (
      <ul>
        <li>{t('Le gare le crea, modifica ed elimina l\'amministratore del sito.')}</li>
        <li>{t('Ogni gara ha un nome, i km (interi, da 1 a 100), una data di inizio, una di fine e i suoi partecipanti.')}</li>
        <li>{t('Nome, km, date e partecipanti si possono cambiare anche a gara partita: classifiche e tempi si ricalcolano.')}</li>
        <li>{t('Per ogni gara l\'amministratore decide se applicare il coefficiente età e sesso: se non lo applica, c\'è solo la classifica a tempo.')}</li>
        <li>{t('Eliminare una gara toglie la sua classifica, ma non le corse: restano valide per le altre gare.')}</li>
      </ul>
    ),
  },
  {
    id: 'privacy', title: t('Cosa vedono gli altri'),
    body: (
      <ul>
        <li>{t('Gli altri partecipanti della stessa gara vedono il nome Strava, la foto (quella caricata nel sito o, se non c\'è, quella di Strava), date, km, tempi, parziali al km e dislivello delle corse valide, il numero di volte e, nelle gare con il coefficiente, il punteggio.')}</li>
        <li>{t('Chi non partecipa a una gara non vede niente di quella gara.')}</li>
        <li>{t('Nessuno vede email, password, data di nascita né i titoli delle corse di Strava.')}</li>
        <li>{t('L\'amministratore vede in più l\'email degli iscritti, lo stato del collegamento a Strava, quante corse sono salvate e se sesso e data di nascita sono inseriti, ma non la data. Può eliminare un utente: spariscono account, collegamento a Strava e corse salvate.')}</li>
      </ul>
    ),
  },
];

const num = (i) => String(i + 1).padStart(2, '0');

export default async function Regolamento() {
  const t = await getT();
  const SECTIONS = sections(t);
  return (
    <main className="rules" id="inizio">
      <h1>{t('Regolamento')}</h1>
      <p className="rules-lead">{t('Le regole della gara dei cugini, così come il sito le applica.')}</p>

      <nav className="rules-toc" aria-labelledby="indice">
        <h2 id="indice">{t('Indice')}</h2>
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
          <a className="to-toc" href="#indice">{t('Torna all\'indice')}</a>
        </section>
      ))}
    </main>
  );
}
