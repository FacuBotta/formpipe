🧩 Project Purpose

The formpipe/ repository contains a modular ecosystem of npm packages under the @formpipe/\* namespace.
Its purpose is to simplify handling contact forms and email sending in static environments using PHP (via PHPMailer) as a minimal backend.

The packages are organized following a Clean Architecture, with well-separated layers for application, domain, infrastructure, and presentation.
The project is designed to grow through complementary modules (validators, form with CLI, UI) to create a scalable and reusable environment.

⚙️ Tech Stack

Language: TypeScript
Bundler: tsup
Testing: Vitest
Package manager: npm (workspaces)
Architecture: Clean Architecture
Publishing: npm registry (@formpipe/\*)
Test backend environment: PHP + PHPMailer (inside @formpipe/form/php)

📦 Monorepo Structure
form/
├── packages/
│ ├── validators/ → Generic validation package
│ │ ├── src/
│ │ │ ├── isEmail.ts
│ │ │ ├── isString.ts
│ │ │ └── isInRange.ts
│ │ ├── tests/
│ │ │ └── isEmail.test.ts
│ │ ├── tsup.config.ts
│ │ └── package.json → name: "@formpipe/validators"
│ │
│ ├── form/ → Main package for form handling and submission
│ │ ├── src/
│ │ │ ├── application/
│ │ │ │ ├── use-cases/
│ │ │ │ └── services/ → Use cases, sending logic
│ │ │ ├── domain/ → Entities and business rules
│ │ │ ├── presentation/ → Front-end interfaces (config and submit)
│ │ │ └── cli/ → CLI tools (setup, build, test)
│ │ │
│ │ ├── php/ → Generated PHP code for the endpoint
│ │ ├── tsup.config.ts
│ │ └── package.json → name: "@formpipe/form"
│ │
│ ├── ui/ → Visual components (inputs, forms)
│ ├── src/
│ └── package.json → name: "@formpipe/ui"
│
├── package.json → Root configuration + npm workspaces
├── tsconfig.base.json → Base TypeScript configuration
└── agents.md → This file

🧠 Architecture (Clean Architecture)

Each package follows a layered separation:

domain/ → Entities, business rules, models
application/ → Use cases, coordinates domain logic
infrastructure/ → Technical implementations (PHP, network, persistence)
presentation/ → Public interfaces, adapters, and views

Allowed dependencies:

presentation → may depend on application
application → may depend on domain
infrastructure → may depend on application or domain
domain → must not depend on anything external

🧰 Available Commands (npm workspaces)

From the project root (/form):

# Install dependencies for all packages

npm install

# Build all packages

npm run build --workspaces

# Run tests for all packages

npm run test --workspaces

# Clean build artifacts

npm run clean --workspaces

From a specific package (e.g., validators):

cd packages/validators
npm run build
npm run test

🧪 Example: Using @formpipe/validators
import { isEmail, isString } from "@formpipe/validators";

if (!isEmail(email)) throw new Error("Invalid email");
if (!isString(subject)) throw new Error("Invalid subject");

🎨 Code Style

Indentation: 2 spaces
Semicolons: required at the end of every statement
Imports: ordered by type (node, external libs, internal)

Naming conventions:

Element Style
Classes & types PascalCase
Functions & variables camelCase
Global constants UPPER_SNAKE_CASE

Quotes: double " "
Files: one main export per module
Commit messages: conventional style (feat:, fix:, refactor:, test:)

Example:

import { isEmail } from "@formpipe/validators";

export function validateEmail(value: string): boolean {
return isEmail(value);
}

🧩 Publishing

Each package inside packages/\* is published individually:

cd packages/validators
npm publish --access public

The root package.json has "private": true and is not published.
