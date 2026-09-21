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

## Foto profilo

- Di base è quella di Strava, aggiornata a ogni lettura.
- Dall'account si può caricare una foto: il browser la ritaglia quadrata e la riduce a
  256×256 JPEG (~20 KB), che si salva in `users.photo` (base64) con la versione in
  `users.photo_v`. Ha la precedenza su quella di Strava e si serve da `/api/foto/<id>?v=…`,
  solo a chi ha fatto l'accesso.

## Notifiche push

- Si attivano da Il mio account → Notifiche, per dispositivo. Su iPhone solo dall'app
  aggiunta alla schermata Home (iOS 16.4+).
- Servono le variabili `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (da
  `npx web-push generate-vapid-keys`) e `VAPID_SUBJECT` (`mailto:…`). Senza, non parte niente.
- Quando partono (lib/notify.js):
  - sorpassi e nuovi record: confronto delle classifiche a tempo prima e dopo
    l'aggiornamento (notturno o «Aggiorna adesso da Strava»), per le gare in corso o chiuse
    da meno di 3 giorni;
  - gara che parte oggi / ultimo giorno: dall'aggiornamento notturno, una volta sola
    (`notifications_sent`);
  - aggiunto a una gara: quando l'amministratore salva i partecipanti (non a sé stesso);
  - auguri di compleanno: dall'aggiornamento notturno, solo al festeggiato, una volta all'anno;
  - nuovo tempo: per ogni corsa nuova che vale in una gara, a tutti i partecipanti (anche a chi ha corso)
    («Nuovo tempo 10 minuti e 23 secondi — Riccardo stat atteint, vè chien!!», frase fissa in tutte le lingue).
- Le iscrizioni scadute si cancellano da sole al primo invio fallito.

## Avvisi in tempo reale da Strava (webhook)

- `/api/strava/webhook`: Strava avvisa di corse create, modificate, cancellate e di accessi revocati.
  Gli avvisi non sono firmati: prima di salvare o cancellare si ricontrolla su Strava con il token
  del cugino (lib/strava-webhook.js). Una corsa cancellata o non più valida esce dalle classifiche;
  una corsa nuova arriva subito, con classifiche e notifiche.
- Iscrizione una tantum: Il mio account → Amministrazione → «Attiva o controlla gli aggiornamenti da
  Strava» (usa STRAVA_CLIENT_ID/SECRET e APP_URL; la parola di verifica deriva da CRON_SECRET).
- Nelle pagine con dati di Strava (gare e Le mie corse) c'è in fondo «Un'app dei
  Cuginidicerignolacampagna · dati da» + logo ufficiale «Powered by Strava» (public/powered-by-strava.svg),
  come chiedono le regole di Strava (app/strava-attrib.js).

## Regole di selezione (lib/filter.js)

- `sport_type` uguale a `Run` o `Walk`: esclude trail (`TrailRun`), virtuale (`VirtualRun`) ed escursione (`Hike`).
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
- Per ogni gara si sceglie anche se contare il miglior tratto (`best_segment`): il pezzo più
  veloce lungo quanto la gara, in qualunque punto della corsa, invece del tempo dalla partenza.
  Colonna aggiunta dopo: `alter table competitions add column if not exists best_segment boolean not null default false;`
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

- Ogni notte Vercel Cron chiama `/api/cron/sync` (vercel.json, `0 5 * * *` in UTC:
  le 7:00 italiane d'estate, le 6:00 d'inverno). Sul piano Hobby l'orario è garantito
  solo entro l'ora (±59 minuti).
- A ogni lettura aggiorna nome e foto profilo dell'atleta da Strava (una chiamata in più).
- Legge le corse che servono alle gare già partite: periodo = unione dei loro periodi,
  distanza oltre i km della gara più corta. Se nessuna gara è partita non fa nulla.
- Aggiorna tutti gli iscritti, partendo da chi è stato aggiornato meno di recente. Se
  finisce il tempo (50 secondi) o il limite di richieste Strava, riprende la notte dopo.
- Serve la variabile `CRON_SECRET`: Vercel la manda come `Authorization: Bearer`.
- Il pulsante "Aggiorna adesso da Strava" aggiorna solo chi lo preme, in qualsiasi momento.

## Limiti noti

- Ogni sincronizzazione rilegge l'elenco del periodo di gara
  (una chiamata API ogni 200 attività), più una chiamata per ogni corsa nuova.
- Le corse già salvate non si aggiornano e restano anche se cancellate su Strava.

Le righe `DA DECIDERE` nel codice sono comportamenti provvisori in attesa di una scelta.
