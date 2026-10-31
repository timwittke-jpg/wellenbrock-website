import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// URLs bleiben wie auf der WordPress-Seite (mit Slash am Ende),
// damit bestehende Google-Rankings und Links erhalten bleiben.
export default defineConfig({
  site: 'https://physiotherapie-wellenbrock-wernecken.de',
  trailingSlash: 'always',
  // CSS direkt in die HTML-Datei schreiben: kein Nachladen, das den ersten Seitenaufbau blockiert
  build: { inlineStylesheets: 'always' },
  // Bestätigungsseite nach dem Formular gehört nicht in die Sitemap
  integrations: [sitemap({ filter: (page) => !page.includes('/termin-angefragt/') })],
});
