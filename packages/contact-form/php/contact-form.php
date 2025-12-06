<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Formpipe\ContactForm\RateLimitHandler;
use Formpipe\ContactForm\FieldValidator;
use Formpipe\ContactForm\HelperUtilities;

// Load dependencies
require __DIR__ . "/src/RateLimitHandler.php";
require __DIR__ . "/src/FieldValidator.php";
require __DIR__ . "/src/HelperUtilities.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight (OPTIONS) request
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

$config = null;

/*
----------------------------------------------------
------------- DEBUG LOGGING SYSTEM ---------------
----------------------------------------------------
*/
$debugLogs = [];

function addDebugLog($message, $data = null)
{
  global $debugLogs, $config;

  if (!($config['debug'] ?? false)) return;

  $log = ['timestamp' => date('Y-m-d H:i:s'), 'message' => $message];
  if ($data !== null) $log['data'] = $data;

  $debugLogs[] = $log;

  error_log("[FORMPIPE DEBUG] " . $message . ($data ? " | " . json_encode($data) : ""));
}

/*
----------------------------------------------------
---------- LOAD PHPMAILER BASED ON CONFIG ----------
----------------------------------------------------
*/
if ($config['useLocalPhpMailer'] ?? false) {
  require __DIR__ . "/PHPMailer/src/Exception.php";
  require __DIR__ . "/PHPMailer/src/PHPMailer.php";
  require __DIR__ . "/PHPMailer/src/SMTP.php";
} else {
  require __DIR__ . "/vendor/autoload.php";
}

/*
----------------------------------------------------
------------------ HANDLE REQUEST ------------------
----------------------------------------------------
*/

// Parse input
$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
  http_response_code(400);
  exit(json_encode(["success" => false, "error" => "Invalid JSON payload"]));
}

addDebugLog("Request received", ['ip' => HelperUtilities::getClientIP()]);

// Initialize Redis connection if available
$redis = null;
try {
  if (extension_loaded('redis')) {
    $host = getenv('REDIS_HOST') ?: 'localhost';
    $port = (int)(getenv('REDIS_PORT') ?: 6379);
    $password = getenv('REDIS_PASSWORD') ?: null;

    $redis = new \Redis();
    if (@$redis->connect($host, $port, 2)) {
      if (empty($password) || @$redis->auth($password)) {
        if (@$redis->ping()) {
          addDebugLog("Redis connection established");
        } else {
          $redis = null;
          addDebugLog("Redis ping failed");
        }
      } else {
        $redis = null;
        addDebugLog("Redis auth failed");
      }
    } else {
      $redis = null;
      addDebugLog("Redis connect failed");
    }
  } else {
    addDebugLog("Redis extension not available");
  }
} catch (\Exception $e) {
  $redis = null;
  addDebugLog("Redis initialization error", ['error' => $e->getMessage()]);
}

// Check rate limit
$rateLimitHandler = new RateLimitHandler($redis);
$rate = $rateLimitHandler->checkLimit(HelperUtilities::getClientIP(), $config['rateLimit']);

if (!$rate['allowed']) {
  addDebugLog("Rate limit exceeded");

  if (session_status() === PHP_SESSION_ACTIVE) {
    session_write_close();
  }

  http_response_code(429);
  $response = json_encode([
    "success" => false,
    "error" => "Rate limit exceeded",
    "retryAfter" => $rate['resetIn']
  ]);
  echo $response;

  $rateLimitHandler->closeConnection();

  flush();
  ob_flush();
  exit;
}

// Extract provided fields
$provided = [];
if (isset($input["replyTo"])) $provided["replyTo"] = $input["replyTo"];
if (isset($input["fields"])) {
  foreach ($input["fields"] as $f) {
    if (isset($f["key"], $f["value"])) $provided[$f["key"]] = $f["value"];
  }
}

// Validate fields
$fieldValidator = new FieldValidator($config['rules']);
$errors = $fieldValidator->validateAll($provided);

if (!empty($errors)) {
  http_response_code(400);
  exit(json_encode(["success" => false, "errors" => $errors]));
}

// Sanitize validated data
$validated = [];
foreach ($config['rules'] as $field => $rules) {
  $validated[$field] = HelperUtilities::sanitizeField($provided[$field] ?? "");
}

/*
----------------------------------------------------
------------------ SEND EMAIL ----------------------
----------------------------------------------------
*/

try {
  $mail = new PHPMailer(true);

  // Use SMTP configuration from environment variables if available
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

  // Enable TLS encryption if port is 587 or 465
  $mail->SMTPSecure = $smtpPort == 465 ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;

  $mail->setFrom($config["from"], "Contact Form");
  $mail->addAddress($config["to"]);
  $mail->addReplyTo($validated["replyTo"]);

  $mail->Subject = $validated["subject"];
  $mail->isHTML(true);
  $mail->Body = HelperUtilities::buildEmailContent($validated);
  $mail->AltBody = strip_tags($mail->Body);

  $mail->send();

  $rateLimitHandler->closeConnection();

  $response = json_encode(["success" => true, "message" => "Email sent successfully"]);
  echo $response;

  flush();
  ob_flush();
  exit;
} catch (Exception $e) {
  $rateLimitHandler->closeConnection();

  http_response_code(500);
  $response = json_encode([
    "success" => false,
    "error" => "Mailer Error: " . $e->getMessage()
  ]);
  echo $response;

  flush();
  ob_flush();
  exit;
}
