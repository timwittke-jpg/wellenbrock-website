<?php
/*
  Formularversand für Kontakt- und Terminformular.

  GET  formular.php?aufgabe=1  → neue ALTCHA-Aufgabe (Spamschutz) als JSON
  POST formular.php            → prüft Spamschutz und Pflichtfelder, schickt die Anfrage per SMTP an die Praxis

  Zugangsdaten stehen NICHT hier, sondern in formular-config.php eine Ebene über dem Webordner
  (nicht im Git-Repo, nicht über das Web abrufbar). Vorlage: formular-config.beispiel.php im Projekt.
*/

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function antwort(int $status, array $daten): void
{
    http_response_code($status);
    echo json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$configPfad = dirname(__DIR__) . '/formular-config.php';
if (!is_file($configPfad)) {
    antwort(500, ['ok' => false, 'fehler' => 'Konfiguration fehlt']);
}
$config = require $configPfad;

$geheimnis = (string) ($config['altcha_geheimnis'] ?? '');
if (strlen($geheimnis) < 32) {
    antwort(500, ['ok' => false, 'fehler' => 'Konfiguration unvollständig']);
}

// ALTCHA (Version 3): PBKDF2/SHA-256, die Lösung muss mit dem Präfix beginnen
const ALTCHA_ALGORITHMUS = 'PBKDF2/SHA-256';
const ALTCHA_KOSTEN = 2000;
const ALTCHA_SCHLUESSELLAENGE = 32;
const ALTCHA_PRAEFIX = '00';
const ALTCHA_GUELTIG_SEKUNDEN = 600;

// wie JSON.stringify mit sortierten Schlüsseln (so signiert und prüft auch die ALTCHA-Bibliothek)
function kanonischesJson(array $daten): string
{
    ksort($daten);
    return json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

// Aufgabe ausgeben
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['aufgabe'])) {
        antwort(404, ['ok' => false]);
    }
    $parameter = [
        'algorithm' => ALTCHA_ALGORITHMUS,
        'cost' => ALTCHA_KOSTEN,
        'expiresAt' => time() + ALTCHA_GUELTIG_SEKUNDEN,
        'keyLength' => ALTCHA_SCHLUESSELLAENGE,
        'keyPrefix' => ALTCHA_PRAEFIX,
        'nonce' => bin2hex(random_bytes(16)),
        'salt' => bin2hex(random_bytes(16)),
    ];
    ksort($parameter);
    antwort(200, [
        'parameters' => $parameter,
        'signature' => hash_hmac('sha256', kanonischesJson($parameter), $geheimnis),
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    antwort(405, ['ok' => false]);
}

function feld(string $name, int $maxLaenge = 200): string
{
    $wert = $_POST[$name] ?? '';
    if (!is_string($wert)) {
        return '';
    }
    $wert = trim(str_replace("\0", '', $wert));
    return mb_substr($wert, 0, $maxLaenge);
}

// Zeilenumbrüche aus einzeiligen Angaben entfernen (keine eingeschleusten Mail-Header)
function einzeilig(string $wert): string
{
    return trim(preg_replace('/[\r\n\t]+/', ' ', $wert));
}

// Honeypot ausgefüllt: so tun, als hätte es geklappt
if (feld('website') !== '') {
    antwort(200, ['ok' => true]);
}

// Spamschutz prüfen
function altchaGueltig(string $payload, string $geheimnis): bool
{
    $daten = json_decode((string) base64_decode($payload, true), true);
    if (!is_array($daten) || !is_array($daten['challenge'] ?? null) || !is_array($daten['solution'] ?? null)) {
        return false;
    }
    $parameter = $daten['challenge']['parameters'] ?? null;
    $signatur = $daten['challenge']['signature'] ?? null;
    $loesung = $daten['solution'];
    if (!is_array($parameter) || !is_string($signatur)
        || !ctype_xdigit((string) ($parameter['nonce'] ?? '')) || !ctype_xdigit((string) ($parameter['salt'] ?? ''))) {
        return false;
    }
    // Signatur: nur Aufgaben, die dieser Server ausgegeben hat
    if (!hash_equals(hash_hmac('sha256', kanonischesJson($parameter), $geheimnis), $signatur)) {
        return false;
    }
    if (($parameter['expiresAt'] ?? 0) < time()) {
        return false;
    }
    $zaehler = $loesung['counter'] ?? null;
    $schluessel = $loesung['derivedKey'] ?? null;
    if (!is_int($zaehler) || $zaehler < 0 || $zaehler > 4294967295 || !is_string($schluessel)) {
        return false;
    }
    // Lösung nachrechnen: Passwort = Nonce + Zähler (32 Bit, Big Endian)
    $passwort = hex2bin($parameter['nonce']) . pack('N', $zaehler);
    $berechnet = bin2hex(hash_pbkdf2('sha256', $passwort, hex2bin($parameter['salt']), (int) $parameter['cost'], (int) $parameter['keyLength'], true));
    return hash_equals($berechnet, strtolower($schluessel))
        && strncmp($berechnet, strtolower((string) $parameter['keyPrefix']), strlen((string) $parameter['keyPrefix'])) === 0;
}

// Jede gelöste Aufgabe nur einmal verwenden
function schonBenutzt(string $payload): bool
{
    $datei = dirname(__DIR__) . '/formular-benutzt.json';
    $jetzt = time();
    $handle = fopen($datei, 'c+');
    if (!$handle) {
        return false;
    }
    flock($handle, LOCK_EX);
    $liste = json_decode((string) stream_get_contents($handle), true);
    $liste = is_array($liste) ? array_filter($liste, fn($ablauf) => $ablauf > $jetzt) : [];
    $schluessel = hash('sha256', $payload);
    $benutzt = isset($liste[$schluessel]);
    if (!$benutzt) {
        $liste[$schluessel] = $jetzt + ALTCHA_GUELTIG_SEKUNDEN;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($liste));
    }
    flock($handle, LOCK_UN);
    fclose($handle);
    return $benutzt;
}

