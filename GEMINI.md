# Project Overview: formpipe Monorepo

This is a monorepo designed to provide modular utilities for form handling and email sending, primarily targeting static environments. It leverages TypeScript for its frontend and CLI components, and a minimal PHP backend for email processing.

## Packages

The monorepo consists of two main packages:

*   **`@formpipe/validators`**: A collection of generic validation and sanitization functions for form inputs.
*   **`@formpipe/contact-form`**: The core package for handling contact form submissions and sending emails. It includes a command-line interface (CLI) and integrates with a PHP-based email sending mechanism using PHPMailer.

## Technologies Used

*   **Language**: TypeScript
*   **Bundler**: tsup
*   **Testing Framework**: Vitest
*   **Package Manager**: npm (with workspaces for monorepo management)
*   **Linting**: ESLint with `@typescript-eslint`
*   **Backend (for `@formpipe/contact-form`)**: PHP with PHPMailer

## Building and Running

This project uses npm workspaces to manage its packages. Commands executed at the root level will typically apply to all packages.

### Build

To build all packages in the monorepo:

```bash
npm run build
```

Individual packages can also be built by navigating into their respective directories and running their `build` script (which typically executes `tsup`).

### Testing

To run tests for all packages:

```bash
npm run test
```

Individual package tests can be run by navigating into their directories and executing `vitest run`.

### Linting

To lint all TypeScript files across the monorepo:

```bash
npm run lint
```

Individual package linting can be performed by navigating into their directories and running `eslint src --ext .ts`.

### `@formpipe/contact-form` CLI

The `@formpipe/contact-form` package exposes a CLI tool named `formpipe`. You can execute its commands using `npx`:

```bash
npx formpipe <command> [options]
```

For example, to initialize the configuration for the contact form:

```bash
npx formpipe init
```

## Development Conventions

*   **Code Style**: Enforced using ESLint with a TypeScript configuration.
    *   Unused variables are warned against (`no-unused-vars: 'warn'`).
    *   `console.log` statements are allowed (`no-console: 'off'`).
*   **Typing**: Strict TypeScript settings are used, as indicated by `tsconfig.base.json`.
*   **Build Process**: `tsup` is used for bundling, generating both ESM and CJS formats, along with declaration files and sourcemaps.
*   **PHP Integration**: The `@formpipe/contact-form` package includes a `php` directory which is copied to `dist/cli/php` during its build process, providing the necessary backend for email sending.
