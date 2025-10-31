import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { FormMainConfig } from 'src/domain/types';

function findTemplatePath(): string {
  const searchPaths = [
    resolve(__dirname, '../php/contact-form.php'), // dist
    resolve(__dirname, '../../../../../php/contact-form.php'), // src
    resolve(__dirname, '../../php/contact-form.php'), // fallback
  ];

  for (const path of searchPaths) {
    if (existsSync(path)) return path;
  }

  throw new Error(`Template not found. Tried:\n${searchPaths.join('\n')}`);
}

function jsonToPhpArray(value: unknown, indent = 0): string {
  const i = '  '.repeat(indent);
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string')
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (Array.isArray(value))
    return `[\n${value
      .map((v) => i + '  ' + jsonToPhpArray(v, indent + 1))
      .join(',\n')}\n${i}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return `[\n${entries
      .map(([k, v]) => `${i}  '${k}' => ${jsonToPhpArray(v, indent + 1)}`)
      .join(',\n')}\n${i}]`;
  }
  return 'null';
}

export function generatePhpFromConfig(
  config: FormMainConfig,
  phpMainFile: string
): void {
  const templatePath = findTemplatePath();
  const template = readFileSync(templatePath, 'utf8');

  const phpConfig = `$config = ${jsonToPhpArray(config)};`;
  const finalContent = template.replace('$config = null;', phpConfig);

  writeFileSync(phpMainFile, finalContent, 'utf8');
}
