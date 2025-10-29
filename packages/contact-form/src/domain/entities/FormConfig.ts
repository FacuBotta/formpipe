import { ValidatorConstraints } from '../types';

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
  endPointPath: string;
  from: string;
  to: string;
  rules?: ValidatorConstraints;
  sendConfirmation: SendConfirmation | false;
  rateLimit?: number;
  debug: boolean;
}

export async function loadConfig(): Promise<FormConfig> {
  const res = await fetch('/php/formpipe.php');
  const json = await res.json();
  if (!json.success) throw new Error('Could not load config');
  return json.data;
}
