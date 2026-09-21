import { getLang, getT } from '@/lib/lingua';

// Switch Italiano / Cerignolano: un modulo per lingua, così funziona anche senza JavaScript.
// back: pagina a cui tornare. compact: versione piccola in alto a destra (pagina di accesso).
export default async function LangSwitch({ back, compact = false }) {
  const [lang, t] = await Promise.all([getLang(), getT()]);
  const opt = (value, label) => (
    <form method="post" action="/api/lingua">
      <input type="hidden" name="lingua" value={value} />
      <input type="hidden" name="back" value={back} />
      <button type="submit" aria-pressed={lang === value} className={lang === value ? 'on' : undefined}>{label}</button>
    </form>
  );
  return (
    <div className={`lang-switch${compact ? ' compact' : ''}`} role="group" aria-label={t('Lingua')}>
      {opt('it', 'Italiano')}
      {opt('cer', 'Cerignolano')}
    </div>
  );
}
