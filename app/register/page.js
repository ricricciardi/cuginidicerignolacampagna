import Link from 'next/link';
import PasswordField from '../password-field';
import { getT } from '@/lib/lingua';
const ERRORS = {
  invalid: 'Serve un indirizzo email valido e una password di almeno 8 caratteri.',
  exists: 'Esiste già un account con questa email. Accedi invece di registrarti.',
};

export default async function Register({ searchParams }) {
  const { error } = await searchParams;
  const t = await getT();
  return (
    <main>
      <p className="back"><Link href="/login">{t('Torna all\'accesso')}</Link></p>
      <h1>{t('Crea un account')}</h1>
      <p>{t('Dopo la registrazione potrai collegare il tuo account Strava.')}</p>
      {error && <div className="notice error">{t(ERRORS[error] ?? 'Registrazione non riuscita.')}</div>}
      <form className="stack" method="post" action="/api/auth/register">
        <label>{t('Email')}<input type="email" name="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required autoComplete="email" /></label>
        <PasswordField label={t('Password')} autoComplete="new-password" minLength={8} hint={t('Almeno 8 caratteri.')} />
        <button type="submit">{t('Crea account')}</button>
      </form>
    </main>
  );
}
