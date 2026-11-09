<?php
/*
  Zählt Klicks auf „Absenden“ im Terminformular für die interne Statistik (/statistik/).

  Das Formular meldet jeden Klick per navigator.sendBeacon (POST, ohne Inhalt).
  Gespeichert wird nur „Tag: Anzahl“ in formular-klicks.json eine Ebene über dem Webordner
  (neben formular-config.php) – keine IP-Adressen, Uhrzeiten, Cookies oder Formularinhalte.
*/

declare(strict_types=1);

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$pfad = dirname(__DIR__, 2) . '/formular-klicks.json';
$datei = @fopen($pfad, 'c+');
if ($datei === false) {
    error_log('Statistik: Klickzähler nicht beschreibbar');
    http_response_code(204);
    exit;
}

flock($datei, LOCK_EX);
$zaehler = json_decode((string) stream_get_contents($datei), true);
$zaehler = is_array($zaehler) ? $zaehler : [];
$zone = new DateTimeZone('Europe/Berlin');
$heute = (new DateTimeImmutable('now', $zone))->format('Y-m-d');

// Obergrenze pro Tag, damit ein Bot die Zahl nicht beliebig hochtreiben kann
if ((int) ($zaehler[$heute] ?? 0) < 1000) {
    $zaehler[$heute] = (int) ($zaehler[$heute] ?? 0) + 1;
    // nur gut ein Jahr aufheben
    $grenze = (new DateTimeImmutable('-400 days', $zone))->format('Y-m-d');
    $zaehler = array_filter($zaehler, fn ($tag) => $tag >= $grenze, ARRAY_FILTER_USE_KEY);
    ksort($zaehler);
    ftruncate($datei, 0);
    rewind($datei);
    fwrite($datei, json_encode($zaehler));
}

flock($datei, LOCK_UN);
fclose($datei);
http_response_code(204);
