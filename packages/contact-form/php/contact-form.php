<?php
ob_start();

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

// Initialize session for rate limiting fallback
if (session_status() === PHP_SESSION_NONE) {
  session_start();
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

  // Log to file
  $logPath = __DIR__ . '/formpipe.log';
  $logMessage = "[" . date('Y-m-d H:i:s') . "] " . $message;
  if ($data !== null) {
    $logMessage .= " | " . json_encode($data);
  }
  $logMessage .= "\n";

  file_put_contents($logPath, $logMessage, FILE_APPEND);

  // Also log to error_log
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
  ob_clean();
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

addDebugLog("Rate limit check", ['allowed' => $rate['allowed'], 'remaining' => $rate['remaining'], 'resetIn' => $rate['resetIn']]);

if (!$rate['allowed']) {
  addDebugLog("Rate limit exceeded");

  // Close Redis connection
  $rateLimitHandler->closeConnection();

  // Clear ALL buffers safely
  while (ob_get_level() > 0) {
    ob_end_clean();
  }

  http_response_code(429);
  echo json_encode([
    "success" => false,
    "error" => "Rate limit exceeded",
    "retryAfter" => $rate['resetIn']
  ]);
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

addDebugLog("Fields extracted", ['count' => count($provided)]);

// Validate fields
$fieldValidator = new FieldValidator($config['rules']);
$errors = $fieldValidator->validateAll($provided);

addDebugLog("Fields validated", ['errors' => count($errors)]);

if (!empty($errors)) {
  http_response_code(400);
  ob_clean();
  exit(json_encode(["success" => false, "errors" => $errors]));
}

// Sanitize validated data
$validated = [];
foreach ($config['rules'] as $field => $rules) {
  $validated[$field] = HelperUtilities::sanitizeField($provided[$field] ?? "");
}

addDebugLog("Fields sanitized", ['fields' => array_keys($validated)]);

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
  if ($smtpPort == 465) {
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
  } elseif ($smtpPort == 587) {
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
  } else {
    $mail->SMTPSecure = false;
  }

  $mail->setFrom($config["from"], "Contact Form");
  $mail->addAddress($config["to"]);
  $mail->addReplyTo($validated["replyTo"]);

  $mail->Subject = $validated["subject"];
  $mail->isHTML(true);
  $mail->Body = HelperUtilities::buildEmailContent($validated);
  $mail->AltBody = strip_tags($mail->Body);

  addDebugLog("Sending email", ['to' => $config["to"], 'subject' => $validated["subject"]]);

  $mail->send();

  addDebugLog("Email sent successfully");

  $rateLimitHandler->closeConnection();

  http_response_code(200);
  ob_clean();
  $response = json_encode(["success" => true, "message" => "Email sent successfully"]);
  echo $response;
  exit;
} catch (Exception $e) {
  addDebugLog("Email sending failed", ['error' => $e->getMessage()]);

  $rateLimitHandler->closeConnection();

  http_response_code(500);
  ob_clean();
  $response = json_encode([
    "success" => false,
    "error" => "Mailer Error: " . $e->getMessage()
  ]);
  echo $response;
  exit;
}
