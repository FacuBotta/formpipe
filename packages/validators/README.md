# @formpipe/validators

A collection of validation tools

### isInRange(value: string, min: number, max: number): boolean

Checks if a string's length is within a specified range (inclusive).

```typescript
import { isInRange } from '@formpipe/validators';

isInRange('hello', 3, 6); // true (5 characters, between 3 and 6)
isInRange('hi', 3, 6); // false (2 characters, less than min)
isInRange('greetings', 3, 6); // false (9 characters, more than max)
isInRange('', 0, 5); // true (empty string allowed when min is 0)
isInRange('👋🌍', 2, 5); // true (2 characters)
```

Handles:

- Empty strings (valid when min=0)
- Unicode characters and emojis
- Special characters
- Input validation (returns false for non-string inputs)ation utilities for form inputs and user-provided content.

## Installation

```bash
npm install @formpipe/validators
```

## Usage

```typescript
import {
  isEmail,
  isString,
  isInRange,
  sanitize,
  escapeHtml,
} from '@formpipe/validators';
```

## API Reference

### isEmail(value: unknown): boolean

Validates if a value is a properly formatted email address.

```typescript
import { isEmail } from '@formpipe/validators';

isEmail('user@example.com'); // true
isEmail('invalid-email'); // false
```

### isString(value: unknown): value is string

Type guard that checks if a value is a string.

```typescript
import { isString } from '@formpipe/validators';

isString('hello'); // true
isString(123); // false
isString(null); // false
```

### isInRange(value: string, min: number, max: number): boolean

Checks if a string's length is within a specified range (inclusive).

```typescript
import { isInRange } from '@formpipe/validators';

isInRange('hello', 3, 6); // true (5 characters, between 3 and 6)
isInRange('hi', 3, 6); // false (2 characters, less than min)
isInRange('greetings', 3, 6); // false (9 characters, more than max)
isInRange('', 0, 5); // true (empty string allowed when min is 0)
isInRange('👋🌍', 2, 5); // true (2 characters)
```

Handles:

- Empty strings (valid when min=0)
- Unicode characters and emojis
- Special characters
- Input validation (returns false for non-string inputs)

### sanitize(value: string): SanitizeResult

Sanitizes HTML input by removing all HTML tags and scripts while detecting potentially malicious code.

Returns an object containing:

- `text`: The sanitized text without any HTML
- `warning`: A warning message if potentially malicious code was detected, null if input was clean

```typescript
import { sanitize } from '@formpipe/validators';

// Clean input
sanitize('<p>Hello World</p>');
// { text: "Hello World", warning: null }

// Malicious input
sanitize('<script>alert("XSS")</script>Hello');
// {
//   text: "Hello",
//   warning: "Potential malicious code detected and removed"
// }

// With event handlers
sanitize('<div onclick="evil()">Click me</div>');
// {
//   text: "Click me",
//   warning: "Potential malicious code detected and removed"
// }
```

Detects and removes:

- Script tags
- Inline event handlers
- Dangerous URLs (javascript:, data:, vbscript:)
- HTML tags while preserving content
- Decodes HTML entities

### escapeHtml(value: string): string

Escapes HTML special characters in a string to prevent XSS. Useful when you need to display user input as HTML.

```typescript
import { escapeHtml } from '@formpipe/validators';

escapeHtml('<p>Hello & World</p>');
// "&lt;p&gt;Hello &amp; World&lt;/p&gt;"

escapeHtml('Quote "test" & <tags>');
// "Quote &quot;test&quot; &amp; &lt;tags&gt;"
```

Escapes the following characters:

- & → &amp;
- < → &lt;
- > → &gt;
- " → &quot;
- ' → &#39;

## TypeScript Support

This package includes TypeScript type definitions. The `isString` function includes a type guard that will narrow the type in TypeScript when used in a conditional.

```typescript
const value: unknown = 'test';
if (isString(value)) {
  // value is typed as string here
  console.log(value.toUpperCase());
}
```

## Security Considerations

The `sanitize` function is designed to remove potentially malicious content but should not be the only line of defense in your application. Always implement proper security measures at multiple levels:

- Input validation
- Content Security Policy (CSP)
- Output encoding
- XSS protection headers

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

MIT
