import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage, allPeople } from '@/lib/admin';
import { loadCompetition, participantIds } from '@/lib/standings';
import { queryToForm } from '@/lib/competition';
import CompetitionForm from '../../form';

export default async function Modifica({ params, searchParams }) {
  await requireAdminPage();
  const c = await loadCompetition((await params).id);
  if (!c) notFound();
  const sp = await searchParams;
  const errors = sp.err ? JSON.parse(sp.err) : {};
  const values = sp.err ? queryToForm(sp) : { ...c, participants: await participantIds(c.id) };
  return (
    <main>
      <p className="back"><Link href="/gare/impostazioni">Torna alle impostazioni</Link></p>
      <h1>Modifica gara</h1>
      <CompetitionForm action={`/api/gare/${c.id}`} values={values} people={await allPeople()} errors={errors}
                       submit="Salva modifiche" />
    </main>
  );
}
