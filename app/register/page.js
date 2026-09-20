const ERRORS = {
  invalid: 'Serve un indirizzo email valido e una password di almeno 8 caratteri.',
  exists: 'Esiste già un account con questa email. Accedi invece di registrarti.',
};

export default async function Register({ searchParams }) {
  const { error } = await searchParams;
  return (
    <main>
      <h1>Crea un account</h1>
      <p>Dopo la registrazione potrai collegare il tuo account Strava.</p>
      {error && <div className="notice error">{ERRORS[error] ?? 'Registrazione non riuscita.'}</div>}
      <form className="stack" method="post" action="/api/auth/register">
        <label>Email<input type="email" name="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required autoComplete="email" /></label>
        <label>Password (almeno 8 caratteri)<input type="password" name="password" required minLength={8} autoComplete="new-password" /></label>
        <button type="submit">Crea account</button>
      </form>
      <p className="switch">Hai già un account? <a href="/login">Accedi</a></p>
    </main>
  );
}
