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

export const activeJobs = ((raw.jobs ?? []) as Job[]).filter((j) => j.active && j.name && j.title);

// „1 offene Stelle“ / „2 offene Stellen“
export const openPositionsText = (count = activeJobs.length) => `${count} offene ${count === 1 ? 'Stelle' : 'Stellen'}`;

const employmentLabels: Record<string, string> = {
  FULL_TIME: 'Vollzeit',
  PART_TIME: 'Teilzeit',
  MINI_JOB: 'Minijob',
  INTERN: 'Praktikum',
};
export const employmentText = (job: Job) => job.employmentType.map((t) => employmentLabels[t] ?? t).join(' / ');
