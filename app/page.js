import { redirect } from 'next/navigation';
import { getUserId } from '@/lib/session';

export default async function Home() {
  redirect((await getUserId()) ? '/gare' : '/login');
}
