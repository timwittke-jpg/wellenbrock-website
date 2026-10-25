# SEO & Livegang – Physiotherapie Wellenbrock & Wernecken

Stand: 24.10.2026. Was auf der Website erledigt ist, was beim Umzug zu tun ist und was außerhalb der Website passieren muss.

## 1. Auf der Website erledigt

- Seitentitel und Beschreibungen mit Ortsbezug (Berlin Moabit) auf allen Seiten, einheitliches Muster für Behandlungsseiten
- Strukturierte Daten: Praxis (`Physiotherapy`) mit Adresse, Geo-Koordinaten, Öffnungszeiten, Einzugsgebiet, Barrierefreiheit und Hausbesuchen; `Service` pro Behandlung; `FAQPage` auf Startseite, FAQ-Seite, Neuro-Seite und allen Behandlungsseiten; Brotkrümel (`BreadcrumbList`)
- Neue Seite **Neurologische Physiotherapie** (`/physiotherapie/neurologische-physiotherapie/`), verlinkt von Startseite, Physiotherapie-Seite und Menü
- **Häufige Fragen pro Behandlung** (Dauer, Kosten, Ort, Mitbringen) – nur aus Angaben der jeweiligen Seite
- Interne Verlinkung: „Weitere Behandlungen“ auf jeder Behandlungsseite, Brotkrümel
- `robots.txt`, `sitemap-index.xml`, 404-Seite (nicht indexiert)
- Favicon-Set (SVG, PNG, Apple-Icon, Web-Manifest) und Vorschaubild für Social Media (`og-default.jpg`)
- Alt-Texte und Linknamen geprüft, Seiten mobil ohne horizontales Scrollen, Schriften lokal

**Vor dem Livegang ausschalten bzw. ausfüllen** (in `src/data/site.ts`):

- `showContentReview = false` – nachdem Neuro-Seite und FAQs fachlich geprüft sind
- `showLegalReview = false` – nachdem Datenschutz und Impressum freigegeben sind (Platzhalter für Hoster und Formulardienst ausfüllen)
- `formEndpoint` – Ziel für Kontakt- und Terminformular
- CMS: Praxis pflegt Preise (`src/data/preise.json`) und Kontakt/Behandlungszeiten (`src/data/kontakt.json`) in Pages CMS (`.pages.yml`). GitHub Actions (`.github/workflows/deploy.yml`) baut und lädt per SFTP hoch. Für den Livegang die Repository-Variable `BUILD_SCRIPT` auf `build` setzen (sonst bleibt die Seite auf noindex) und `SFTP_PATH` auf den Live-Ordner
- `altchaChallengeUrl` – Adresse der ALTCHA-Aufgabe auf dem eigenen Server (z. B. PHP auf dem Webspace). Leer = Testmodus, dann wird nichts geprüft. Das Formular-Skript muss serverseitig die ALTCHA-Lösung (Feld `altcha`), den Honeypot (Feld `website`, muss leer sein) prüfen
- `formDemoMode = false` – **Pflicht vor dem Livegang.** Im Demo-Modus zeigen die Formulare ohne Formularziel eine Erfolgsmeldung bzw. die Bestätigungsseite, obwohl nichts verschickt wird

## 2. Offene inhaltliche Punkte

| Punkt | Wo | Was zu klären ist |
|---|---|---|
| Behandlungsdauer Bobath / PNF | Behandlungsseiten vs. Preise | Seiten: 30–60 Min., Preisliste: 30 bzw. 20 Min. (FAQ zur Dauer ist dort bewusst weggelassen) |
| CMD-Seite, Abschnitt „Gut zu wissen“ | `/physiotherapie/cmd-behandlung/` | Live steht „Propriozeptive neuromuskuläre Fazilitation bieten wir auch als Hausbesuche …“ – Kopierfehler. Laut Hausbesuche-Seite gibt es für Sonder-Leistungen keine Hausbesuche |
| Öffnungszeiten Samstag | Kontakt vs. Schema/Google | Kontaktseite: „Sa: Nach Absprache“. Im Schema und Google-Profil nur Mo–Fr eintragen oder Samstag einheitlich ergänzen |
| Erfahrung Osteopathie | Osteopathie-Seite | „25 Jahre Erfahrung in der Osteopathie“ vs. „über 20 Jahre“ an anderen Stellen |
| Verantwortliche Person | Impressum, Datenschutz | Monika Wellenbrock oder Sina (Leitung laut Teamseite)? |
| Qualifikationen des Teams | Teamseite | Ausbildungen/Zusatzqualifikationen pro Person (stärkt Vertrauen und Google-Bewertung „Expertise“) |
| Fotos | Website, Google-Profil | Echte Fotos der Praxisräume (Altbau, Eingang barrierefrei), gerne auch Behandlungssituationen |

## 3. Umzug von WordPress – Checkliste

**Vorher**

