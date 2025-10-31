import { readFileSync } from 'fs';
import { FormMainConfig } from 'src/domain/types';

export const loadConfig = (): FormMainConfig => {
  try {
    return JSON.parse(readFileSync('formpipe.config.json', 'utf8'));
  } catch {
    throw new Error('❌ Configuration file not found. Run: npx formpipe init');
  }
};
