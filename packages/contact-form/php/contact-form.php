<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

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
---------- LOAD PHPMAILER BASED ON CONFIG ----------
----------------------------------------------------
*/
if ($config['useLocalPhpMailer']) {
  // Use local PHPMailer from ./PHPMailer/ folder
  require __DIR__ . "/PHPMailer/src/Exception.php";
  require __DIR__ . "/PHPMailer/src/PHPMailer.php";
  require __DIR__ . "/PHPMailer/src/SMTP.php";
} else {
  // Use PHPMailer from composer
  require __DIR__ . "/vendor/autoload.php";
}

/*
----------------------------------------------------
---------- RATE LIMITING HELPER FUNCTIONS ----------
----------------------------------------------------

Rate limiting strategy:
1. PRIMARY: Redis (distributed, production-ready)
   - Required for: multi-server setups, horizontal scaling
   - Configure via: REDIS_HOST, REDIS_PORT env vars
   - Recommended for production

2. FALLBACK: PHP Sessions (if Redis unavailable)
   - Works locally and in development
   - Suitable for single-server deployments

Rate limits are per IP address, using SHA256 hash of IP.
Window: 60 seconds (configurable via rateLimit in config)
*/

// Get Redis connection (returns null if unavailable)
function getRedisConnection()
{
  static $redis = null;

  if ($redis === null) {
    try {
      // Check if Redis extension is available
      if (!extension_loaded('redis')) {
        $redis = false;
        return null;
      }

      $redisHost = getenv('REDIS_HOST') ?: 'redis';
      $redisPort = (int)(getenv('REDIS_PORT') ?: 6379);

      // @phpstan-ignore-next-line - Redis extension not available in IDE but will be in runtime
      $redis = new \Redis();
      @$redis->connect($redisHost, $redisPort, 2); // 2 second timeout

      if (!$redis->ping()) {
        $redis = false;
      }
    } catch (Exception $e) {
      error_log("Redis connection error: " . $e->getMessage());
      $redis = false;
    }
  }

  return $redis !== false ? $redis : null;
}

// Initialize sessions safely (only if not already started)
function initializeSessionSafely()
{
  if (session_status() === PHP_SESSION_NONE) {
    @session_start();
  }
}

function getClientIP()
{
  // Get client IP with proxy support
  if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
    $ip = $_SERVER['HTTP_CLIENT_IP'];
  } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
    $ip = trim($ips[0]);
  } else {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
  }

  // Validate IP format
  if (filter_var($ip, FILTER_VALIDATE_IP)) {
    return $ip;
  }

  return '0.0.0.0';
}

function checkRateLimit($clientIP, $rateLimitPerMinute)
{
  $now = time();
  $windowSize = 60;
  $key = 'formpipe_rl_' . hash('sha256', $clientIP, false);

  try {
    // Try Redis first (if available)
    $redis = getRedisConnection();
    if ($redis !== null) {
      return checkRateLimitRedis($redis, $key, $rateLimitPerMinute, $now, $windowSize);
    }

    // Fallback to sessions
    return checkRateLimitSession($key, $rateLimitPerMinute, $now, $windowSize);
  } catch (Exception $e) {
    error_log("Rate limit check error: " . $e->getMessage());
    // Fail open: allow request if rate limit fails (prefer availability)
    return [
      'allowed' => true,
      'remaining' => $rateLimitPerMinute,
      'resetIn' => $windowSize
    ];
  }
}

function checkRateLimitRedis($redis, $key, $rateLimitPerMinute, $now, $windowSize)
{
  $data = $redis->hGetAll($key);

  if (empty($data)) {
    // First request from this IP
    $redis->hSet($key, 'first_request', $now);
    $redis->hSet($key, 'count', 1);
    $redis->expire($key, $windowSize + 60); // Expire after window + buffer

    return [
      'allowed' => true,
      'remaining' => $rateLimitPerMinute - 1,
      'resetIn' => $windowSize
    ];
  }

  $firstRequest = (int)$data['first_request'];
  $count = (int)$data['count'];
  $timeSinceFirstRequest = $now - $firstRequest;

  if ($timeSinceFirstRequest > $windowSize) {
    // Window expired, reset counter
    $redis->del($key);
    $redis->hSet($key, 'first_request', $now);
    $redis->hSet($key, 'count', 1);
    $redis->expire($key, $windowSize + 60);

    return [
      'allowed' => true,
      'remaining' => $rateLimitPerMinute - 1,
      'resetIn' => $windowSize
    ];
  }

  // Within the window
  if ($count >= $rateLimitPerMinute) {
    $resetIn = $windowSize - $timeSinceFirstRequest;
    return [
      'allowed' => false,
      'remaining' => 0,
      'resetIn' => max(1, $resetIn)
    ];
  }

  // Increment counter
  $redis->hIncr($key, 'count', 1);
  $resetIn = $windowSize - $timeSinceFirstRequest;

  return [
    'allowed' => true,
    'remaining' => $rateLimitPerMinute - ($count + 1),
    'resetIn' => max(1, $resetIn)
  ];
}

