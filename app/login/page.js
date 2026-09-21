import Link from 'next/link';
import PasswordField from '../password-field';
import { getT } from '@/lib/lingua';
const ERRORS = { credentials: 'Email o password non corrette.' };

// Prima si sceglie tra Accedi e Registrati, poi compare il modulo. Se i campi ci fossero subito,
// su iPhone il portachiavi li prende di mira all'apertura e la tastiera copre le scelte.
export default async function Login({ searchParams }) {
  const { error, modulo } = await searchParams;
  const t = await getT();

  if (modulo || error) {
    return (
      <main>
        <p className="back"><Link href="/login">{t('Indietro')}</Link></p>
        <h1>{t('Accedi')}</h1>
        {error && <div className="notice error">{t(ERRORS[error] ?? 'Accesso non riuscito.')}</div>}
        <form className="stack" method="post" action="/api/auth/login">
          <label>{t('Email')}<input type="email" name="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required autoComplete="email" /></label>
          <PasswordField label={t('Password')} autoComplete="current-password" />
          <button type="submit">{t('Accedi')}</button>
        </form>
      </main>
    );
  }

  return (
    <main>
      <h1>{t('Benvenuto')}</h1>
      <p>
        {t('Se sei qui è perché hai deciso di accettare la sfida di Cuginidicerignolacampagna. Ora lo step più complesso: affrontare accesso (o registrazione) e collegamento a Strava. Se sei un Cuginidicerignolacampagna, sono sicuro che #andràtuttobene')}
        {' '}<span aria-label={t('arcobaleno')} role="img">🌈</span>
      </p>
      <div className="choices">
        <Link className="button" href="/login?modulo=1">{t('Ho già un account: accedi')}</Link>
        <Link className="button secondary" href="/register">{t('Prima volta qui: registrati')}</Link>
      </div>
    </main>
  );
}
