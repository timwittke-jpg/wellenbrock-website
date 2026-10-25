// Zentrale Praxisdaten. Name, Adresse und Telefon (NAP) müssen überall
// identisch sein – auch im Google-Unternehmensprofil.
// Telefon, E-Mail und Behandlungszeiten pflegt die Praxis im CMS (kontakt.json); alles andere leitet sich davon ab.
import contact from './kontakt.json';

const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const weekdaysEn = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const first = weekdays.indexOf(contact.firstDay);
const last = weekdays.indexOf(contact.lastDay);
const short = (day: string) => day.slice(0, 2);
const dayRange = first === last ? short(contact.firstDay) : `${short(contact.firstDay)}–${short(contact.lastDay)}`;
// (030) 392 44 46 → +49303924446
const phoneDigits = contact.phone.replace(/\D/g, '').replace(/^0/, '');

export const practice = {
  name: 'Physiotherapie Wellenbrock & Wernecken',
  shortName: 'Wellenbrock & Wernecken',
  url: 'https://physiotherapie-wellenbrock-wernecken.de',
  street: 'Bochumer Strasse 9',
  postalCode: '10555',
  city: 'Berlin',
  district: 'Moabit',
  phoneDisplay: contact.phone,
  phoneHref: `tel:+49${phoneDigits}`,
  phoneIntl: `+49 ${phoneDigits}`,
  email: contact.email,
  // „Mo–Fr: 09:00 – 20:00“ (kurz) und „Montag bis Freitag von 09:00 bis 20:00 Uhr“ (im Fließtext)
  hoursDisplay: `${dayRange}: ${contact.opens} – ${contact.closes}`,
  hoursText:
    first === last
      ? `${contact.firstDay} von ${contact.opens} bis ${contact.closes} Uhr`
      : `${contact.firstDay} bis ${contact.lastDay} von ${contact.opens} bis ${contact.closes} Uhr`,
  hoursNote: contact.hoursNote,
  // auch über das Wochenende hinweg (z. B. Sa–Mo)
  hours: {
    days: last >= first ? weekdaysEn.slice(first, last + 1) : [...weekdaysEn.slice(first), ...weekdaysEn.slice(0, last + 1)],
    opens: contact.opens,
    closes: contact.closes,
  },
  areaServed: ['Moabit', 'Hansaviertel', 'Tiergarten', 'Charlottenburg'],
  // Koordinaten der Praxis (OpenStreetMap/Nominatim für Bochumer Straße 9, 10555 Berlin)
  geo: { lat: 52.5222182, lng: 13.3375731 },
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Physiotherapie+Wellenbrock+Wernecken+Bochumer+Strasse+9+10555+Berlin',
  mapsEmbed: 'https://www.google.com/maps?q=Bochumer+Strasse+9,+10555+Berlin&output=embed',
  instagram: 'https://www.instagram.com/physio_wellenbrock_wernecken/',
  facebook: 'https://www.facebook.com/profile.php?id=61561619562005&locale=de_DE',
};

export const nav = [
  {
    label: 'Leistungen',
    items: [
      { label: 'Physiotherapie', href: '/physiotherapie/' },
      { label: 'Neurologische Physiotherapie', href: '/physiotherapie/neurologische-physiotherapie/' },
      { label: 'Osteopathie', href: '/osteopathie/' },
      { label: 'Hausbesuche', href: '/hausbesuche/' },
    ],
  },
  {
    label: 'Über uns',
    items: [
      { label: 'Haltung', href: '/haltung/' },
      { label: 'Team', href: '/team/' },
      { label: 'Jobs', href: '/jobs/' },
    ],
  },
  {
    label: 'Service',
    items: [
      { label: 'Kontakt', href: '/kontakt/' },
      { label: 'Häufige Fragen', href: '/haeufige-fragen/' },
      { label: 'Preise', href: '/preise/' },
    ],
  },
];

// Erfahrungsjahre („seit 25 Jahren“) werden bei jedem Build aus den Startjahren berechnet.
// VORLÄUFIG so gewählt, dass 2026 wie bisher 25 bzw. 20 Jahre herauskommen – echte Jahre eintragen.
export const practiceFoundedYear = 2001;
export const osteopathySinceYear = 2006;

const yearsSince = (year: number) => new Date().getFullYear() - year;
export const practiceYears = yearsSince(practiceFoundedYear);
export const osteopathyYears = yearsSince(osteopathySinceYear);

// Platzhalter in den Inhaltsdaten (pages.json): {jahrePraxis} und {jahreOsteo}
export const fillYears = (text: string) =>
  text
    .replaceAll('{jahrePraxis}', String(practiceYears))
    .replaceAll('{jahreOsteo}', String(osteopathyYears))
    .replaceAll('{telefon}', practice.phoneDisplay);

export const appointmentHref = '/termin-vereinbaren/';

// Ziel-URL für Kontakt- und Terminformular. Wird gesetzt, sobald das Hosting feststeht
// (z. B. PHP-Mailskript auf dem Webspace oder ein Formulardienst).
export const formEndpoint = '';

// Adresse, unter der der eigene Server die ALTCHA-Aufgabe ausgibt (z. B. '/altcha-challenge.php').
// Leer = Testmodus: Das Kästchen „Ich bin kein Roboter“ funktioniert, geprüft wird aber noch nichts.
// Das Formular-Skript muss die Lösung (Feld „altcha“) und den Honeypot (Feld „website“) serverseitig prüfen.
export const altchaChallengeUrl = '';

// Nur für Präsentationen: Ohne formEndpoint tun die Formulare so, als wäre der Versand erfolgreich
// (Terminformular → Bestätigungsseite). VOR DEM LIVEGANG unbedingt auf false setzen,
// sonst sehen Patient:innen eine Bestätigung, obwohl nichts verschickt wurde.
export const formDemoMode = true;

// Zeigt in Impressum und Datenschutz die Hinweise „Zur rechtlichen Prüfung“.
// Nach der Freigabe der Texte auf false setzen.
export const showLegalReview = true;

// Zeigt bei neuen fachlichen Texten (Neuro-Seite, FAQs pro Behandlung) den Hinweis
// „Entwurf zur fachlichen Prüfung“. Nach der Freigabe auf false setzen.
export const showContentReview = false;
