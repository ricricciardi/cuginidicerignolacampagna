import { notFound, redirect } from 'next/navigation';
import { getUserId } from '@/lib/session';
import { loadCompetition } from '@/lib/standings';
import { phase } from '@/lib/competition';
import CompetitionForm from '../../form';

export default async function Modifica({ params, searchParams }) {
  if (!(await getUserId())) redirect('/login');
  const c = await loadCompetition((await params).id);
  if (!c) notFound();
  const sp = await searchParams;
  const errors = sp.err ? JSON.parse(sp.err) : {};
  const values = sp.err ? sp : c;
  const locked = phase(c) !== 'before';
  return (
    <main>
      <p className="back"><a href="/gare/impostazioni">Torna alle impostazioni</a></p>
      <h1>Modifica gara</h1>
      {locked && <div className="notice">La gara è partita: si può cambiare solo il nome.</div>}
      <CompetitionForm action={`/api/gare/${c.id}`} values={values} errors={errors}
                       submit="Salva modifiche" locked={locked} />
    </main>
  );
}
