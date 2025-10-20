import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { FormConfig, loadConfig } from '../../../domain/entities/FormConfig';
import { generatePhpFromConfig } from '../utils/generatePhpFromConfig';

export default function generate() {
  const projectRoot = process.cwd();
  const phpPath = resolve(projectRoot, 'contact-form.php');
  const config: FormConfig = loadConfig();
  const phpCode = generatePhpFromConfig(config);

  const fullPhp = `<?php
require 'vendor/autoload.php';
use PHPMailer\\PHPMailer\\PHPMailer;
use PHPMailer\\PHPMailer\\Exception;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['error' => 'Method not allowed']));
}

${phpCode}
?>`;

  try {
    writeFileSync(phpPath, fullPhp);
    console.log('✅ contact-form.php created successfully!');
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error generating PHP file:', error.message);
    } else {
      console.error('❌ An unknown error occurred');
    }
    throw error;
  }
}