1. Google Search Console: Zugang prüfen, Leistungsbericht der letzten 16 Monate exportieren (Seiten + Suchbegriffe)
2. Liste aller indexierten URLs sichern (Search Console → Seiten → Indexiert)
3. Hosting festlegen, Formularversand einrichten, Datenschutz anpassen

**Weiterleitungen (301)** – die Seiten-URLs bleiben gleich, nur WordPress-Technik entfällt:

| Alte Adresse | Ziel |
|---|---|
| `/sitemap_index.xml`, `/page-sitemap.xml`, `/wp-sitemap.xml` | `/sitemap-index.xml` |
| `/feed/`, `/comments/feed/` | `/` |
| `/?p=…`, `/?page_id=…` | `/` |
| `/wp-content/uploads/…` | `/` (oder 410, falls Bilder in der Google-Bildersuche keine Rolle spielen) |
| `/wp-admin/`, `/wp-login.php` | 410 Gone |

Beispiel Apache (`.htaccess`, typisch bei IONOS, Strato, all-inkl):

```apache
RewriteEngine On
RewriteRule ^(sitemap_index|page-sitemap|wp-sitemap)\.xml$ /sitemap-index.xml [R=301,L]
RewriteRule ^(comments/)?feed/?$ / [R=301,L]
RewriteCond %{QUERY_STRING} ^(p|page_id)=\d+
RewriteRule ^$ /? [R=301,L]
RewriteRule ^wp-content/uploads/ / [R=301,L]
RewriteRule ^(wp-admin|wp-login\.php) - [G,L]
ErrorDocument 404 /404.html
```

Beispiel Netlify (`public/_redirects`):

```
/sitemap_index.xml     /sitemap-index.xml  301
/page-sitemap.xml      /sitemap-index.xml  301
/wp-sitemap.xml        /sitemap-index.xml  301
/feed/                 /                   301
/comments/feed/        /                   301
/wp-content/uploads/*  /                   301
/wp-admin/*            /404.html           410
```

**Nachher**

1. In Search Console die neue Sitemap `https://physiotherapie-wellenbrock-wernecken.de/sitemap-index.xml` einreichen
2. Startseite und 3–4 wichtige Seiten per „URL-Prüfung“ neu indexieren lassen
3. Zwei bis vier Wochen lang „Seiten“ und „Leistung“ beobachten (404-Fehler, Rankings)
4. Rich-Results-Test für Startseite, eine Behandlungsseite und die FAQ-Seite: https://search.google.com/test/rich-results
5. PageSpeed Insights einmal für Startseite und eine Behandlungsseite laufen lassen

## 4. Google-Unternehmensprofil

- Hauptkategorie **Physiotherapeut**, weitere Kategorie **Osteopath**
- Name, Adresse, Telefon exakt wie auf der Website: *Physiotherapie Wellenbrock & Wernecken, Bochumer Strasse 9, 10555 Berlin, (030) 392 44 46*
- Website-Link auf die Startseite
- Leistungen anlegen – gleiche Namen wie auf der Website (Krankengymnastik, Manuelle Therapie, Bobath-Therapie, Osteopathie für Kinder …), jeweils mit Link zur Unterseite
- Attribute: rollstuhlgerechter Eingang, Hausbesuche
- Öffnungszeiten Mo–Fr 09:00–20:00 (Samstag siehe offene Punkte)
- 10–20 echte Fotos: Außenansicht mit Eingang, Empfang, Behandlungsräume, Team
- Beschreibung im Ton der Website (warm, „du“), mit Moabit, Physiotherapie, Osteopathie, neurologische Physiotherapie

**Bewertungen** – fragen, nicht kaufen:

- Nach einer abgeschlossenen Behandlungsserie persönlich fragen, mit kleiner Karte (QR-Code zum Bewertungslink)
- Jede Bewertung kurz und freundlich beantworten, auch kritische
- Keine Bewertungen gegen Gegenleistung (verstößt gegen Googles Richtlinien und das UWG)

## 5. Verzeichnisse und lokale Links

Überall exakt dieselben Angaben (Name, Adresse, Telefon, Website) wie im Google-Profil:

- Jameda, Gelbe Seiten, Das Örtliche, 11880, Apple Maps (Apple Business Connect), Bing Places
- Therapeutensuchen der Verbände, je nach Mitgliedschaft: Physio Deutschland (ZVK), IFK, VOD, BVO
- Lokale Seiten: Kiez- und Stadtteilportale Moabit, Nachbarschaftsnetzwerke, Kooperationen mit Ärzt:innen in der Nähe (z. B. Verlinkung auf deren „Netzwerk/Partner“-Seiten)

## 6. Messen

- **Search Console** (kostenlos, keine Cookies) – Basis für alles
- **Statistik ohne Cookies**: Plausible (EU-Hosting) oder selbst gehostetes Matomo. Danach Datenschutzerklärung ergänzen
- **Ziele**: Klicks auf die Telefonnummer, abgeschickte Termin- und Kontaktanfragen, Klicks auf „Route planen“
- Einmal im Monat kurz prüfen: Welche Seiten bringen Anfragen? Welche Suchbegriffe wachsen?
