import { exec } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function serve() {
  const projectRoot = process.cwd();
  const phpFolder = join(projectRoot, 'php');
  const dockerComposePath = join(phpFolder, 'docker-compose.yml');

  try {
    // Check if php folder exists
    if (!existsSync(phpFolder)) {
      console.error('❌ PHP folder not found.');
      console.log(
        '💡 Run "npx formpipe generate" first to create the PHP backend.'
      );
      process.exit(1);
    }

    // Check if docker-compose.yml exists
    if (!existsSync(dockerComposePath)) {
      console.error('❌ docker-compose.yml not found in php folder.');
      console.log(
        '💡 Run "npx formpipe generate" to create the docker-compose.yml file.'
      );
      process.exit(1);
    }

    console.log('🚀 Starting Docker containers...\n');

    // Execute docker compose up -d in the php folder
    const { stdout, stderr } = await execAsync('docker compose up -d', {
      cwd: phpFolder,
    });

    // Docker compose may write to stderr for informational messages
    // Filter out common informational messages
    const isInformationalStderr =
      stderr &&
      (stderr.includes('Creating') ||
        stderr.includes('Starting') ||
        stderr.includes('Started') ||
        stderr.includes('Container') ||
        stderr.includes('network') ||
        stderr.includes('volume'));

    if (stderr && !isInformationalStderr) {
      console.warn('⚠️', stderr);
    }

    if (stdout) {
      console.log(stdout);
    }

    // Check if containers are already running
    const isAlreadyRunning =
      stdout.includes('is up-to-date') ||
      stderr?.includes('is up-to-date') ||
      stdout.includes('already running');

    if (isAlreadyRunning) {
      console.log('\n✅ Docker containers are already running!');
    } else {
      console.log('\n✅ Docker containers started successfully!');
    }
    console.log('\n📧 Mailpit is available at:');
    console.log('   http://localhost:8025');
    console.log('\n🌐 PHP endpoint is available at:');
    console.log('   http://localhost:8080/php/contact-form.php');
    console.log('\n💡 To stop the containers, run:');
    console.log('   cd php && docker compose down');
  } catch (error) {
    if (error instanceof Error) {
      // Check if docker is not installed or not running
      if (
        error.message.includes('docker') ||
        error.message.includes('Cannot connect')
      ) {
        console.error('❌ Docker is not running or not installed.');
        console.log('💡 Please make sure Docker is installed and running.');
      } else {
        console.error('❌ Error starting Docker containers:', error.message);
      }
    } else {
      console.error('❌ An unknown error occurred');
    }
    process.exit(1);
  }
}
