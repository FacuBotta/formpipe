# @form

> ⚠️ **Early Development Notice**: This project is in its early stages of development. APIs might change, and new features are being actively developed.

A modular ecosystem of npm packages for handling contact forms and email sending in static environments, using PHP (via PHPMailer) as a minimal backend.

## 🎯 Purpose

The `@formpipe/*` packages provide a clean and modular approach to handle contact forms in static websites. It follows Clean Architecture principles to ensure maintainability, testability, and separation of concerns.

## 📦 Packages

- [`@formpipe/validators`](https://github.com/FacuBotta/formpipe/tree/main/packages/validators) - Generic validation utilities
- [`@formpipe/contact-form`](https://github.com/FacuBotta/formpipe/tree/main/packages/contact-form) - Main form handling and email sending functionality

## 🏗️ Project Structure

```
form/
├── packages/
│   ├── validators/        # Generic validation utilities
│   ├── contact-form/      # Main form handling package
│   │   ├── application/   # Use cases, sending logic
│   │   ├── domain/       # Entities, business rules
│   │   ├── infrastructure/ # Services (PHP, PHPMailer)
│   │   └── presentation/ # Frontend interfaces
│   ├── cli/              # CLI tools
│   └── ui/               # Visual components
```

## 🛠️ Tech Stack

- Language: TypeScript
- Bundler: tsup
- Testing: Vitest
- Package Manager: npm (workspaces)
- Architecture: Clean Architecture
- Backend: PHP + PHPMailer (included in @formpipe/contact-form/php)

## 🧱 Architecture

The project follows Clean Architecture principles with clear layer separation:

- **Domain**: Core business logic and rules
- **Application**: Use cases and business logic coordination
- **Infrastructure**: Technical implementations (PHP, network, persistence)
- **Presentation**: Public interfaces and adapters

### Layer Dependencies

- Presentation → can depend on Application
- Application → can depend on Domain
- Infrastructure → can depend on Application or Domain
- Domain → no external dependencies

## 🚀 Getting Started

### Installation

```bash
npm install @formpipe/validators @formpipe/contact-form
```

### Basic Usage

```typescript
import { isEmail, isString } from '@formpipe/validators';

if (!isEmail(email)) throw new Error('Invalid email');
if (!isString(subject)) throw new Error('Invalid subject');
```

## 💻 Development

### Requirements

- Node.js (Latest LTS recommended)
- npm

### Setup

```bash
# Install all dependencies
npm install

# Build all packages
npm run build --workspaces

# Run all tests
npm run test --workspaces
```

## 🎨 Code Style

- Indentation: 2 spaces
- Semicolons: required
- Quotes: double quotes
- Naming:
  - Classes/Types: PascalCase
  - Functions/Variables: camelCase
  - Global Constants: UPPER_SNAKE_CASE
- File exports: one main export per module
- Commit messages: conventional style (feat:, fix:, refactor:, test:)

## 📜 License

[MIT License](https://github.com/FacuBotta/formpipe/blob/main/LICENSE)
