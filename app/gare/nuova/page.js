import Link from 'next/link';
import { requireAdminPage, allPeople } from '@/lib/admin';
import { queryToForm } from '@/lib/competition';
import { getT } from '@/lib/lingua';
import CompetitionForm from '../form';

export default async function Nuova({ searchParams }) {
  await requireAdminPage();
  const t = await getT();
  const sp = await searchParams;
  const people = await allPeople();
  const errors = sp.err ? JSON.parse(sp.err) : {};
  // Prima volta: tutti gli iscritti già spuntati e coefficiente acceso.
  const values = sp.err ? queryToForm(sp) : { participants: people.map((p) => p.id), age_grading: true };
  return (
    <main>
      <p className="back"><Link href="/gare/impostazioni">{t('Torna alle impostazioni')}</Link></p>
      <h1>{t('Crea una gara')}</h1>
      <CompetitionForm action="/api/gare" values={values} people={people} errors={errors} submit={t('Crea gara')} />
    </main>
  );
}