function checkRateLimitSession($key, $rateLimitPerMinute, $now, $windowSize)
{
  initializeSessionSafely();

  if (!isset($_SESSION['formpipe_rate_limits'])) {
    $_SESSION['formpipe_rate_limits'] = [];
  }

  $data = &$_SESSION['formpipe_rate_limits'];

  if (!isset($data[$key])) {
    // First request from this IP
    $data[$key] = [
      'first_request' => $now,
      'count' => 1
    ];

    return [
      'allowed' => true,
      'remaining' => $rateLimitPerMinute - 1,
      'resetIn' => $windowSize
    ];
  }

  $lastData = $data[$key];
  $timeSinceFirstRequest = $now - $lastData['first_request'];

  if ($timeSinceFirstRequest > $windowSize) {
    // Window expired, reset counter
    $data[$key] = [
      'first_request' => $now,
      'count' => 1
    ];

    return [
      'allowed' => true,
      'remaining' => $rateLimitPerMinute - 1,
      'resetIn' => $windowSize
    ];
  }

  // Within the window
  if ($lastData['count'] >= $rateLimitPerMinute) {
    $resetIn = $windowSize - $timeSinceFirstRequest;
    return [
      'allowed' => false,
      'remaining' => 0,
      'resetIn' => max(1, $resetIn)
    ];
  }

  // Increment counter
  $data[$key]['count']++;
  $resetIn = $windowSize - $timeSinceFirstRequest;

  return [
    'allowed' => true,
    'remaining' => $rateLimitPerMinute - $data[$key]['count'],
    'resetIn' => max(1, $resetIn)
  ];
}

/* 
----------------------------------------------------
------------ DETERMINE SMTP SETTINGS ---------------
----------------------------------------------------
*/
// Helper function to determine encryption type based on port
function getSMTPSecure($port)
{
  if ($port === 465) {
    return PHPMailer::ENCRYPTION_SMTPS;
  }
  if ($port === 587) {
    return PHPMailer::ENCRYPTION_STARTTLS;
  }
  return "";
}

// Helper function to determine if SMTP auth should be used
function shouldUseSMTPAuth($smtpConfig)
{
  if ($smtpConfig["host"] === "mailpit" && $smtpConfig["port"] === 1025) {
    return false;
  }
  return !empty($smtpConfig["user"]) && !empty($smtpConfig["pass"]);
}

/* 
----------------------------------------------------
------------------ VALIDATION LOGIC -----------------
----------------------------------------------------
*/

// Validate phone numbers (replicates isPhone.ts logic)
function isPhone($value, $mode = 'e164')
{
  if (empty($value)) {
    return false;
  }

  $normalized = trim($value);

  switch ($mode) {
    case 'loose':
      // Allows spaces, '+', parentheses, and hyphens; requires at least 8 digits.
      return preg_match('/^[\d\s()+-]{8,}$/', $normalized) === 1;

    case 'strict':
      // Only digits; minimum 8 and maximum 15 characters.
      return preg_match('/^\d{8,15}$/', $normalized) === 1;

    case 'e164':
    default:
      // International E.164 format: optional '+', followed by 8–15 digits, cannot start with 0.
      return preg_match('/^\+?[1-9]\d{7,14}$/', $normalized) === 1;
  }
}

