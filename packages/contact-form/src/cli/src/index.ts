#!/usr/bin/env node

import generate from './commands/generate';
import init from './commands/init';

const args = process.argv.slice(2);

try {
  if (args[0] === 'init') {
    init();
  } else if (args[0] === 'generate') {
    generate();
  } else {
    console.log('Usage:');
    console.log('❯ npx formpipe init     # Create formpipe.config.json');
    console.log(
      '❯ npx formpipe generate # Generate a new php folder - fields will be replaced if they already exist'
    );
  }
} catch (error) {
  if (error instanceof Error) {
    console.error('❌ Error:', error.message);
  } else {
    console.error('❌ An unknown error occurred');
  }
  process.exit(1);
}
