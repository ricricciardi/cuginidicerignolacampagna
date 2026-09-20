// Dati per "Aggiungi alla schermata Home": nome, colori e icone.
export default function manifest() {
  return {
    name: 'Cuginidicerignolacampagna',
    short_name: 'Cugini',
    description: 'La gara di corsa dei cugini, con i tempi presi da Strava.',
    start_url: '/gare',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#120a24',
    theme_color: '#120a24',
    lang: 'it',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
