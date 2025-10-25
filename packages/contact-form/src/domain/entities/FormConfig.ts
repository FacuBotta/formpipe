import { readFileSync } from 'fs';
import { Rules } from '../types';

interface SendConfirmation {
  message: string;
  htmlTemplate?: string;
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
  rules?: Rules;
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
