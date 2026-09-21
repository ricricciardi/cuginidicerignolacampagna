import './globals.css';
import { loadMe } from '@/lib/admin';
import { getLang } from '@/lib/lingua';
import { LangProvider } from './lang-provider';
import { getUserId } from '@/lib/session';
import Nav from './nav';
import Brand from './brand';
import PressFx from './press-fx';
import Tour from './tour';

export const metadata = {
  title: 'Cuginidicerignolacampagna',
  description: 'La gara di corsa dei cugini, con i tempi presi da Strava.',
  // Nome sotto l'icona quando il sito viene salvato sulla schermata Home
  appleWebApp: { capable: true, title: 'Cugini', statusBarStyle: 'black-translucent' },
};
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#120a24',
};

export default async function RootLayout({ children }) {
  const userId = await getUserId();
  const loggedIn = Boolean(userId);
  const [me, lang] = await Promise.all([loggedIn ? loadMe(userId) : null, getLang()]);
  return (
    <html lang="it" data-lingua={lang}>
      <body>
        <LangProvider lang={lang}>
        <header className="site">
          <Brand />
        </header>
        {loggedIn && <Nav name={me?.athlete_name ?? me?.email} avatar={me?.avatar_url} />}
        {children}
        <PressFx />
        {loggedIn && <Tour enabled={Boolean(me?.strava)} />}
        </LangProvider>
      </body>
    </html>
  );
}
