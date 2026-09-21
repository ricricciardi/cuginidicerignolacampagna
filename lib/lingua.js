import { cookies } from 'next/headers';
import { makeT, normLang } from './i18n.js';

// Lingua scelta (cookie «lingua»), per le pagine e le rotte del server.
export async function getLang() {
  return normLang((await cookies()).get('lingua')?.value);
}
export async function getT() {
  return makeT(await getLang());
}
