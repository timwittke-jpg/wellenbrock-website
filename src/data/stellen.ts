// Stellen aus dem CMS (jobs.json). Nur aktive Stellen erscheinen auf der Seite, bekommen eine eigene
// Unterseite mit JobPosting für Google Jobs und stehen im Bewerbungsformular zur Auswahl.
import raw from './jobs.json';

export interface Job {
  active: boolean;
  // Kurzname, z. B. „Physiotherapeut*in“: Formularauswahl und Adresse der Unterseite
  name: string;
  // ausführlicher Titel, z. B. „Physiotherapeut/in (Teilzeit/Vollzeit)“
  title: string;
  datePosted: string;
  employmentType: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryUnit: string;
  description: string;
}

// „Physiotherapeut*in“ → „physiotherapeut-in“
export const jobSlug = (job: Job) =>
  job.name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const jobHref = (job: Job) => `/jobs/${jobSlug(job)}/`;

// Pages CMS speichert den Texteditor teils als Markdown statt HTML. Die Stellentexte brauchen nur
// Absätze, Aufzählungen, Fettschrift und Links – das wandeln wir hier selbst in HTML um.
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s: string) =>
  escapeHtml(s)
    .replace(/\\([\\*_\[\]()#+\-.!])/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');

export const markdownToHtml = (md: string) =>
  md
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n');
      if (lines.every((l) => /^\s*[-*+]\s+/.test(l))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*+]\s+/, ''))}</li>`).join('')}</ul>`;
      }
      const heading = block.match(/^(#{1,6})\s+(.*)$/);
      if (heading) return `<p><strong>${inline(heading[2])}</strong></p>`;
      return `<p>${lines.map(inline).join('<br />')}</p>`;
    })
    .join('');

const toHtml = (text: string) => (text.trim().startsWith('<') ? text : markdownToHtml(text));

export const activeJobs = ((raw.jobs ?? []) as Job[])
  .filter((j) => j.active && j.name && j.title)
  .map((j) => ({ ...j, description: toHtml(j.description ?? '') }));

// „1 offene Stelle“ / „2 offene Stellen“
export const openPositionsText = (count = activeJobs.length) => `${count} offene ${count === 1 ? 'Stelle' : 'Stellen'}`;

const employmentLabels: Record<string, string> = {
  FULL_TIME: 'Vollzeit',
  PART_TIME: 'Teilzeit',
  MINI_JOB: 'Minijob',
  INTERN: 'Praktikum',
};
export const employmentText = (job: Job) => job.employmentType.map((t) => employmentLabels[t] ?? t).join(' / ');
