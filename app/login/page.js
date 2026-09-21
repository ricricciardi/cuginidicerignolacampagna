import PasswordField from '../password-field';
const ERRORS = { credentials: 'Email o password non corrette.' };

export default async function Login({ searchParams }) {
  const { error } = await searchParams;
  return (
    <main>
      <h1>Accedi</h1>
      <p>Entra per vedere le gare e le tue corse.</p>
      {error && <div className="notice error">{ERRORS[error] ?? 'Accesso non riuscito.'}</div>}
      <form className="stack" method="post" action="/api/auth/login">
        <label>Email<input type="email" name="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required autoComplete="email" /></label>
        <PasswordField label="Password" autoComplete="current-password" />
        <button type="submit">Accedi</button>
      </form>
      <p className="switch">Non hai un account? <a href="/register">Registrati</a></p>
      <footer className="site-footer"><a href="/regolamento">Regolamento</a></footer>
    </main>
  );
}
