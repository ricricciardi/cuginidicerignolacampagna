import PasswordField from '../password-field';
const ERRORS = { credentials: 'Email o password non corrette.' };

export default async function Login({ searchParams }) {
  const { error } = await searchParams;
  return (
    <main>
      <h1>Accedi</h1>
      <p>
        Se sei qui è perché hai deciso di accettare la sfida di Cuginidicerignolacampagna.
        Ora lo step più complesso: affrontare accesso (o registrazione) e collegamento a Strava.
        Se sei un Cuginidicerignolacampagna, sono sicuro che #andràtuttobene <span aria-label="arcobaleno" role="img">🌈</span>
      </p>
      {error && <div className="notice error">{ERRORS[error] ?? 'Accesso non riuscito.'}</div>}
      <form className="stack" method="post" action="/api/auth/login">
        <label>Email<input type="email" name="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required autoComplete="email" /></label>
        <PasswordField label="Password" autoComplete="current-password" />
        <button type="submit">Accedi</button>
      </form>
      {/* Chi arriva la prima volta deve trovare subito la registrazione: pulsante, non link. */}
      <div className="signup">
        <p>Prima volta qui? Non hai ancora un account?</p>
        <a className="button secondary" href="/register">Registrati</a>
      </div>
    </main>
  );
}
