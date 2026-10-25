<?php
// Einmal-Hilfe für den Passwortschutz der Vorschau (z. B. physio.timwittke.de).
// In denselben Ordner wie die index.html hochladen, im Browser aufrufen, Benutzername und Passwort festlegen.
// Legt .htpasswd und .htaccess in diesem Ordner an und löscht sich danach selbst.
// Das Passwort wird nicht gespeichert, nur sein Hash (bcrypt).

$dir = __DIR__;
$message = '';
$done = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = trim($_POST['user'] ?? '');
    $pass = $_POST['pass'] ?? '';
    $repeat = $_POST['repeat'] ?? '';

    if (!preg_match('/^[A-Za-z0-9._-]{3,32}$/', $user)) {
        $message = 'Benutzername: 3–32 Zeichen, nur Buchstaben, Ziffern, Punkt, Unterstrich oder Bindestrich.';
    } elseif (strlen($pass) < 10) {
        $message = 'Das Passwort muss mindestens 10 Zeichen lang sein.';
    } elseif ($pass !== $repeat) {
        $message = 'Die beiden Passwörter stimmen nicht überein.';
    } elseif (file_exists("$dir/.htaccess") || file_exists("$dir/.htpasswd")) {
        $message = 'In diesem Ordner gibt es schon eine .htaccess oder .htpasswd. Abgebrochen, damit nichts überschrieben wird.';
    } else {
        $hash = password_hash($pass, PASSWORD_BCRYPT);
        $htaccess = "# Passwortschutz der Vorschau\n"
            . "AuthType Basic\n"
            . "AuthName \"Vorschau\"\n"
            . "AuthUserFile $dir/.htpasswd\n"
            . "Require valid-user\n";
        $ok = file_put_contents("$dir/.htpasswd", "$user:$hash\n") !== false
            && file_put_contents("$dir/.htaccess", $htaccess) !== false;
        if ($ok) {
            @unlink(__FILE__);
            $done = true;
        } else {
            $message = 'Die Dateien konnten nicht geschrieben werden. Bitte die Schreibrechte des Ordners prüfen.';
        }
    }
}
?>
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Passwortschutz einrichten</title>
  <style>
    body { font: 16px/1.6 system-ui, sans-serif; max-width: 480px; margin: 48px auto; padding: 0 16px; color: #000; background: #f9f5f0; }
    form { display: grid; gap: 12px; padding: 24px; background: #fff; border-radius: 6px; }
    input { padding: 10px 12px; border: 1px solid #d9d3cc; border-radius: 6px; font: inherit; }
    button { padding: 12px; border: 0; border-radius: 999px; background: #f2c5e0; font: 600 16px system-ui, sans-serif; cursor: pointer; }
    .msg { padding: 12px 16px; border-radius: 6px; background: #f0dce8; }
    .ok { background: #fee5cd; }
    code { font-size: 14px; }
  </style>
</head>
<body>
  <h1>Passwortschutz einrichten</h1>
  <?php if ($done): ?>
    <p class="msg ok">
      Fertig. Der Ordner ist jetzt geschützt, diese Hilfsdatei hat sich selbst gelöscht.
      Lade die Seite neu: Es sollte die Passwortabfrage erscheinen.
    </p>
  <?php else: ?>
    <?php if (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off'): ?>
      <p class="msg">Hinweis: Diese Seite ist nicht über https aufgerufen. Besser erst SSL für die Subdomain aktivieren und dann über https:// öffnen.</p>
    <?php endif; ?>
    <?php if ($message): ?>
      <p class="msg"><?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?></p>
    <?php endif; ?>
    <p>Ordner: <code><?= htmlspecialchars($dir, ENT_QUOTES, 'UTF-8') ?></code></p>
    <form method="post" autocomplete="off">
      <label>Benutzername <input name="user" required minlength="3" maxlength="32"></label>
      <label>Passwort (mind. 10 Zeichen) <input name="pass" type="password" required minlength="10"></label>
      <label>Passwort wiederholen <input name="repeat" type="password" required minlength="10"></label>
      <button type="submit">Passwortschutz einrichten</button>
    </form>
  <?php endif; ?>
</body>
</html>
