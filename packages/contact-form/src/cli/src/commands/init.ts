import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { FormConfig } from 'src/domain/entities/FormConfig';

// Get project root directory (where the command is being run)
const projectRoot = process.cwd();
const configPath = join(projectRoot, 'formpipe.config.json');

const config: FormConfig = {
  smtp: {
    host: 'mailpit',
    port: 1025,
    user: '',
    pass: '',
  },
  baseURL: 'http://localhost:8080',
  from: 'no-reply@yoursite.com',
  to: 'contacto@yoursite.com',
  rules: {
    replyTo: { isEmail: true, required: true },
    subject: { minLength: 5, maxLength: 100 },
    message: { minLength: 10, maxLength: 500 },
  },
  sendConfirmation: {
    message: 'Thanks for contacting us! We will get back to you soon.',
    htmlTemplate:
      'Thanks for contacting us! We will get back to you soon.</h1>',
  },
  rateLimit: 10,
  phpPath: './php',
  debug: false,
};

export default function init() {
  try {
    if (!existsSync(configPath)) {
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log('✅ formpipe.config.json created in project root');
      console.log('📝 After editing the config, run: npx formpipe generate');
    } else {
      console.log('ℹ️ formpipe.config.json already exists in project root');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error creating config file:', error.message);
    } else {
      console.error('❌ An unknown error occurred');
    }
    throw error;
  }
}
