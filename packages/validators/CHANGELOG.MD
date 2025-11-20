# Changelog

All notable changes to this project will be documented in this file.  
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)  
and follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

---

## [0.1.5] - 2025-11-20

### Fixed

- `isPhone` validator wasn't correctly exported in the last release - Now it's available!.

### Added

- New `isPhone` validator with support for multiple validation modes:
  - `'e164'` (default): International standard format.
  - `'strict'`: Digits only, 8–15 characters.
  - `'loose'`: Allows spaces, `+`, parentheses, and hyphens.

---

## [0.1.4] - 2025-11-13

### Added

- New `isPhone` validator with support for multiple validation modes:
  - `'e164'` (default): International standard format.
  - `'strict'`: Digits only, 8–15 characters.
  - `'loose'`: Allows spaces, `+`, parentheses, and hyphens.

### Improved

- Documentation updated to include the new `isPhone` function.
- Internal consistency improvements for validation method naming.

---

## [0.1.3] - 2025-10-19

### Fixed

- Corrected documentation and examples in the README.
- General cleanup and structure improvements for publication.

---

## [0.1.2] - 2025-10-18

### Fixed

- Improved `isEmail` validation logic for better RFC compliance.
- Added more comprehensive tests for edge cases.

---

## [0.1.1] - 2025-10-18

### Fixed

- Updated README to improve clarity and fix formatting issues.

---

## [0.1.0] - 2025-10-18

### Added

- Initial release of `@formpipe/validators`.
- Includes:
  - `isEmail`
  - `isString`
  - `isInRange`
- Basic test coverage and TypeScript support.
- _Note: this version was an internal testing release._
