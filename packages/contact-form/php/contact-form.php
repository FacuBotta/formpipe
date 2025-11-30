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

// Load PHPMailer based on config
if ($config['useLocalPhpMailer']) {
  // Use local PHPMailer from ./PHPMailer/ folder
  require __DIR__ . "/PHPMailer/src/Exception.php";
  require __DIR__ . "/PHPMailer/src/PHPMailer.php";
  require __DIR__ . "/PHPMailer/src/SMTP.php";
} else {
  // Use PHPMailer from composer
  require __DIR__ . "/vendor/autoload.php";
}

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

// Helper function to validate phone numbers (replicates isPhone.ts logic)
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

// Helper function to validate a field and return array of error messages
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
// Send the email
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
  $mail->Body = "<h2>New Contact Form Submission</h2>\n" . $emailContent;
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
