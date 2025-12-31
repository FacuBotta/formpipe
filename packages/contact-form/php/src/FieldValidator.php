<?php

namespace Formpipe\ContactForm;

class FieldValidator
{
  private array $rules;

  public function __construct(array $rules)
  {
    $this->rules = $rules;
  }

  /**
   * Validates all provided fields against configured rules
   *
   * @param array $provided Fields data with 'replyTo' and 'fields' array
   * @return array Validation errors with structure [['field' => string, 'message' => string], ...]
   */
  public function validateAll(array $provided): array
  {
    $errors = [];

    foreach ($this->rules as $field => $fieldRules) {
      $value = $provided[$field] ?? "";
      $fieldErrors = $this->validateField($field, $value, $fieldRules);
      $errors = array_merge($errors, $fieldErrors);
    }

    return $errors;
  }

  /**
   * Validates a single field against its rules
   *
   * @param string $field Field name
   * @param string $value Field value
   * @param array $rules Validation rules for this field
   * @return array Validation errors for this field
   */
  private function validateField(string $field, string $value, array $rules): array
  {
    $errors = [];

    if (($rules['required'] ?? false) && empty($value)) {
      $errors[] = [
        'field' => $field,
        'message' => "$field is required"
      ];
    }

    if (!empty($value)) {
      if (isset($rules['minLength']) && strlen($value) < $rules['minLength']) {
        $errors[] = [
          'field' => $field,
          'message' => "$field is too short"
        ];
      }

      if (isset($rules['maxLength']) && strlen($value) > $rules['maxLength']) {
        $errors[] = [
          'field' => $field,
          'message' => "$field is too long"
        ];
      }

      if (($rules['isEmail'] ?? false) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
        $errors[] = [
          'field' => $field,
          'message' => "$field must be a valid email"
        ];
      }

      if (
        $field === "phoneNumber" && isset($rules['phoneValidationMode']) &&
        !$this->isPhone($value, $rules['phoneValidationMode'])
      ) {
        $errors[] = [
          'field' => $field,
          'message' => "$field must be a valid phone number"
        ];
      }
    }

    return $errors;
  }

  /**
   * Validates phone number according to mode
   *
   * @param string $value Phone number value
   * @param string $mode Validation mode: 'loose', 'strict', or 'e164' (default)
   * @return bool True if valid
   */
  private function isPhone(string $value, string $mode = 'e164'): bool
  {
    if (empty($value)) {
      return false;
    }

    $v = trim($value);

    return match ($mode) {
      'loose'  => (bool)preg_match('/^[\d\s()+-]{8,}$/', $v),
      'strict' => (bool)preg_match('/^\d{8,15}$/', $v),
      default  => (bool)preg_match('/^\+?[1-9]\d{7,14}$/', $v)
    };
  }
}
