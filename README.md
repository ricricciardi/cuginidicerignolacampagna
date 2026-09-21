# Cuginidicerignolacampagna

Sito Next.js per Vercel: account con email e password, collegamento a Strava,
storico delle corse su strada con i parziali al km, più gare con km e date
proprie, classifica, confronto e pagina dei progressi di ogni iscritto.

Classifica e progressi mostrano i dati Strava di un utente agli altri iscritti.
L'accordo API Strava lo vieta, salvo consenso esplicito: il sito chiede il consenso
prima del collegamento e lo salva con la data (`consent_at`). Strava può comunque
revocare l'accesso all'app.

## Messa in funzione

1. Crea l'app su https://www.strava.com/settings/api. In "Authorization Callback
   Domain" metti il dominio del sito (es. `cuginidicerignolacampagna.vercel.app`, oppure `localhost`
   per le prove). Annota Client ID e Client Secret.
2. Importa il progetto su Vercel e aggiungi un database Postgres (Neon) dal
   marketplace: Vercel imposta `DATABASE_URL`.
3. Esegui `schema.sql` sul database (console SQL di Neon).
4. Imposta le variabili d'ambiente elencate in `.env.example`.
5. Fai il deploy.

In locale: copia `.env.example` in `.env.local`, compila i valori, poi
`npm install` e `npm run dev`. I test del filtro: `npm test`.

## Regole di selezione (lib/filter.js)

- `sport_type` uguale a `Run`: esclude trail (`TrailRun`) e virtuale (`VirtualRun`).
- Escluso il tapis roulant (`trainer: true`).
- Distanza strettamente maggiore di 10.000 m.
- Escluse le attività senza GPS: inserite a mano o registrate senza traccia.
- Contano anche le attività «Solo io» (permesso `activity:read_all`).

## Gare (lib/competition.js)

- Ogni gara ha nome, km (intero, da 1 a 100), data di inizio e data di fine.
- Ora italiana: si parte alle 00:00 del giorno di inizio e si chiude alle 24:00 del
  giorno di fine. Conta l'ora di partenza della corsa: una corsa fatta entro la
  chiusura vale anche se arriva dopo.
- Solo l'amministratore (`users.is_admin`, si imposta dal database) crea, modifica ed elimina
  le gare da Impostazioni gare e gestisce gli utenti (Il mio account → Utenti).
- Nome, km, date e partecipanti si cambiano anche a gara partita: classifiche e tempi
  si ricalcolano dai parziali salvati.
- Ogni gara ha i suoi partecipanti (`competition_participants`): chi non partecipa non la
  vede (l'amministratore le vede tutte).
- Per ogni gara si sceglie se applicare il coefficiente età e sesso (`age_grading`):
  senza, c'è solo la classifica a tempo.
- Le stesse corse valgono per tutte le gare: il tempo di ogni gara si calcola dai
  parziali salvati, senza richiamare Strava.

## Tempo sui primi N km (lib/efforts.js)

- È il tempo al passaggio dell'N-esimo chilometro dalla partenza: somma dei primi N
  parziali al km (`splits_metric`) di Strava, tempo trascorso con le pause.
  Nessuno deve fermare l'attività a N km.
- Per ogni corsa si salvano i parziali (distanza, tempo trascorso, tempo in movimento).
- I parziali si leggono dal dettaglio dell'attività: una chiamata API per corsa, solo
  per le corse nuove. Ogni aggiornamento ne elabora al massimo 25 per utente.
- Classifica: miglior tempo di ciascuno; a parità vince chi l'ha fatto prima.
  La colonna "Volte" conta le corse della gara con il tempo al passaggio calcolato.
- Grafici: asse verticale invertito, più in alto è più veloce.

## Classifica per età e sesso (lib/agegrade.js)

- Tabelle USATF MLDR Road Age Standards 2025 (Alan Jones), approvate il 10/1/2025.
  Fonte: https://github.com/AlanLyttonJones/Age-Grade-Tables, cartella "2025 Files".
- `lib/agegrade-data.js` è generato da `scripts/build-agegrade.py` (serve `openpyxl`):
  per aggiornare le tabelle si rilancia lo script sulla cartella scaricata.
- Punteggio = standard per età, sesso e distanza / tempo, in percentuale. Età compiuta
  il giorno della corsa. Distanze intermedie con l'interpolazione ufficiale 2025.
- Sesso e data di nascita si inseriscono in Le mie corse; la data non viene mostrata.
- Il regolamento completo per i partecipanti è la pagina /regolamento.

## Aggiornamento dei dati (lib/sync.js)

- Ogni notte Vercel Cron chiama `/api/cron/sync` (vercel.json, `0 2 * * *` in UTC:
  le 4:00 italiane d'estate, le 3:00 d'inverno). Sul piano Hobby l'orario è garantito
  solo entro l'ora (±59 minuti).
- A ogni lettura aggiorna nome e foto profilo dell'atleta da Strava (una chiamata in più).
- Legge le corse che servono alle gare già partite: periodo = unione dei loro periodi,
  distanza oltre i km della gara più corta. Se nessuna gara è partita non fa nulla.
- Aggiorna tutti gli iscritti, partendo da chi è stato aggiornato meno di recente. Se
  finisce il tempo (50 secondi) o il limite di richieste Strava, riprende la notte dopo.
- Serve la variabile `CRON_SECRET`: Vercel la manda come `Authorization: Bearer`.
- Il pulsante "Aggiorna adesso" aggiorna solo chi lo preme, in qualsiasi momento.

## Limiti noti

- Ogni sincronizzazione rilegge l'elenco del periodo di gara
  (una chiamata API ogni 200 attività), più una chiamata per ogni corsa nuova.
- Le corse già salvate non si aggiornano e restano anche se cancellate su Strava.

Le righe `DA DECIDERE` nel codice sono comportamenti provvisori in attesa di una scelta.
