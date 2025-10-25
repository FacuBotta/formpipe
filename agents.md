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
Test backend environment: PHP + PHPMailer (inside @formpipe/contactForm/php)

📦 Monorepo Structure
formpipe/
├── agents.md
├── contributors.md
├── eslint.config.mjs
├── LICENSE
├── package.json
├── package-lock.json
├── packages
│   ├── contact-form
│   │   ├── dist
│   │   ├── formpipe-contact-form-0.1.0.tgz
│   │   ├── package.json
│   │   ├── php
│   │   ├── src
│   │   ├── tests
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   └── validators
│   ├── dist
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   ├── src
│   ├── tests
│   └── tsup.config.ts
├── README.md
├── test
│   ├── formpipe.config.json
│   ├── index.html
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
└── tsconfig.base.json

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

From the project root (/formpipe):

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

Documentation

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

Documentation Rules

All code in the formpipe/ repository **must be documented**. This includes:

1. **Functions**

   - Every function must have a **JSDoc block** describing:
     - Purpose / what the function does
     - Parameters (type + description)
     - Return type
     - Possible errors or exceptions thrown
   - Example:
     ```ts
     /**
      * Validates that a string is a valid email address.
      *
      * @param value - The string to validate
      * @returns True if the string is a valid email, false otherwise
      * @throws Will throw an error if the input is not a string
      */
     export function validateEmail(value: string): boolean {
       return isEmail(value);
     }
     ```

2. **Classes**

   - Each class must have a **description block** at the top explaining its purpose.
   - All properties and methods should be documented.
   - Example:

     ```ts
     /**
      * Represents a contact form submission.
      * Handles validation, submission, and local persistence.
      */
     export class ContactForm {
       /**
        * The email of the sender.
        */
       public replyTo: string;

       /**
        * Sends the form data to the backend.
        *
        * @returns Promise resolving with submission result
        */
       submit(): Promise<SubmissionResult> {
         // implementation
       }
     }
     ```

3. **Methods**
   - Each method inside a class must have a **JSDoc block**.
   - Include:
     - Purpose
     - Parameters
     - Return type
     - Exceptions/errors thrown
   - Follow same style as functions.

---

📌 **Additional Guidelines for Documentation**

- Use **English** for all docstrings.
- Keep descriptions concise but informative.
- Use proper typing whenever possible (TypeScript types).
- Include examples when the usage might not be obvious.
- Update documentation whenever code is changed.
- Documentation style must follow the existing **JSDoc/TypeScript conventions** used in the project.
