# Environment Variables for Production

This document explains how to configure environment variables for Formpipe in production environments.

Environment variables are used to securely manage SMTP credentials and runtime configuration without hardcoding sensitive data into your PHP files.

## Overview

The generated `contact-form.php` file supports reading SMTP credentials from environment variables. This allows you to:

- Keep credentials out of version control
- Use different credentials for development and production
- Follow security best practices

## How It Works

The PHP code will automatically use environment variables if they are set, otherwise it falls back to the values in the generated config (from `formpipe.config.json`).

**Priority order:**

1. Environment variables (if set)
2. Config values (from `formpipe.config.json`)

## Environment Variables

Set the following environment variables in your production server:

| Variable             | Description             | Example                |
| -------------------- | ----------------------- | ---------------------- |
| `FORMPIPE_SMTP_HOST` | SMTP server hostname    | `smtp.gmail.com`       |
| `FORMPIPE_SMTP_PORT` | SMTP server port        | `587`                  |
| `FORMPIPE_SMTP_USER` | SMTP username           | `your-email@gmail.com` |
| `FORMPIPE_SMTP_PASS` | SMTP password           | `your-app-password`    |
| `FORMPIPE_FROM`      | Sender email address    | `noreply@yoursite.com` |
| `FORMPIPE_TO`        | Recipient email address | `contact@yoursite.com` |

## Setting Environment Variables

### Apache (.htaccess)

If you're using Apache, you can set environment variables in a `.htaccess` file:

```apache
SetEnv FORMPIPE_SMTP_HOST "smtp.gmail.com"
SetEnv FORMPIPE_SMTP_PORT "587"
SetEnv FORMPIPE_SMTP_USER "your-email@gmail.com"
SetEnv FORMPIPE_SMTP_PASS "your-app-password"
SetEnv FORMPIPE_FROM "noreply@yoursite.com"
SetEnv FORMPIPE_TO "contact@yoursite.com"
```

**Important:** Add `.htaccess` to your `.gitignore` to prevent committing credentials!

### Nginx

For Nginx, set environment variables in your server configuration:

```nginx
fastcgi_param FORMPIPE_SMTP_HOST "smtp.gmail.com";
fastcgi_param FORMPIPE_SMTP_PORT "587";
fastcgi_param FORMPIPE_SMTP_USER "your-email@gmail.com";
fastcgi_param FORMPIPE_SMTP_PASS "your-app-password";
fastcgi_param FORMPIPE_FROM "noreply@yoursite.com";
fastcgi_param FORMPIPE_TO "contact@yoursite.com";
```

### System Environment Variables

You can also set environment variables at the system level:

```bash
export FORMPIPE_SMTP_HOST="smtp.gmail.com"
export FORMPIPE_SMTP_PORT="587"
export FORMPIPE_SMTP_USER="your-email@gmail.com"
export FORMPIPE_SMTP_PASS="your-app-password"
export FORMPIPE_FROM="noreply@yoursite.com"
export FORMPIPE_TO="contact@yoursite.com"
```

### Docker

If using Docker, set environment variables in your `docker-compose.yml`:

```yaml
services:
  php:
    environment:
      - FORMPIPE_SMTP_HOST=smtp.gmail.com
      - FORMPIPE_SMTP_PORT=587
      - FORMPIPE_SMTP_USER=your-email@gmail.com
      - FORMPIPE_SMTP_PASS=your-app-password
      - FORMPIPE_FROM=noreply@yoursite.com
      - FORMPIPE_TO=contact@yoursite.com
```

## Development vs Production

### Development

For local development, you can:

- Use the default Mailpit configuration in `formpipe.config.json`
- Or use `npx formpipe serve` which sets up Mailpit automatically

### Production

For production:

1. Set environment variables on your server (using one of the methods above)
2. The PHP code will automatically use these variables
3. No need to modify `contact-form.php` or commit credentials

## Security Best Practices

1. **Never commit credentials** - The `.gitignore` file prevents committing `contact-form.php`
2. **Use environment variables in production** - Keep credentials out of code
3. **Use app-specific passwords** - For Gmail and similar services, use app passwords instead of your main password
4. **Restrict file permissions** - Ensure `.htaccess` and PHP files have appropriate permissions
5. **Use HTTPS** - Always use HTTPS in production to encrypt data in transit
6. **Use Redis for rate limiting** - In production, set up Redis for robust rate limiting across multiple servers

### Disabling Rate Limiting

If Redis is not available, rate limiting automatically falls back to PHP sessions. For no rate limiting at all, contact your hosting provider or set `rateLimit: 0` in your config (rate limiting will be disabled).
