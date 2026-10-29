// llms.txt (Vorschlag von llmstxt.org): kurze Markdown-Übersicht der Praxis für KI-Assistenten.
// Wird bei jedem Build aus denselben Daten wie die Seite erzeugt (Praxisdaten, Seitenbeschreibungen, FAQ),
// bleibt also automatisch aktuell, wenn im CMS etwas geändert wird.
import type { APIRoute } from 'astro';
import { practice, practiceYears, osteopathyYears } from '../data/site';
import { pages, type Page } from '../data/pages';
import faq from '../data/faq.json';

// Häkchen aus den Meta-Beschreibungen („Kasse ✓ Barrierefrei ✓“) in Fließtext umwandeln
const clean = (s: string) =>
  s
    .replace(/\s*✓\s*/g, ', ')
    .replace(/:\s*,\s*/g, ': ')
    .replace(/,\s*$/, '')
    .trim();
// Links in FAQ-Antworten („Hier gehts zur Leistungs-Übersicht“) als Markdown-Links behalten
const toMarkdown = (html: string, url: (path: string) => string) =>
  html
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g, (_, href, text) => `[${text}](${url(href)})`)
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&shy;/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site ?? practice.url).href;
  const link = (title: string, path: string, text?: string) => `- [${title}](${url(path)})${text ? `: ${clean(text)}` : ''}`;
  const byPath = (path: string) => pages.find((p) => p.path === path)!;
  const children = (prefix: string) =>
    pages.filter((p) => p.kind === 'treatment' && p.path.startsWith(prefix)).sort((a, b) => a.h1.localeCompare(b.h1, 'de'));
  const pageLink = (p: Page) => link(p.h1, p.path, p.description);

  const lines = [
    `# ${practice.name}`,
    '',
    `> Praxis für Physiotherapie und Osteopathie in Berlin ${practice.district}. Für gesetzlich und privat Versicherte, ` +
      `barrierefrei, mit Hausbesuchen in ${practice.areaServed.join(', ')}. ` +
      `Seit ${practiceYears} Jahren Physiotherapie, seit ${osteopathyYears} Jahren Osteopathie; Schwerpunkt neurologische Erkrankungen.`,
    '',
    '## Praxis',
    '',
    `- Adresse: ${practice.street}, ${practice.postalCode} ${practice.city} (${practice.district})`,
    `- Telefon: ${practice.phoneDisplay}`,
    `- E-Mail: ${practice.email}`,
    `- Behandlungszeiten: ${practice.hoursText}${practice.hoursNote ? ` (${practice.hoursNote})` : ''}`,
    `- Hausbesuche: ${practice.areaServed.join(', ')}`,
    link('Termin vereinbaren', '/termin-vereinbaren/', 'Online-Terminanfrage'),
    link('Kontakt und Anfahrt', '/kontakt/'),
    '',
    '## Physiotherapie',
    '',
    pageLink(byPath('/physiotherapie/')),
    link(
      'Neurologische Physiotherapie',
      '/physiotherapie/neurologische-physiotherapie/',
      'Bobath, PNF und Atemtherapie bei MS, Parkinson und nach Schlaganfall'
    ),
    ...children('/physiotherapie/').map(pageLink),
    '',
    '## Osteopathie',
    '',
    pageLink(byPath('/osteopathie/')),
    ...children('/osteopathie/').map(pageLink),
    '',
    '## Weitere Leistungen und Infos',
    '',
    ...['/hausbesuche/', '/preise/', '/haeufige-fragen/', '/team/', '/haltung/', '/jobs/'].map((p) => pageLink(byPath(p))),
    '',
    '## Häufige Fragen',
    '',
    ...faq.flatMap((f) => [`### ${toMarkdown(f.q, url)}`, '', toMarkdown(f.a, url), '']),
    '## Optional',
    '',
    link('Impressum', '/impressum/'),
    link('Datenschutz', '/datenschutz/'),
    '',
  ];

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
