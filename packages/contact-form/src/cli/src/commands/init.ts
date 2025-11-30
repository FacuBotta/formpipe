import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { FormMainConfig } from 'src/domain/types';

// Get project root directory (where the command is being run)
const projectRoot = process.cwd();
const configPath = join(projectRoot, 'formpipe.config.json');

const config: FormMainConfig = {
  smtp: {
    host: 'mailpit',
    port: 1025,
    user: '',
    pass: '',
  },
  endPointPath: 'http://localhost:8080/php/contact-form.php',
  from: 'no-reply@yoursite.com',
  to: 'contacto@yoursite.com',
  rules: {
    replyTo: { isEmail: true, required: true, maxLength: 100, minLength: 5 },
    subject: { minLength: 5, maxLength: 100, required: true },
    name: { minLength: 3, maxLength: 20, required: false },
    phoneNumber: { phoneValidationMode: 'e164', required: false },
    message: { minLength: 10, maxLength: 500, required: true },
  },
  useLocalPhpMailer: true,
  rateLimit: 1,
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
