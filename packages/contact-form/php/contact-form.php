<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Formpipe\ContactForm\FieldValidator;
use Formpipe\ContactForm\HelperUtilities;
use Formpipe\ContactForm\RateLimitHandler;


// Load dependencies
require __DIR__ . "/src/FieldValidator.php";
require __DIR__ . "/src/HelperUtilities.php";
require __DIR__ . "/src/RateLimitHandler.php";

// NO establecer headers aquí - los estableceremos después del rate limit check
// Esto evita problemas cuando necesitamos cambiar el código de respuesta HTTP

// Handle preflight (OPTIONS) request
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");


$config = null;

/*
----------------------------------------------------
------------- DEBUG LOGGING SYSTEM ---------------
----------------------------------------------------
*/
function addDebugLog($message, $data = null)
{
  global $config;
  if (!$config['debug']) return;

  $logPath = __DIR__ . '/formpipe.log';
  $logMessage = "[" . date('Y-m-d H:i:s') . "] " . $message;
  if ($data !== null) $logMessage .= " | " . json_encode($data);
  $logMessage .= "\n";

  // Usar file locking para evitar problemas con escrituras concurrentes
  $fp = @fopen($logPath, 'a');
  if ($fp !== false) {
    if (flock($fp, LOCK_EX | LOCK_NB)) {
      fwrite($fp, $logMessage);
      fflush($fp);
      flock($fp, LOCK_UN);
    }
    fclose($fp);
  }

  error_log("[FORMPIPE DEBUG] " . $message . ($data ? " | " . json_encode($data) : ""));
}

/*
----------------------------------------------------
---------- LOAD PHPMAILER BASED ON CONFIG ----------
----------------------------------------------------
*/
if ($config['useLocalPhpMailer']) {
  require __DIR__ . "/PHPMailer/src/Exception.php";
  require __DIR__ . "/PHPMailer/src/PHPMailer.php";
  require __DIR__ . "/PHPMailer/src/SMTP.php";
} else {
  require __DIR__ . "/vendor/autoload.php";
}

/*
----------------------------------------------------
------------------ RATE LIMIT ----------------------
----------------------------------------------------
*/
addDebugLog("Request received", [
  'ip' => HelperUtilities::getClientIP()
]);

$rateLimiter = new RateLimitHandler(
  __DIR__ . '/limits',
  (int) $config['rateLimit']
);

$rateResult = $rateLimiter->check(
  HelperUtilities::getClientIP()
);

if (!$rateResult['allowed']) {
  http_response_code(429);
  echo json_encode([
    "success" => false,
    "error" => "Rate limit exceeded",
    "retryAfter" => $rateResult['retryAfter']
  ]);
  exit;
}

/*
----------------------------------------------------
------------------ PROCESS REQUEST -----------------
----------------------------------------------------
*/

// Read raw JSON payload (application/json requests do not populate $_POST)

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
  http_response_code(400);
  echo json_encode(["success" => false, "error" => "Invalid JSON payload"]);
  exit;
}

/*
----------------------------------------------------
------------------ VALIDATE FIELDS -----------------
----------------------------------------------------
*/

// Extract & validate fields
$provided = [];
if (isset($input["replyTo"])) $provided["replyTo"] = $input["replyTo"];
if (isset($input["fields"])) {
  foreach ($input["fields"] as $f) {
    if (isset($f["key"], $f["value"])) $provided[$f["key"]] = $f["value"];
  }
}

addDebugLog("Fields extracted", ['count' => count($provided)]);

$fieldValidator = new FieldValidator($config['rules']);
$errors = $fieldValidator->validateAll($provided);

if (!empty($errors)) {
  http_response_code(400);
  echo json_encode(["success" => false, "errors" => $errors]);
  exit;
}

// Sanitize
$validated = [];
foreach ($config['rules'] as $field => $rules) {
  $validated[$field] = HelperUtilities::sanitizeField($provided[$field] ?? "");
}
addDebugLog("Fields sanitized", ['fields' => array_keys($validated)]);

// Send email
try {
  $mail = new PHPMailer(true);

  $smtpHost = getenv('FORMPIPE_SMTP_HOST') ?: $config["smtp"]["host"];
  $smtpPort = getenv('FORMPIPE_SMTP_PORT') ?: $config["smtp"]["port"];
  $smtpUser = getenv('FORMPIPE_SMTP_USER') ?: $config["smtp"]["user"];
  $smtpPass = getenv('FORMPIPE_SMTP_PASS') ?: $config["smtp"]["pass"];

  $mail->isSMTP();
  $mail->Host = $smtpHost;
  $mail->Port = $smtpPort;
  $mail->SMTPAuth = !empty($smtpUser);
  if ($mail->SMTPAuth) {
    $mail->Username = $smtpUser;
    $mail->Password = $smtpPass;
  }

  if ($smtpPort == 465) $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
  elseif ($smtpPort == 587) $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
  else $mail->SMTPSecure = false;

  $mail->setFrom($config["from"], "Contact Form");
  $mail->addAddress($config["to"]);
  $mail->addReplyTo($validated["replyTo"]);
  $mail->Subject = $validated["subject"];
  $mail->isHTML(true);
  $mail->Body = HelperUtilities::buildEmailContent($validated);
  $mail->AltBody = strip_tags($mail->Body);

  // Asegurar que SMTPKeepAlive esté desactivado para cerrar la conexión después de enviar
  $mail->SMTPKeepAlive = false;

  addDebugLog("Sending email", ['to' => $config["to"], 'subject' => $validated["subject"]]);
  $mail->send();
  addDebugLog("Email sent successfully");

  // Cerrar explícitamente la conexión SMTP
  $mail->smtpClose();

  http_response_code(200);
  echo json_encode([
    "success" => true,
    "message" => "Email sent successfully"
  ]);
  exit;
} catch (Exception $e) {
  addDebugLog("Email sending failed", ['error' => $e->getMessage()]);

  http_response_code(500);
  echo json_encode([
    "success" => false,
    "error" => "Mailer Error: " . $e->getMessage()
  ]);
  exit;
}
