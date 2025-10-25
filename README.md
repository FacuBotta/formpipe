# @formpipe

A modular ecosystem of npm packages for handling contact forms and email sending in static environments, using PHP (via PHPMailer) as a minimal backend.

## Packages

- [`@formpipe/validators`](https://github.com/FacuBotta/formpipe/tree/main/packages/validators) - Generic validation utilities
- [`@formpipe/contact-form`](https://github.com/FacuBotta/formpipe/tree/main/packages/contact-form) - Main form handling and email sending functionality

## Project Structure

```
formpipe/
├── eslint.config.mjs
├── package.json
├── package-lock.json
├── packages
│   ├── contact-form
│   │   ├── dist
│   │   ├── package.json
│   │   ├── php
│   │   ├── src
│   │   ├── tests
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   └── validators
│       ├── dist
│       ├── package.json
│       ├── package-lock.json
│       ├── README.md
│       ├── src
│       ├── tests
│       └── tsup.config.ts
├── README.md
└── tsconfig.base.json
```

## Stack

- Language: TypeScript
- Bundler: tsup
- Testing: Vitest
- Package Manager: npm (workspaces)
- Backend: PHP + PHPMailer (included in @formpipe/contact-form/php)

### Installations

[See @formpipe/validators for individual installation and examples](https://github.com/FacuBotta/formpipe/tree/main/packages/validators#readme)

> @formpipe/contact-form is in early development stage; installation and usage are local at the moment.

[See @formpipe/contact-form for local installation and examples](https://github.com/FacuBotta/formpipe/tree/main/packages/contact-form#readme)



## License

[MIT License](https://github.com/FacuBotta/formpipe/blob/main/LICENSE)
