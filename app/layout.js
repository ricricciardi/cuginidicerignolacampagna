import './globals.css';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import Nav from './nav';
import Brand from './brand';

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
  const [me] = loggedIn
    ? await sql`select c.athlete_name, coalesce('/api/foto/' || u.id || '?v=' || u.photo_v, c.avatar_url) as avatar_url, u.email from users u
                left join strava_connections c on c.user_id = u.id where u.id = ${userId}`
    : [];
  return (
    <html lang="it">
      <body>
        <header className="site">
          <Brand />
        </header>
        {loggedIn && <Nav name={me?.athlete_name ?? me?.email} avatar={me?.avatar_url} />}
        {children}
      </body>
    </html>
  );
}
