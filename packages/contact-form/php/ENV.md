# Environment Variables for Production

This file explains how to use environment variables to securely manage SMTP credentials in production.

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

### Rate Limiting (Redis)

For production deployments, rate limiting uses Redis (if available). The following variables configure the Redis connection:

| Variable     | Description       | Default | Example     |
| ------------ | ----------------- | ------- | ----------- |
| `REDIS_HOST` | Redis server host | `redis` | `localhost` |
| `REDIS_PORT` | Redis server port | `6379`  | `6379`      |

If Redis is not available, rate limiting falls back to PHP sessions (less reliable in distributed setups).

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

## Production Setup with Redis

### Docker Compose Example

If you're using Docker in production, the `docker-compose.yml` includes Redis:

```yaml
services:
  php:
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
```

### Traditional Server Setup

If you're not using Docker, install Redis on your server:

**Ubuntu/Debian:**

```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**CentOS:**

```bash
sudo yum install redis
sudo systemctl start redis
```

Then set environment variables in `.htaccess`:

```apache
SetEnv REDIS_HOST "localhost"
SetEnv REDIS_PORT "6379"
```

## Testing

To test that environment variables are working:

1. Set the environment variables on your server
2. Submit a test form
3. Check that emails are sent using the production SMTP settings
4. Verify the email is received at the `FORMPIPE_TO` address
5. Test rate limiting by submitting multiple forms quickly (should get 429 error after limit)

## Troubleshooting

### Variables Not Being Read

- Verify environment variables are set correctly
- Check that your web server (Apache/Nginx) is configured to pass environment variables to PHP
- Use `phpinfo()` to verify environment variables are available to PHP
- Check PHP error logs for any issues

### Still Using Config Values

- Ensure environment variable names are exactly as listed (case-sensitive)
- Verify the variables are set before PHP executes
- Check that `getenv()` is not disabled in your PHP configuration

## Redis Configuration in Production

### Option 1: Managed Redis Service

Use a managed Redis service (AWS ElastiCache, Google Cloud Memorystore, etc.):

1. Create a Redis instance in your cloud provider
2. Get the hostname and port
3. Set environment variables:
   ```apache
   SetEnv REDIS_HOST "your-redis-instance.example.com"
   SetEnv REDIS_PORT "6379"
   ```

### Option 2: Self-Hosted Redis

Install and run Redis on your server:

**Ubuntu/Debian:**

```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

Then set environment variables:

```apache
SetEnv REDIS_HOST "localhost"
SetEnv REDIS_PORT "6379"
```

### Option 3: Docker Production

If using Docker in production:

```yaml
services:
  php:
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
```

### Disabling Rate Limiting

If Redis is not available, rate limiting automatically falls back to PHP sessions. For no rate limiting at all, contact your hosting provider or set `rateLimit: 0` in your config (rate limiting will be disabled).
