import './globals.css';
import { getUserId } from '@/lib/session';
import Nav from './nav';

export const metadata = { title: 'Cuginidicerignolacampagna' };
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#120a24',
};

export default async function RootLayout({ children }) {
  const loggedIn = Boolean(await getUserId());
  return (
    <html lang="it">
      <body>
        <header className="site">
          <span className="brand">Cuginidicerignolacampagna</span>
          {loggedIn && (
            <form method="post" action="/api/auth/logout">
              <button className="quiet" type="submit">Esci</button>
            </form>
          )}
        </header>
        {loggedIn && <Nav />}
        {children}
      </body>
    </html>
  );
}