$altcha = feld('altcha', 5000);
if ($altcha === '' || !altchaGueltig($altcha, $geheimnis) || schonBenutzt($altcha)) {
    antwort(400, ['ok' => false, 'fehler' => 'Spamschutz']);
}

// Angaben prüfen
$betreff = feld('betreff', 50);
if (!in_array($betreff, ['Kontaktanfrage', 'Terminanfrage'], true)) {
    $betreff = 'Anfrage';
}
$name = einzeilig(feld('name'));
$email = einzeilig(feld('email'));
$telefon = einzeilig(feld('telefon', 50));
$nachricht = feld('nachricht', 5000);
$heilmittel = array_slice(array_filter(array_map(
    fn($h) => is_string($h) ? einzeilig(mb_substr($h, 0, 100)) : '',
    is_array($_POST['heilmittel'] ?? null) ? $_POST['heilmittel'] : []
)), 0, 20);
$einwilligungGesundheit = feld('einwilligung_gesundheitsdaten') === 'ja';

$fehlt = [];
if ($name === '') $fehlt[] = 'name';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $fehlt[] = 'email';
if ($telefon === '') $fehlt[] = 'telefon';
if (feld('datenschutz') !== 'ja') $fehlt[] = 'datenschutz';
if ($heilmittel && !$einwilligungGesundheit) $fehlt[] = 'einwilligung_gesundheitsdaten';
if ($fehlt) {
    antwort(422, ['ok' => false, 'fehler' => 'Pflichtfelder', 'felder' => $fehlt]);
}

// Mailtext
$zeilen = [
    "Neue $betreff über die Website",
    '',
    "Name: $name",
    "E-Mail: $email",
    "Telefon: $telefon",
];
if ($heilmittel) {
    $zeilen[] = 'Heilmittel laut Rezept: ' . implode(', ', $heilmittel);
    $zeilen[] = 'Einwilligung Gesundheitsdaten: ja';
}
$zeilen[] = '';
$zeilen[] = 'Nachricht:';
$zeilen[] = $nachricht !== '' ? $nachricht : '(keine)';
$zeilen[] = '';
$zeilen[] = '--';
$zeilen[] = 'Datenschutzerklärung zugestimmt: ja';
$zeilen[] = 'Gesendet am ' . (new DateTime('now', new DateTimeZone('Europe/Berlin')))->format('d.m.Y \u\m H:i \U\h\r');
$zeilen[] = 'Antworten geht direkt an die Absender-Adresse.';
$text = implode("\r\n", $zeilen);

