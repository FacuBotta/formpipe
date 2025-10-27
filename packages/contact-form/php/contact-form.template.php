<?php
require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

/* if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  exit(json_encode(['error' => 'Method not allowed']));
} */

$config = null;

// Helper function to determine encryption type based on port
function getSMTPSecure($port)
{
  // Port 465 uses SSL/TLS encryption
  if ($port === 465) {
    return PHPMailer::ENCRYPTION_SMTPS;
  }
  // Port 587 uses STARTTLS
  if ($port === 587) {
    return PHPMailer::ENCRYPTION_STARTTLS;
  }
  // Other ports or no encryption (for testing with mailpit)
  return '';
}

// Helper function to determine if SMTP auth should be used
function shouldUseSMTPAuth($smtpConfig)
{
  // Mailpit (and similar testing tools) don't require authentication
  if ($smtpConfig['host'] === 'mailpit' && $smtpConfig['port'] === 1025) {
    return false;
  }
  // Use auth if credentials are provided
  return !empty($smtpConfig['user']) && !empty($smtpConfig['pass']);
}

// Get and decode JSON input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
  http_response_code(400);
  exit(json_encode(['success' => false, 'error' => 'Invalid JSON payload']));
}

// Validate replyTo
if (!isset($input['replyTo']) || !filter_var($input['replyTo'], FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  exit(json_encode(['success' => false, 'error' => 'Invalid or missing replyTo email']));
}

$replyTo = filter_var($input['replyTo'], FILTER_SANITIZE_EMAIL);

// Rate limit check
session_start();
$now = time();
$key = 'formpipe_' . $replyTo;
if (!isset($_SESSION[$key]) || $now - $_SESSION[$key]['last'] > 60) {
  $_SESSION[$key] = ['count' => 0, 'last' => $now];
}
if ($_SESSION[$key]['count'] >= $config['rateLimit']) {
  http_response_code(429);
  exit(json_encode(['success' => false, 'error' => 'Too many requests. Please try again later.']));
}
$_SESSION[$key]['count']++;

// Initialize email content
$emailContent = "";
$validatedFields = [];

// Validate and process fields
if (!isset($input['fields']) || !is_array($input['fields'])) {
  http_response_code(400);
  exit(json_encode(['success' => false, 'error' => 'Invalid or missing fields']));
}

foreach ($input['fields'] as $field) {
  if (!isset($field['key']) || !isset($field['value'])) {
    continue;
  }

  $key = htmlspecialchars($field['key']);
  $value = htmlspecialchars($field['value']);

  // Apply validation rules if they exist for this field
  if (isset($config['rules'][$key])) {
    $rules = $config['rules'][$key];

    if (isset($rules['minLength']) && strlen($value) < $rules['minLength']) {
      http_response_code(400);
      exit(json_encode([
        'success' => false,
        'error' => "$key is too short (minimum length: {$rules['minLength']})"
      ]));
    }

    if (isset($rules['maxLength']) && strlen($value) > $rules['maxLength']) {
      http_response_code(400);
      exit(json_encode([
        'success' => false,
        'error' => "$key is too long (maximum length: {$rules['maxLength']})"
      ]));
    }

    if (isset($rules['required']) && $rules['required'] && empty($value)) {
      http_response_code(400);
      exit(json_encode([
        'success' => false,
        'error' => "$key is required"
      ]));
    }
  }

  $validatedFields[$key] = $value;
  $emailContent .= "<p><strong>" . ucfirst($key) . ":</strong> $value</p>\n";
}

try {
  $mail = new PHPMailer(true);

  // SMTP Configuration
  $mail->isSMTP();
  $mail->Host = $config['smtp']['host'];
  $mail->Port = $config['smtp']['port'];

  // Auto-configure auth based on server type (e.g., mailpit doesn't need auth)
  $mail->SMTPAuth = shouldUseSMTPAuth($config['smtp']);

  if ($mail->SMTPAuth) {
    $mail->Username = $config['smtp']['user'];
    $mail->Password = $config['smtp']['pass'];
  }

  // Auto-configure encryption based on port
  $mail->SMTPSecure = getSMTPSecure($config['smtp']['port']);

  // Email Configuration
  $mail->setFrom($config['from'], 'Contact Form');
  $mail->addAddress($config['to']);
  $mail->addReplyTo($replyTo);

  // Set subject from fields if available, otherwise use default
  $subject = isset($validatedFields['subject']) ? $validatedFields['subject'] : 'New Contact Form Submission';

  $mail->isHTML(true);
  $mail->Subject = $subject;
  $mail->Body = "<h2>New Contact Form Submission</h2>\n" . $emailContent;
  $mail->AltBody = strip_tags($emailContent);


  $mail->send();


  echo json_encode([
    'success' => true,
    'message' => 'Email sent successfully'
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'error' => 'Message could not be sent. Mailer Error: ' . $e->getMessage()
  ]);
}
