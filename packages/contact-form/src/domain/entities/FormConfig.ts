import { readFileSync } from 'fs';

interface SendConfirmation {
  message: string;
  htmlTemplate?: string;
}
interface FormRules {
  minLength: number;
  maxLength: number;
  required?: boolean;
}
export interface FormConfig {
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  baseURL: string;
  from: string;
  to: string;
  rules: {
    subject: FormRules;
    message: FormRules;
  };
  persistData: boolean;
  sendConfirmation: SendConfirmation | false;
  rateLimit?: number;
}

export const loadConfig = (): FormConfig => {
  try {
    return JSON.parse(readFileSync('formpipe.config.json', 'utf8'));
  } catch {
    throw new Error('❌ Configuration file not found. Run: npx formpipe init');
  }
};
