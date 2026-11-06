<?php
/*
  Zahlen für die interne Statistikseite (/statistik/), nur mit Passwort.

  POST passwort=…  → {"2026-11-06": 3, …} (Anzahl Terminanfragen pro Tag)

  Das Passwort steht als 'statistik_passwort' in formular-config.php eine Ebene über dem Webordner
  (nicht im Git-Repo, nicht über das Web abrufbar). Ohne diesen Eintrag bleibt die Statistik gesperrt.
  Die Zahlen liest das Skript aus formular-zaehler.json am selben Ort. Darin steht nur „Tag: Anzahl“ –
  keine Namen, Adressen, Uhrzeiten oder sonstigen Personendaten.
*/

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function antwort(int $status, array $daten): void
{
    http_response_code($status);
    echo json_encode($daten, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    antwort(405, ['ok' => false]);
}

$ordner = dirname(__DIR__, 2);
$configPfad = $ordner . '/formular-config.php';
$config = is_file($configPfad) ? require $configPfad : [];
$soll = (string) ($config['statistik_passwort'] ?? '');
$ist = (string) ($_POST['passwort'] ?? '');

// Ohne eingetragenes Passwort (mindestens 12 Zeichen) bleibt die Statistik gesperrt
if (strlen($soll) < 12 || !hash_equals($soll, $ist)) {
    sleep(1); // bremst das Durchprobieren von Passwörtern
    antwort(401, ['ok' => false]);
}

$pfad = $ordner . '/formular-zaehler.json';
$daten = is_file($pfad) ? json_decode((string) file_get_contents($pfad), true) : [];

echo json_encode(is_array($daten) ? (object) $daten : new stdClass(), JSON_UNESCAPED_UNICODE);
