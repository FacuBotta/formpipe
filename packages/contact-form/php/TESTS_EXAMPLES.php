<?php

/**
 * TEST EXAMPLES - Clases de Clean Architecture
 * 
 * Este archivo muestra ejemplos de cómo testear las clases
 * usando pruebas unitarias simples (sin framework).
 */

require __DIR__ . '/src/RateLimitHandler.php';
require __DIR__ . '/src/FieldValidator.php';
require __DIR__ . '/src/HelperUtilities.php';

use Formpipe\ContactForm\RateLimitHandler;
use Formpipe\ContactForm\FieldValidator;
use Formpipe\ContactForm\HelperUtilities;

class SimpleTestRunner
{
  private int $passed = 0;
  private int $failed = 0;
  private array $failures = [];

  public function assert(bool $condition, string $message): void
  {
    if ($condition) {
      $this->passed++;
      echo "✓ $message\n";
    } else {
      $this->failed++;
      $this->failures[] = $message;
      echo "✗ $message\n";
    }
  }

  public function assertEquals($expected, $actual, string $message): void
  {
    $this->assert($expected === $actual, "$message (expected: " . json_encode($expected) . ", got: " . json_encode($actual) . ")");
  }

  public function assertContains(string $needle, string $haystack, string $message): void
  {
    $this->assert(strpos($haystack, $needle) !== false, "$message");
  }

  public function report(): void
  {
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "TEST RESULTS: " . $this->passed . " passed, " . $this->failed . " failed\n";
    echo str_repeat("=", 60) . "\n";

    if (!empty($this->failures)) {
      echo "\nFailures:\n";
      foreach ($this->failures as $failure) {
        echo "  - $failure\n";
      }
    }
  }
}

$test = new SimpleTestRunner();

echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║        TESTING: FieldValidator                             ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

$rules = [
  'email' => ['required' => true, 'isEmail' => true],
  'name' => ['required' => true, 'minLength' => 3, 'maxLength' => 50],
  'age' => ['required' => false],
];

$validator = new FieldValidator($rules);

// Test 1: Valid data
$validData = ['email' => 'user@example.com', 'name' => 'John Doe', 'age' => ''];
$errors = $validator->validateAll($validData);
$test->assertEquals([], $errors, "Valid data should have no errors");

// Test 2: Missing required field
$missingData = ['email' => '', 'name' => 'John', 'age' => ''];
$errors = $validator->validateAll($missingData);
$test->assert(!empty($errors), "Missing required field should produce errors");
$test->assert(count($errors) >= 1, "Should have at least one error for missing email");

// Test 3: Invalid email format
$invalidEmailData = ['email' => 'not-an-email', 'name' => 'John', 'age' => ''];
$errors = $validator->validateAll($invalidEmailData);
$test->assert(!empty($errors), "Invalid email should produce error");
$test->assert(
  isset($errors[0]['field']) && $errors[0]['field'] === 'email',
  "Error should reference email field"
);

// Test 4: Field too short
$shortNameData = ['email' => 'user@example.com', 'name' => 'Jo', 'age' => ''];
$errors = $validator->validateAll($shortNameData);
$test->assert(!empty($errors), "Name too short should produce error");
$test->assertContains('too short', $errors[0]['message'], "Error message should mention 'too short'");

// Test 5: Field too long
$longNameData = [
  'email' => 'user@example.com',
  'name' => str_repeat('x', 51),
  'age' => ''
];
$errors = $validator->validateAll($longNameData);
$test->assert(!empty($errors), "Name too long should produce error");
$test->assertContains('too long', $errors[0]['message'], "Error message should mention 'too long'");

// Test 6: Optional field (can be empty)
$optionalData = ['email' => 'user@example.com', 'name' => 'John', 'age' => ''];
$errors = $validator->validateAll($optionalData);
$test->assertEquals([], $errors, "Optional empty field should not produce error");

echo "\n╔════════════════════════════════════════════════════════════╗\n";
echo "║        TESTING: RateLimitHandler                           ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

// Note: Redis tests require Redis to be running
$rateLimiter = new RateLimitHandler(null); // Using session fallback

// Test 1: First request should be allowed
$result = $rateLimiter->checkLimit('192.168.1.1', 5);
$test->assertEquals(true, $result['allowed'], "First request should be allowed");
$test->assertEquals(4, $result['remaining'], "First request should have 4 remaining");