// Validate a field and return array of error messages
function validateField($field, $value, $rules)
{
  $errs = [];

  if (isset($rules["required"]) && $rules["required"] && empty($value)) {
    $errs[] = ucfirst($field) . " is required";
  }

  if (!empty($value)) {
    if (isset($rules["minLength"]) && strlen($value) < $rules["minLength"]) {
      $errs[] = ucfirst($field) . " is too short (minimum length: " . $rules["minLength"] . ")";
    }

    if (isset($rules["maxLength"]) && strlen($value) > $rules["maxLength"]) {
      $errs[] = ucfirst($field) . " is too long (maximum length: " . $rules["maxLength"] . ")";
    }

    if (isset($rules["isEmail"]) && $rules["isEmail"] && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
      $errs[] = ucfirst($field) . " must be a valid email address";
    }

    // Validate phone number if phoneValidationMode is set (replicates FormValidator.ts logic)
    if ($field === "phoneNumber" && isset($rules["phoneValidationMode"])) {
      $mode = $rules["phoneValidationMode"];
      if (!isPhone($value, $mode)) {
        // Set message according to the mode and add an example of a valid phone number
        switch ($mode) {
          case 'e164':
            $errs[] = ucfirst($field) . " must be a valid E.164 phone number (e.g. +1234567890)";
            break;
          case 'strict':
            $errs[] = ucfirst($field) . " must be a valid phone number (8-15 digits)";
            break;
          case 'loose':
            $errs[] = ucfirst($field) . " must be a valid phone number (8+ digits with spaces, +, parentheses, and hyphens)";
            break;
        }
      }
    }
  }

  return $errs;
}

// Get and decode JSON input
$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
  http_response_code(400);
  exit(json_encode(["success" => false, "error" => "Invalid JSON payload"]));
}

// Collect all provided values
$providedValues = [];
if (isset($input["replyTo"])) {
  $providedValues["replyTo"] = $input["replyTo"];
}
if (isset($input["fields"]) && is_array($input["fields"])) {
  foreach ($input["fields"] as $field) {
    if (isset($field["key"]) && isset($field["value"])) {
      $providedValues[$field["key"]] = $field["value"];
    }
  }
}

// Validate all fields based on rules
$errors = [];
$allRules = $config["rules"];
foreach ($allRules as $field => $rules) {
  $value = $providedValues[$field] ?? "";
  $fieldErrors = validateField($field, $value, $rules);
  foreach ($fieldErrors as $msg) {
    $errors[] = [
      "field" => $field,
      "value" => $value,
      "rules" => $rules,
      "message" => $msg
    ];
  }
}

if (!empty($errors)) {
  http_response_code(400);
  exit(json_encode(["success" => false, "errors" => $errors]));
}

// If no errors, proceed to sanitize and build email content
$validatedFields = [];
foreach ($allRules as $field => $rules) {
  $value = trim($providedValues[$field] ?? "");
  $validatedFields[$field] = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
$emailContent = "";
foreach ($validatedFields as $key => $value) {
  $emailContent .= "<p><strong>" . ucfirst($key) . ":</strong> " . nl2br($value) . "</p>\n";
}

/* 
----------------------------------------------------
------------------ SEND EMAIL LOGIC -----------------
----------------------------------------------------
*/

try {
  $mail = new PHPMailer(true);

  // Use environment variables if available, otherwise fall back to config
  // This allows secure credential management in production
  $smtpHost = getenv('FORMPIPE_SMTP_HOST') ?: $config["smtp"]["host"];
  $smtpPort = (int)(getenv('FORMPIPE_SMTP_PORT') ?: $config["smtp"]["port"]);
  $smtpUser = getenv('FORMPIPE_SMTP_USER') ?: $config["smtp"]["user"];
  $smtpPass = getenv('FORMPIPE_SMTP_PASS') ?: $config["smtp"]["pass"];
  $fromEmail = getenv('FORMPIPE_FROM') ?: $config["from"];
  $toEmail = getenv('FORMPIPE_TO') ?: $config["to"];

  $smtpConfig = [
    "host" => $smtpHost,
    "port" => $smtpPort,
    "user" => $smtpUser,
    "pass" => $smtpPass,
  ];

  $mail->isSMTP();
  $mail->Host = $smtpHost;
  $mail->Port = $smtpPort;
  $mail->SMTPAuth = shouldUseSMTPAuth($smtpConfig);
  if ($mail->SMTPAuth) {
    $mail->Username = $smtpUser;
    $mail->Password = $smtpPass;
  }
  $mail->SMTPSecure = getSMTPSecure($smtpPort);

  $mail->setFrom($fromEmail, "Contact Form");
  $mail->addAddress($toEmail);
  $replyTo = $validatedFields["replyTo"];
  $mail->addReplyTo($replyTo);

  $subject = $validatedFields["subject"];

  $mail->isHTML(true);
  $mail->Subject = $subject;
  $mail->Body = $emailContent;
  $mail->AltBody = strip_tags($emailContent);

  $mail->send();

  echo json_encode([
    "success" => true,
    "message" => "Email sent successfully"
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode([
    "success" => false,
    "error" => "Message could not be sent. Mailer Error: " . $e->getMessage()
  ]);
}
