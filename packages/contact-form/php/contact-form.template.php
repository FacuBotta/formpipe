<?php

require "PHPMailer/src/Exception.php";
require "PHPMailer/src/PHPMailer.php";
require "PHPMailer/src/SMTP.php";

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

  $mail->isSMTP();
  $mail->Host = $config["smtp"]["host"];
  $mail->Port = $config["smtp"]["port"];
  $mail->SMTPAuth = shouldUseSMTPAuth($config["smtp"]);
  if ($mail->SMTPAuth) {
    $mail->Username = $config["smtp"]["user"];
    $mail->Password = $config["smtp"]["pass"];
  }
  $mail->SMTPSecure = getSMTPSecure($config["smtp"]["port"]);

  $mail->setFrom($config["from"], "Contact Form");
  $mail->addAddress($config["to"]);
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
