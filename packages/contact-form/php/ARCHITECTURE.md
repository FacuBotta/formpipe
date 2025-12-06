# Contact Form - Clean Architecture Refactoring

## Estructura de Archivos

```
php/
├── contact-form.php          # Punto de entrada principal (lógica de email, debug, CORS)
├── src/
│   ├── RateLimitHandler.php  # Maneja rate limiting con Redis o sesiones
│   ├── FieldValidator.php    # Valida campos según reglas configuradas
│   └── HelperUtilities.php   # Utilidades: sanitización, IP, contenido de email
├── PHPMailer/               # Librería de email (incluida localmente)
└── vendor/                   # Dependencias (composer)
```

## Diagrama de Capas

```
┌─────────────────────────────────────────────────────────┐
│              contact-form.php                            │
│  (Orquestador: Headers, Debug, Email, CORS)              │
└──────────────┬──────────────┬──────────────┬─────────────┘
               │              │              │
        ┌──────▼───────┐ ┌────▼──────────┐ ┌─▼──────────────────┐
        │FieldValidator│ │RateLimitHandler│ │HelperUtilities   │
        │              │ │                 │ │                   │
        │• validateAll()│ │• checkLimit()  │ │• getClientIP()    │
        │• isPhone()   │ │• closeConn()   │ │• sanitizeField()  │
        └──────────────┘ │                 │ │• buildEmailContent│
                         │ (Redis injection)│ └───────────────────┘
                         └─────────────────┘
```

## Clases

### `RateLimitHandler`

**Propósito**: Gestiona el rate limiting de requests usando Redis (si está disponible) o sesiones PHP.

**Principios SOLID aplicados**:

- **Dependency Injection**: Recibe la conexión de Redis en el constructor (no la crea internamente)
- **Single Responsibility**: Solo maneja rate limiting
- **Graceful Degradation**: Si Redis no está disponible, usa sesiones automáticamente

**Métodos públicos**:

```php
public function __construct($redis = null)
public function checkLimit(string $clientIP, int $limit): array
public function closeConnection(): void
```

**Ejemplo de uso**:

```php
$rateLimitHandler = new RateLimitHandler($redis);
$rate = $rateLimitHandler->checkLimit('192.168.1.1', 10);

if (!$rate['allowed']) {
    // Rate limit exceeded
}
```

**Retorno de `checkLimit()`**:

```php
[
    'allowed' => bool,      // Si el request está permitido
    'remaining' => int,     // Requests restantes en la ventana
    'resetIn' => int        // Segundos hasta el reset
]
```

### `FieldValidator`

**Propósito**: Valida campos de formulario según reglas configuradas.

**Métodos públicos**:

```php
public function __construct(array $rules)
public function validateAll(array $provided): array
```

**Ejemplo de uso**:

```php
$rules = [
    'email' => ['required' => true, 'isEmail' => true],
    'phone' => ['required' => true, 'phoneValidationMode' => 'e164'],
    'message' => ['required' => true, 'maxLength' => 1000]
];

$validator = new FieldValidator($rules);
$errors = $validator->validateAll([
    'email' => 'user@example.com',
    'phone' => '+1234567890',
    'message' => 'Hello world'
]);

if (!empty($errors)) {
    // Retorna: [['field' => 'email', 'message' => '...'], ...]
}
```

### `HelperUtilities`

**Propósito**: Centraliza funciones de utilidad reutilizables.

**Métodos estáticos**:

```php
public static function getClientIP(): string
public static function sanitizeField(string $value): string
public static function buildEmailContent(array $validated): string
```

## Flujo de ejecución en `contact-form.php`

1. **Headers y CORS**: Configura headers y maneja OPTIONS preflight
2. **Debug Setup**: Inicializa el sistema de debug logging
3. **Cargar PHPMailer**: Según configuración (local o vendor)
4. **Parse Input**: Decodifica JSON del request
5. **Redis Connection**: Intenta conectar a Redis (opcional)
6. **Rate Limiting**: Verifica límite de rate usando `RateLimitHandler`
7. **Extraction**: Extrae campos del input
8. **Validation**: Valida usando `FieldValidator`
9. **Sanitization**: Limpia datos usando `HelperUtilities`
10. **Email Send**: Envía email con PHPMailer
11. **Cleanup**: Cierra conexiones

## Ventajas de la Refactorización

✅ **Separación de responsabilidades**: Cada clase tiene un propósito único
✅ **Testabilidad**: Clases independientes fáciles de testear
✅ **Reutilización**: Las clases pueden usarse en otros proyectos
✅ **Mantenibilidad**: Código más limpio y organizado
✅ **Escalabilidad**: Fácil agregar nuevas validaciones o handlers
✅ **Dependency Injection**: Las dependencias se inyectan (no se crean internamente)
✅ **Graceful Degradation**: El sistema funciona sin Redis

## Notas

- La clase `RateLimitHandler` maneja automáticamente el fallback a sesiones si Redis no está disponible
- Las validaciones de teléfono soportan tres modos: `loose`, `strict`, `e164`
- El sanitizado HTML se aplica con `htmlspecialchars()` con flags `ENT_QUOTES`
- Los comentarios en el código siguen en inglés para consistencia internacional
