'use client';
import { createContext, useContext, useMemo } from 'react';
import { makeT } from '@/lib/i18n';

// La lingua arriva dal layout (cookie letto sul server) e la usano i componenti del browser.
const LangContext = createContext({ lang: 'it', t: makeT('it') });

export function LangProvider({ lang, children }) {
  const value = useMemo(() => ({ lang, t: makeT(lang) }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
export const useT = () => useContext(LangContext).t;
export const useLang = () => useContext(LangContext).lang;
