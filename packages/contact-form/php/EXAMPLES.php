<?php

/**
 * EJEMPLO DE USO - Clases de Clean Architecture
 * 
 * Este archivo muestra cómo utilizar las tres clases principales
 * de forma independiente para validación, rate limiting y utilidades.
 */

require __DIR__ . '/src/RateLimitHandler.php';
require __DIR__ . '/src/FieldValidator.php';
require __DIR__ . '/src/HelperUtilities.php';

use Formpipe\ContactForm\RateLimitHandler;
use Formpipe\ContactForm\FieldValidator;
use Formpipe\ContactForm\HelperUtilities;

// ============================================
// EJEMPLO 1: RateLimitHandler con Redis
// ============================================

// Con Redis (inyección de dependencia)
$redis = new \Redis();
try {
  $redis->connect('localhost', 6379);
  $rateLimiter = new RateLimitHandler($redis);
  echo "Rate Limiter con Redis inicializado\n";
} catch (\Exception $e) {
  // Fallback automático a sesiones
  $rateLimiter = new RateLimitHandler(null);
  echo "Rate Limiter con Sesiones inicializado\n";
}

// Verificar límite
$checkResult = $rateLimiter->checkLimit('192.168.1.100', 10);
echo json_encode($checkResult) . "\n";
// Output: {"allowed":true,"remaining":9,"resetIn":60}

// Limpiar conexión
$rateLimiter->closeConnection();

// ============================================
// EJEMPLO 2: FieldValidator
// ============================================

$validationRules = [
  'email' => [
    'required' => true,
    'isEmail' => true
  ],
  'name' => [
    'required' => true,
    'minLength' => 3,
    'maxLength' => 100
  ],
  'phoneNumber' => [
    'required' => false,
    'phoneValidationMode' => 'e164'  // loose, strict, o e164
  ],
  'message' => [
    'required' => true,
    'maxLength' => 5000
  ]
];

$validator = new FieldValidator($validationRules);

// Datos de prueba (con errores)
$dataWithErrors = [
  'email' => 'invalid-email',      // Error: no es email válido
  'name' => 'Jo',                   // Error: muy corto
  'phoneNumber' => '+1234567890',   // OK
  'message' => 'Hello world'        // OK
];

$errors = $validator->validateAll($dataWithErrors);

if (!empty($errors)) {
  echo "Errores encontrados:\n";
  foreach ($errors as $error) {
    echo "- [{$error['field']}] {$error['message']}\n";
  }
}

// Datos válidos
$validData = [
  'email' => 'user@example.com',
  'name' => 'John Doe',
  'phoneNumber' => '+14155552671',
  'message' => 'This is a test message'
];

$errors = $validator->validateAll($validData);
echo "Validación de datos correctos: " . (empty($errors) ? "OK" : "FALLÓ") . "\n";

// ============================================
// EJEMPLO 3: HelperUtilities
// ============================================

// Obtener IP del cliente
$clientIP = HelperUtilities::getClientIP();
echo "Client IP: $clientIP\n";

// Sanitizar un campo
$userInput = "<script>alert('xss')</script>";
$sanitized = HelperUtilities::sanitizeField($userInput);
echo "Sanitized: $sanitized\n";
// Output: &lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;

// Construir contenido de email
$formData = [
  'name' => 'John Doe',
  'email' => 'john@example.com',
  'message' => "Line 1\nLine 2"
];

$emailBody = HelperUtilities::buildEmailContent($formData);
echo "Email Body:\n$emailBody\n";
// Output:
// <p><strong>Name:</strong> John Doe</p>
// <p><strong>Email:</strong> john@example.com</p>
// <p><strong>Message:</strong> Line 1<br />
// Line 2</p>

// ============================================
// EJEMPLO 4: Flujo completo
// ============================================

echo "\n=== FLUJO COMPLETO ===\n\n";

// 1. Validar entrada
$formInput = [
  'email' => 'user@example.com',
  'name' => 'Alice',
  'phoneNumber' => '+1234567890',
  'message' => 'Great service!'
];

$validator = new FieldValidator($validationRules);
$errors = $validator->validateAll($formInput);

if (!empty($errors)) {
  echo "Validación fallida\n";
  print_r($errors);
  exit;
}

echo "✓ Validación exitosa\n";

// 2. Verificar rate limit
$rateLimiter = new RateLimitHandler(null); // Sin Redis
$limit = $rateLimiter->checkLimit('192.168.1.100', 5);

if (!$limit['allowed']) {
  echo "✗ Rate limit excedido\n";
  exit;
}

echo "✓ Rate limit OK (Remaining: {$limit['remaining']})\n";

// 3. Sanitizar datos
$sanitizedData = [];
foreach ($formInput as $key => $value) {
  $sanitizedData[$key] = HelperUtilities::sanitizeField($value);
}

echo "✓ Datos sanitizados\n";

// 4. Construir email
$emailBody = HelperUtilities::buildEmailContent($sanitizedData);
echo "✓ Email construido\n";

echo "\nFlujo completado exitosamente\n";
