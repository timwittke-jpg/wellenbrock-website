// Seitenmodell der Unterseiten. Inhalte stammen aus der Live-Seite (ausgelesen und bereinigt).
import raw from './pages.json';
import { fillYears } from './site';

export interface Button {
  text: string;
  href: string;
}

export interface Card {
  title: string;
  html: string;
  buttons: Button[];
  href?: string;
  variant?: 'barrierefrei' | 'hausbesuche';
}

export interface Section {
  heading: string;
  level: number;
  html: string;
  cards: Card[];
  buttons: Button[];
  images: { src: string; alt: string }[];
  byline?: string;
  id?: string;
}

export interface Page {
  path: string;
  kind: 'treatment' | 'overview' | 'content' | 'legal' | 'special';
  title: string;
  description: string;
  h1: string;
  lead: string;
  sections: Section[];
}

// Erfahrungsjahre in allen Texten einsetzen (siehe fillYears in site.ts)
export const pages = JSON.parse(fillYears(JSON.stringify(raw))) as Page[];

export const getPage = (path: string) => pages.find((p) => p.path === path);

// Bindestrich-Wörter in Überschriften nicht trennen (geschützter Bindestrich U+2011)
export const noBreak = (text: string) => text.replace(/(\S)-(\S)/g, '$1‑$2');

// Kurzer Name ohne Ortszusatz – für Brotkrümel und Linklisten
export const shortName = (h1: string) => h1.replace(/\s+(in\s+)?Berlin\s+Moabit$/i, '').trim();

export const parentOf = (path: string) => {
  const m = path.match(/^\/(physiotherapie|osteopathie)\/[^/]+\/$/);
  return m ? getPage(`/${m[1]}/`) : undefined;
};

export const siblingsOf = (path: string) => {
  const parent = parentOf(path);
  if (!parent) return [];
  return pages.filter((p) => p.kind === 'treatment' && p.path !== path && p.path.startsWith(parent.path));
};

// Häufige Fragen pro Behandlungsseite – nur aus Angaben, die auf der Seite selbst stehen,
// ergänzt um allgemeine Praxisinfos (Adresse, Barrierefreiheit, Mitbringen).
export interface Faq {
  q: string;
  a: string;
}

const sentences = (html: string) =>
  html
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<\/p>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ„])/)
    .map((s) => s.trim())
    .filter(Boolean);

export const faqFor = (page: Page): Faq[] => {
  if (page.kind !== 'treatment') return [];
  const name = shortName(page.h1);
  const info = page.sections.find((s) => /^Gut zu wissen/.test(s.heading));
  const all = info ? sentences(info.html) : [];
  const duration = all.filter((s) => /dauert/.test(s));
  const costs = all.filter((s) => /Kürzel|Krankenkasse|Kassen|Selbstzahl|Zusatzversicherung|Kosten/.test(s) && !/Preise &/.test(s));
  const isOsteo = page.path.startsWith('/osteopathie/');
  // Sonder-Leistungen: laut Hausbesuche-Seite keine Hausbesuche
  const isSpecial = /cmd-behandlung|medical-kinesio|medical-flossing|faszientherapie/.test(page.path);
  // reine Selbstzahler-Leistungen: kein Rezept nötig
  const isSelfPay = isOsteo || /medical-kinesio|medical-flossing|faszientherapie/.test(page.path);
  // Dauer widerspricht der Preisliste – wird noch geklärt, daher nicht als FAQ
  const durationUnclear = /bobath|propriozeptive/.test(page.path);
  const homeVisit = isSpecial ? undefined : all.find((s) => /Hausbesuch/.test(s) && !/Hier findest du/.test(s));

  const faqs: Faq[] = [];
  if (duration.length && !durationUnclear) faqs.push({ q: `Wie lange dauert ${name}?`, a: duration.join(' ') });
  if (costs.length)
    faqs.push({
      q: `Übernimmt die Krankenkasse die Kosten für ${name}?`,
      a: `${costs.join(' ')} Alle Details findest du unter Preise & Kostenerstattung.`,
    });
  faqs.push({
    q: `Wo in Berlin bekomme ich ${name}?`,
    a:
      'In unserer barrierefreien Altbaupraxis in der Bochumer Straße 9 in Berlin Moabit – zwischen U-Turmstraße und S-Tiergarten. Der ebenerdige Eingang führt direkt vom Gehweg in den Behandlungsraum.' +
      (homeVisit
        ? ` ${homeVisit}`
        : isOsteo
          ? ' Für Osteopathie bieten wir keine Hausbesuche an.'
          : isSpecial
            ? ' Für Sonder-Leistungen bieten wir keine Hausbesuche an.'
            : ''),
  });
  faqs.push({
    q: 'Was soll ich zum ersten Termin mitbringen?',
    a: isSelfPay
      ? 'Bring gerne relevante Arztberichte oder Befunde mit, dazu ein eigenes Handtuch und bequeme, lockere Kleidung. Beim ersten Termin nehmen wir uns Zeit für ein ausführliches Gespräch.'
      : 'Bring dein Rezept, deine Krankenkassenkarte und wenn möglich relevante Arztberichte oder Befunde mit – dazu ein eigenes Handtuch und bequeme, lockere Kleidung. Beim ersten Termin nehmen wir uns Zeit für ein ausführliches Gespräch.',
  });
  return faqs;
};

export const crumbsFor = (page: Page) => {
  const crumbs = [{ label: 'Startseite', href: '/' }];
  const parent = parentOf(page.path);
  if (parent) crumbs.push({ label: shortName(parent.h1), href: parent.path });
  crumbs.push({ label: shortName(page.h1), href: page.path });
  return crumbs;
};
