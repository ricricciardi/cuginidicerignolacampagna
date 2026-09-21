import Link from 'next/link';
import PasswordField from '../password-field';
import { getT } from '@/lib/lingua';
import LangSwitch from '../lang-switch';
const ERRORS = { credentials: 'Email o password non corrette.' };

export default async function Login({ searchParams }) {
  const { error } = await searchParams;
  const t = await getT();
  return (
    <main>
      <LangSwitch back="/login" compact />
      <h1>{t('Accedi')}</h1>
      <p>
        {t('Se sei qui è perché hai deciso di accettare la sfida di Cuginidicerignolacampagna. Ora lo step più complesso: affrontare accesso (o registrazione) e collegamento a Strava. Se sei un Cuginidicerignolacampagna, sono sicuro che #andràtuttobene')}
        {' '}<span aria-label={t('arcobaleno')} role="img">🌈</span>
      </p>
      {error && <div className="notice error">{t(ERRORS[error] ?? 'Accesso non riuscito.')}</div>}
      <form className="stack" method="post" action="/api/auth/login">
        <label>{t('Email')}<input type="email" name="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required autoComplete="email" /></label>
        <PasswordField label={t('Password')} autoComplete="current-password" />
        <button type="submit">{t('Accedi')}</button>
      </form>
      {/* Chi arriva la prima volta deve trovare subito la registrazione: pulsante, non link. */}
      <div className="signup">
        <p>{t('Prima volta qui? Non hai ancora un account?')}</p>
        <Link className="button secondary" href="/register">{t('Registrati')}</Link>
      </div>
    </main>
  );
}
