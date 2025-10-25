# @formpipe/validators

A collection of validation tools

## Installation

```bash
npm install @formpipe/validators
```

## Usage


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

### `sanitize(value: string): string`

Sanitizes HTML input by removing all HTML tags, scripts, and potentially dangerous attributes.  
Returns the clean text, trimmed of whitespace at the start and end.

````typescript
import { sanitize } from '@formpipe/validators';

// Clean input
sanitize('<p>Hello World</p>');
// "Hello World"

// Malicious input
sanitize('<script>alert("XSS")</script>Hello');
// "Hello"

// With event handlers
sanitize('<div onclick="evil()">Click me </div>');
// "Click me"

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
````

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

## Contributing

Contributions are currently closed while the monorepo structure and core architecture are being developed.
You’re welcome to open issues or leave suggestions anyway!

## License

[MIT License](https://github.com/FacuBotta/formpipe/blob/main/LICENSE)
