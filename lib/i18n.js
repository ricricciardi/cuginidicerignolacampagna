import CER from './lingua-cer.js';

// Lingue del sito: italiano (predefinito) e cerignolano. I testi sono scritti in italiano nel codice,
// dentro t('…'); il dizionario lingua-cer.js ha per ogni frase italiana la versione in dialetto.
// Se una frase manca nel dizionario resta in italiano. {nome} nelle frasi = valore da inserire.
export const LANGS = ['it', 'cer'];
export const normLang = (v) => (v === 'cer' ? 'cer' : 'it');

export function makeT(lang) {
  const dict = normLang(lang) === 'cer' ? CER : null;
  return (s, vars) => {
    let out = (dict && dict[s]) || s;
    if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
    return out;
  };
}
