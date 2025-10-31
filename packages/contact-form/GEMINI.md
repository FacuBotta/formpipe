# Project Overview: `@formpipe/contact-form`

This package, part of the `formpipe` monorepo, provides functionalities for handling contact form submissions and sending emails. It includes a TypeScript-based command-line interface (CLI) and integrates with a PHP-based email sending mechanism using PHPMailer.

## Technologies Used

*   **Language**: TypeScript, PHP
*   **Bundler**: tsup
*   **Testing Framework**: Vitest
*   **Package Manager**: npm (with workspaces for monorepo management)
*   **Backend (for email sending)**: PHP with PHPMailer

## Architecture

The `@formpipe/contact-form` package is designed to be modular:
*   **Browser Component**: Provides a `ContactForm` module for frontend integration.
*   **CLI Tool**: A Node.js-based CLI (`formpipe`) for configuration and generation of the PHP backend.
*   **PHP Backend**: A PHP script (`contact-form.template.php`) that handles form submissions, validation, sanitization, rate limiting, and email sending via SMTP using PHPMailer. This PHP component is copied to `dist/php` during the CLI build process.

## Building and Running

This project uses npm for package management. Commands are typically executed at the package level.

### Build

To build the package (both browser and CLI components):

```bash
npm run build
```

### Testing

To run tests for the package:

```bash
npm run test
```

### Development

To run the build in watch mode for development:

```bash
npm run dev
```

### Linting

To lint TypeScript files:

```bash
npm run lint
```

### `@formpipe/contact-form` CLI

The package exposes a CLI tool named `formpipe`. You can execute its commands using `npx`:

*   **Initialize Configuration**: Creates a `formpipe.config.json` file.
    ```bash
    npx formpipe init
    ```
*   **Generate PHP Backend**: Generates the `contact-form.php` file based on the configuration.
    ```bash
    npx formpipe generate
    ```

## Development Conventions

*   **Code Style**: Enforced using ESLint (configuration not explicitly detailed in provided files, but `npm run lint` suggests its use).
*   **Typing**: Strict TypeScript settings are used, extending from a base `tsconfig.base.json` in the monorepo root.
*   **Build Process**: `tsup` is configured to generate both ESM and CJS formats for the CLI, and ESM for the browser component, along with declaration files and sourcemaps. It also handles copying the `php` folder for the CLI.
*   **PHP Integration**: The `php` directory contains the necessary PHP files, including PHPMailer, which are deployed with the CLI.
