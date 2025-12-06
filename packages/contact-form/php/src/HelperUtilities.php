<?php

namespace Formpipe\ContactForm;

class HelperUtilities
{
  /**
   * Gets client IP address from various sources
   *
   * @return string Client IP address
   */
  public static function getClientIP(): string
  {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
      return $_SERVER['HTTP_CLIENT_IP'];
    }

    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
      return trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
    }

    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
  }

  /**
   * Sanitizes and escapes field value for safe HTML output
   *
   * @param string $value Field value to sanitize
   * @return string Sanitized value
   */
  public static function sanitizeField(string $value): string
  {
    return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
  }

  /**
   * Builds HTML email content from validated fields
   *
   * @param array $validated Validated and sanitized field data
   * @return string HTML email body
   */
  public static function buildEmailContent(array $validated): string
  {
    $content = "";

    foreach ($validated as $key => $value) {
      $content .= "<p><strong>" . ucfirst($key) . ":</strong> " . nl2br($value) . "</p>";
    }

    return $content;
  }
}
