export const metadata = { title: 'Regolamento — Cuginidicerignolacampagna' };

// Regolamento: descrive le regole così come il sito le applica.
export default function Regolamento() {
  return (
    <main className="rules">
      <h1>Regolamento</h1>
      <p>Le regole della gara dei cugini, così come il sito le applica.</p>

      <h2>Chi partecipa</h2>
      <ul>
        <li>Chi si registra, collega il proprio account Strava e dà il consenso a mostrare i propri tempi agli altri iscritti.</li>
        <li>Chi partecipa è in gara in tutte le gare: non c&apos;è un&apos;iscrizione gara per gara.</li>
      </ul>

      <h2>Quali corse valgono</h2>
      <ul>
        <li>Solo attività Strava di tipo corsa su strada, registrate con il GPS.</li>
        <li>Non valgono il tapis roulant, il trail, le corse virtuali e le attività inserite a mano o senza traccia GPS.</li>
        <li>Valgono anche le attività impostate su Strava come visibili «Solo io».</li>
        <li>La corsa deve superare i km della gara. Non serve fermarsi: si può correre di più.</li>
      </ul>

      <h2>Il tempo</h2>
      <ul>
        <li>Conta il tempo al passaggio dei primi km della gara, dalla partenza: per una gara da 10 km, il tempo al decimo chilometro.</li>
        <li>Si calcola sommando i parziali al chilometro registrati da Strava. La precisione è di un paio di secondi.</li>
        <li>È il tempo trascorso, come il cronometro di una gara: le soste e le pause dell&apos;orologio sono comprese.</li>
        <li>Se Strava non fornisce i parziali al chilometro, la corsa non ha un tempo e non conta.</li>
      </ul>

      <h2>Il periodo di gara</h2>
      <ul>
        <li>Ora italiana: si parte alle 00:00 del giorno di inizio e si chiude alle 24:00 del giorno di fine.</li>
        <li>Conta l&apos;ora in cui è partita la corsa. Una corsa fatta prima della chiusura vale anche se arriva su Strava dopo.</li>
      </ul>

      <h2>La classifica a tempo</h2>
      <ul>
        <li>Per ognuno conta il miglior tempo tra tutte le sue corse valide. Vince il tempo più basso.</li>
        <li>A parità di tempo è davanti chi l&apos;ha fatto per primo.</li>
        <li>«Volte» è il numero di corse valide, cioè quante volte si sono superati i km della gara.</li>
        <li>Chi non ha ancora un tempo compare in fondo, in ordine alfabetico.</li>
      </ul>

      <h2 id="eta">La classifica per età e sesso</h2>
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
          Le tabelle danno i valori per alcune distanze (5 km, 6 km, 8 km, 10 km, 12 km, 15 km, 20 km, mezza maratona e altre).
          Per le distanze in mezzo il sito usa il metodo di interpolazione ufficiale dell&apos;edizione 2025.
          Sotto il miglio (1,6 km) le tabelle non valgono, e per quelle gare il punteggio non c&apos;è.
        </li>
        <li>Servono sesso e data di nascita, da inserire in Le mie corse. La data di nascita non viene mai mostrata: gli altri vedono solo il punteggio.</li>
      </ul>
      <p>Qualche esempio sui 10 km, calcolato dal sito con le tabelle:</p>
      <ul>
        <li>Uomo di 25 anni, 45:00: standard 26:24, punteggio 58,7%.</li>
        <li>Uomo di 40 anni, 50:00: standard 27:24, punteggio 54,8%.</li>
        <li>Uomo di 62 anni, 55:00: standard 33:03, punteggio 60,1%.</li>
        <li>Donna di 55 anni, 55:00: standard 34:33, punteggio 62,8%.</li>
      </ul>
      <p>Nella classifica per età e sesso la donna di 55 anni sta davanti al venticinquenne, anche se ha corso dieci minuti più lenta.</p>

      <h2>Aggiornamento dei tempi</h2>
      <ul>
        <li>Ogni notte il sito legge da Strava le corse nuove di tutti i partecipanti.</li>
        <li>In Le mie corse il pulsante «Aggiorna adesso» legge subito le proprie.</li>
      </ul>

      <h2>Le gare</h2>
      <ul>
        <li>Ogni gara ha un nome, i km (interi, da 1 a 100), una data di inizio e una di fine.</li>
        <li>Qualsiasi iscritto crea, modifica ed elimina le gare da Impostazioni gare.</li>
        <li>Km e date si possono cambiare solo prima della partenza. Il nome si può cambiare sempre.</li>
        <li>Eliminare una gara toglie la sua classifica, ma non le corse: restano valide per le altre gare.</li>
      </ul>

      <h2>Cosa vedono gli altri</h2>
      <ul>
        <li>Nome e foto del profilo Strava, date, km e tempi delle corse valide, il numero di volte e il punteggio per età e sesso.</li>
        <li>Non vedono email, password, data di nascita né i titoli delle corse di Strava.</li>
      </ul>
    </main>
  );
}
