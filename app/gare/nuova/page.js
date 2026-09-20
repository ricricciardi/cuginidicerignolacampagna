import { redirect } from 'next/navigation';
import { getUserId } from '@/lib/session';
import CompetitionForm from '../form';

export default async function Nuova({ searchParams }) {
  if (!(await getUserId())) redirect('/login');
  const sp = await searchParams;
  const errors = sp.err ? JSON.parse(sp.err) : {};
  return (
    <main>
      <p className="back"><a href="/gare">Torna alle gare</a></p>
      <h1>Crea una gara</h1>
      <CompetitionForm action="/api/gare" values={sp} errors={errors} submit="Crea gara" />
    </main>
  );
}
