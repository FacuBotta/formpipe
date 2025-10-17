🧩 Propósito del proyecto

El repositorio form/ contiene un ecosistema modular de paquetes npm bajo el namespace @form/\*.
Su propósito es facilitar el manejo de formularios de contacto y envío de emails en entornos estáticos utilizando PHP (vía PHPMailer) como backend mínimo.

Los paquetes están organizados bajo una arquitectura Clean Architecture, con capas bien separadas de aplicación, dominio, infraestructura y presentación.
El proyecto crecerá en módulos complementarios (validators, contact-form, cli, ui) para componer un entorno escalable y reutilizable.

⚙️ Stack Tecnológico

Lenguaje: TypeScript

Empaquetador: tsup

Testing: Vitest

Gestor de paquetes: npm (workspaces)

Arquitectura: Clean Architecture

Publicación: npm registry (@form/\*)

Entorno backend de prueba: PHP + PHPMailer (dentro de @form/contact-form/php)

📦 Estructura del Monorepo
form/
├── packages/
│ ├── validators/ → Paquete de validaciones genéricas
│ │ ├── src/
│ │ │ ├── isEmail.ts
│ │ │ ├── isString.ts
│ │ │ └── isInRange.ts
│ │ ├── tests/
│ │ │ └── isEmail.test.ts
│ │ ├── tsup.config.ts
│ │ └── package.json → name: "@form/validators"
│ │
│ ├── contact-form/ → Paquete principal de manejo de formularios y envío
│ │ ├── src/
│ │ │ ├── application/ → Casos de uso, lógica del envío
│ │ │ ├── domain/ → Entidades y reglas de negocio
│ │ │ ├── infrastructure/ → Servicios (PHP, PHPMailer, endpoints)
│ │ │ └── presentation/ → Interfaces del front (configuración y submit)
│ │ ├── php/ → Código PHP del endpoint
│ │ ├── tsup.config.ts
│ │ └── package.json → name: "@form/contact-form"
│ │
│ ├── cli/ → Herramientas CLI (setup, build, test)
│ │ ├── src/
│ │ └── package.json → name: "@form/cli"
│ │
│ └── ui/ → Componentes visuales (inputs, formularios)
│ ├── src/
│ └── package.json → name: "@form/ui"
│
├── package.json → Configuración raíz + npm workspaces
├── tsconfig.base.json → Configuración TypeScript base
└── agents.md → Este archivo

🧠 Arquitectura (Clean Architecture)

Cada paquete sigue la separación de capas:

domain/ → Entidades, reglas de negocio, modelos.
application/ → Casos de uso, coordinan la lógica del dominio.
infrastructure/ → Implementaciones técnicas (PHP, red, persistencia).
presentation/ → Interfaces públicas, adaptadores y vistas.

Dependencias permitidas:

presentation → puede depender de application

application → puede depender de domain

infrastructure → puede depender de application o domain

domain → no depende de nada externo

🧰 Comandos disponibles (npm workspaces)

Desde la raíz (/form):

# Instalar dependencias de todos los paquetes

npm install

# Compilar todos los paquetes

npm run build --workspaces

# Ejecutar tests en todos los paquetes

npm run test --workspaces

# Limpiar artefactos de compilación

npm run clean --workspaces

Desde un paquete específico (por ejemplo, validators):

cd packages/validators
npm run build
npm run test

🧪 Ejemplo: uso de @form/validators
import { isEmail, isString } from "@form/validators";

if (!isEmail(email)) throw new Error("Email inválido");
if (!isString(subject)) throw new Error("Asunto inválido");

🎨 Estilo de Código

Indentación: 2 espacios

Punto y coma: obligatorio al final de cada sentencia

Imports: ordenados por tipo (node, libs externas, internas)

Nombres:

Clases y tipos: PascalCase

Funciones y variables: camelCase

Constantes globales: UPPER_SNAKE_CASE

Comillas: dobles " "

Archivos: una exportación principal por módulo

Commit messages: estilo convencional (feat:, fix:, refactor:, test:)

Ejemplo:

import { isEmail } from "@form/validators";

export function validateEmail(value: string): boolean {
return isEmail(value);
}

🧩 Publicación

Cada paquete dentro de packages/\* se publica individualmente:

cd packages/validators
npm publish --access public

El package.json raíz tiene "private": true y no se publica.
