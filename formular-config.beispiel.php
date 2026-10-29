<?php
/*
  Vorlage für die Zugangsdaten des Formularversands (public/formular.php).

  So geht's:
  1. Diese Datei kopieren und als formular-config.php speichern (die Kopie ist per .gitignore vom Repo ausgeschlossen).
  2. Werte eintragen, vor allem das Postfach-Passwort.
  3. formular-config.php per SFTP EINE EBENE ÜBER den Webordner legen,
     also neben den Ordner der Seite (z. B. neben „timtestseite“), nicht hinein.
*/

return [
    // Postfach, über das verschickt wird (Strato: smtp.strato.de, Port 465, Benutzer = volle E-Mail-Adresse)
    'smtp_host' => 'smtp.strato.de',
    'smtp_port' => 465,
    'smtp_benutzer' => 'formular@example.de',
    'smtp_passwort' => 'HIER-PASSWORT-EINTRAGEN',

    // Absender (= das Postfach oben) und Empfänger der Anfragen
    'absender' => 'formular@example.de',
    'absender_name' => 'Website Wellenbrock & Wernecken',
    'empfaenger' => 'empfaenger@example.de',

    // Zufälliger Schlüssel für den Spamschutz (mind. 32 Zeichen, nirgends sonst verwenden)
    'altcha_geheimnis' => 'HIER-ZUFAELLIGEN-SCHLUESSEL-EINTRAGEN',
];