// Test 2: Multiple requests within limit
for ($i = 0; $i < 4; $i++) {
  $result = $rateLimiter->checkLimit('192.168.1.1', 5);
  $test->assertEquals(true, $result['allowed'], "Request " . ($i + 2) . " should be allowed");
}

// Test 3: Exceeding limit
$result = $rateLimiter->checkLimit('192.168.1.1', 5);
$test->assertEquals(false, $result['allowed'], "6th request should be rate limited");
$test->assertEquals(0, $result['remaining'], "Should have 0 remaining after limit exceeded");

// Test 4: Different IP should have separate limit
$rateLimiter2 = new RateLimitHandler(null);
$result = $rateLimiter2->checkLimit('192.168.1.2', 5);
$test->assertEquals(true, $result['allowed'], "Different IP should have separate limit");
$test->assertEquals(4, $result['remaining'], "Different IP should have fresh limit");

echo "\n╔════════════════════════════════════════════════════════════╗\n";
echo "║        TESTING: HelperUtilities                            ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

// Test 1: sanitizeField - Remove XSS
$xssInput = "<script>alert('xss')</script>";
$sanitized = HelperUtilities::sanitizeField($xssInput);
$test->assert(strpos($sanitized, '<script>') === false, "XSS script tags should be escaped");
$test->assertContains('&lt;script&gt;', $sanitized, "Script tag should be HTML encoded");

// Test 2: sanitizeField - Trim whitespace
$whitespaceInput = "  hello world  ";
$sanitized = HelperUtilities::sanitizeField($whitespaceInput);
$test->assertEquals('hello world', $sanitized, "Whitespace should be trimmed");

// Test 3: sanitizeField - Quote encoding
$quoteInput = "It's a \"test\"";
$sanitized = HelperUtilities::sanitizeField($quoteInput);
$test->assertContains('&#039;', $sanitized, "Single quote should be encoded");
$test->assertContains('&quot;', $sanitized, "Double quote should be encoded");

// Test 4: buildEmailContent - HTML structure
$data = ['name' => 'John', 'message' => 'Hello'];
$html = HelperUtilities::buildEmailContent($data);
$test->assertContains('<p><strong>Name:</strong> John</p>', $html, "Should contain structured HTML");
$test->assertContains('<p><strong>Message:</strong> Hello</p>', $html, "Should contain all fields");

// Test 5: buildEmailContent - Line breaks
$data = ['message' => "Line 1\nLine 2"];
$html = HelperUtilities::buildEmailContent($data);
$test->assertContains('<br />', $html, "Should convert newlines to <br />");

// Test 6: getClientIP - Valid IP detection
// Note: This test depends on $_SERVER variables
$originalServer = $_SERVER;
$_SERVER['REMOTE_ADDR'] = '10.0.0.1';
$ip = HelperUtilities::getClientIP();
$test->assertEquals('10.0.0.1', $ip, "Should get IP from REMOTE_ADDR");

// Test 7: getClientIP - Priority (HTTP_CLIENT_IP > HTTP_X_FORWARDED_FOR)
$_SERVER['HTTP_CLIENT_IP'] = '192.168.1.1';
$_SERVER['HTTP_X_FORWARDED_FOR'] = '172.16.0.1';
$ip = HelperUtilities::getClientIP();
$test->assertEquals('192.168.1.1', $ip, "Should prioritize HTTP_CLIENT_IP");

// Restore original
$_SERVER = $originalServer;

echo "\n╔════════════════════════════════════════════════════════════╗\n";
echo "║        TESTING: Phone Validation                           ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

$phoneRules = ['phone' => ['phoneValidationMode' => 'e164']];
$phoneValidator = new FieldValidator($phoneRules);

// Test valid phones
$validPhones = [
  ['phone' => '+14155552671'],  // US
  ['phone' => '+441632960000'], // UK
];

foreach ($validPhones as $data) {
  $errors = $phoneValidator->validateAll($data);
  $test->assertEquals([], $errors, "Phone {$data['phone']} should be valid in e164 mode");
}

// Test invalid phones
$invalidPhones = [
  ['phone' => '123'],                // Too short
  ['phone' => '14155552671'],        // Missing +
];

foreach ($invalidPhones as $data) {
  $errors = $phoneValidator->validateAll($data);
  $test->assert(!empty($errors), "Phone {$data['phone']} should be invalid in e164 mode");
}

// Final report
$test->report();
