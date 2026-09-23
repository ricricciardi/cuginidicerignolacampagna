import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { isAdmin, requireStravaUser } from '@/lib/admin';
import { phase, statusLine, fmtDay, DIST_MAX } from '@/lib/competition';
import { competitionRuns, participants, standings, ageStandings, kmStandings, periodActivities } from '@/lib/standings';
import { MIN_GRADE_M } from '@/lib/agegrade';
import Avatar from '../avatar';
import { getT } from '@/lib/lingua';

const ORDER = { running: 0, before: 1, over: 2 };

export default async function Gare() {
  const userId = await requireStravaUser();
  const [admin, t] = await Promise.all([isAdmin(userId), getT()]);
  const now = new Date();
  const comps = (admin
    ? await sql`select id, name, distance_m, start_date, end_date, age_grading, total_km from competitions order by start_date desc, id desc`
    : await sql`select c.id, c.name, c.distance_m, c.start_date, c.end_date, c.age_grading, c.total_km from competitions c
                join competition_participants p on p.competition_id = c.id and p.user_id = ${userId}
                order by c.start_date desc, c.id desc`)
    .map((c) => ({ ...c, phase: phase(c, now) }))
    // Prima le gare in corso, poi le future, infine le finite; dentro ogni gruppo le più lunghe in alto
    // (quelle a km totali, senza distanza, per prime).
    .sort((a, b) => ORDER[a.phase] - ORDER[b.phase] || (b.distance_m ?? DIST_MAX + 1) - (a.distance_m ?? DIST_MAX + 1));
  // Una sola gara: inutile passare dall'elenco, si va dritti alla classifica.
  if (comps.length === 1) redirect(`/gare/${comps[0].id}`);
  // Chi è in testa in ogni gara, con la stessa classifica che si apre entrando (punteggio, se c'è).
  const leaders = await Promise.all(comps.map((c) => (c.phase === 'before' ? null : leader(c))));

  return (
    <main>
      <h1>{t('Gare')}</h1>
      <p>{t('Ogni gara ha la sua distanza e le sue date. Le stesse corse Strava valgono per tutte.')} <Link href="/regolamento">{t('Leggi il regolamento')}</Link></p>

      {comps.length === 0 ? (
        <p>{admin ? <>{t('Ancora nessuna gara. Creala da')} <Link href="/gare/impostazioni">{t('Impostazioni gare')}</Link>.</> : t('Non partecipi ancora a nessuna gara: ti aggiunge l\'amministratore.')}</p>
      ) : (
        <ul className="comps">
          {comps.map((c, i) => (
            <li key={c.id} className={c.phase}>
              <Link href={`/gare/${c.id}`}>
                {/* Gara a km totali: al posto della distanza, i km di chi è in testa (0 finché nessuno corre). */}
                {c.total_km ? <span className="comp-km">{fmtLeaderKm(leaders[i]?.meters ?? 0)}<small>km</small></span> :
                <span className="comp-km">{c.distance_m < 1000 ? c.distance_m : (c.distance_m / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })}<small>{c.distance_m < 1000 ? 'm' : 'km'}</small></span>}
                <span className="comp-main">
                  <strong>{c.name}</strong>
                  <small>{fmtDay(c.start_date)} – {fmtDay(c.end_date)}</small>
                  <span className="comp-status">{statusLine(c, now, t)}</span>
                </span>
                {leaders[i] && (
                  <span className="comp-leader">
                    <Avatar name={leaders[i].athlete_name} src={leaders[i].avatar_url} size="sm" />
                    <CrownIcon />
                    <span className="sr-only">{t('In testa: {chi}', { chi: leaders[i].athlete_name })}</span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

// Km di chi è in testa, nel riquadro della distanza: un decimale sotto i 100 km, poi interi (più corti).
const fmtLeaderKm = (m) => (m / 1000).toLocaleString('it-IT', { maximumFractionDigits: m < 100000 ? 1 : 0 });

// Primo in classifica di una gara, o null se non ha ancora corso nessuno.
async function leader(c) {
  if (c.total_km) {
    const [acts, people] = await Promise.all([periodActivities(c), participants(c)]);
    const [top] = kmStandings(acts, people);
    return top?.meters ? top : null;
  }
  const graded = c.age_grading && c.distance_m >= MIN_GRADE_M;
  const [runs, people] = await Promise.all([competitionRuns(c), participants(c)]);
  const [top] = graded ? ageStandings(runs, people) : standings(runs, people);
  const scored = top && (graded ? top.pct != null : top.time_s != null);
  return scored ? top : null;
}

function CrownIcon() {
  return (
    <svg className="comp-crown" viewBox="0 0 24 18" aria-hidden="true" focusable="false">
      <path d="M2 15.5h20L20.5 4l-5 4L12 1.5 8.5 8l-5-4L2 15.5Z" />
    </svg>
  );
}