$absender = (string) $config['absender'];
$empfaenger = (string) $config['empfaenger'];
$kodiere = fn(string $s) => '=?UTF-8?B?' . base64_encode($s) . '?=';

$kopf = [
    'Date: ' . date('r'),
    'From: ' . $kodiere((string) ($config['absender_name'] ?? 'Website')) . " <$absender>",
    "To: <$empfaenger>",
    'Reply-To: ' . $kodiere($name) . " <$email>",
    'Subject: ' . $kodiere("$betreff von $name"),
    'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . substr(strrchr($absender, '@'), 1) . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
];
$mail = implode("\r\n", $kopf) . "\r\n\r\n" . chunk_split(base64_encode($text), 76, "\r\n");

// Versand per SMTP (SSL, Port 465) über das Postfach aus der Konfiguration
// Gibt '' zurück, wenn alles geklappt hat, sonst eine kurze Fehlerbeschreibung
function smtpSenden(array $config, string $von, string $an, string $mail): string
{
    $verbindung = @stream_socket_client(
        'ssl://' . $config['smtp_host'] . ':' . (int) ($config['smtp_port'] ?? 465),
        $fehlerNr,
        $fehlerText,
        15
    );
    if (!$verbindung) {
        error_log("Formular: SMTP-Verbindung fehlgeschlagen ($fehlerNr $fehlerText)");
        return "Verbindung $fehlerNr " . mb_substr((string) $fehlerText, 0, 80);
    }
    stream_set_timeout($verbindung, 15);
    $schrittFehler = '';

    $lesen = function () use ($verbindung): string {
        $antwort = '';
        while (($zeile = fgets($verbindung, 515)) !== false) {
            $antwort .= $zeile;
            if (strlen($zeile) < 4 || $zeile[3] === ' ') break;
        }
        return $antwort;
    };
    // Schritt und Antwort des Mailservers merken (enthält nie das Passwort)
    $befehl = function (string $schritt, ?string $zeile, string $erwartet) use ($verbindung, $lesen, &$schrittFehler): bool {
        if ($zeile !== null) fwrite($verbindung, $zeile . "\r\n");
        $antwort = trim($lesen());
        if (strncmp($antwort, $erwartet, 3) !== 0) {
            $schrittFehler = "$schritt: " . mb_substr(preg_replace('/\s+/', ' ', $antwort), 0, 120);
            error_log('Formular: SMTP-Fehler ' . $schrittFehler);
            return false;
        }
        return true;
    };

    $host = $_SERVER['SERVER_NAME'] ?? 'localhost';
    $befehl('Begrüßung', null, '220')
        && $befehl('EHLO', "EHLO $host", '250')
        && $befehl('Anmeldung', 'AUTH LOGIN', '334')
        && $befehl('Benutzer', base64_encode((string) $config['smtp_benutzer']), '334')
        && $befehl('Passwort', base64_encode((string) $config['smtp_passwort']), '235')
        && $befehl('Absender', "MAIL FROM:<$von>", '250')
        && $befehl('Empfänger', "RCPT TO:<$an>", '250')
        && $befehl('Daten', 'DATA', '354')
        && $befehl('Nachricht', rtrim($mail) . "\r\n.", '250');
    fwrite($verbindung, "QUIT\r\n");
    fclose($verbindung);
    return $schrittFehler;
}

// Testphase: Fehlerdetails des Mailservers mit ausgeben (vor dem Livegang wieder nur „Versand“)
$versandFehler = smtpSenden($config, $absender, $empfaenger, $mail);
if ($versandFehler !== '') {
    antwort(502, ['ok' => false, 'fehler' => "Versand – $versandFehler"]);
}

antwort(200, ['ok' => true]);
