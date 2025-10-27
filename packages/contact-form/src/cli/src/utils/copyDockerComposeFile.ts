// copy Dockerfile to the same path where PHP files are generated
import { promises as fs } from 'fs';
import path from 'path';

export const copyDockerComposeFile = async (phpFilePath: string) => {
  const sourceDockerComposeFile = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'php',
    'docker-compose.yml'
  );

  // Determine the destination directory based on the phpFilePath
  const destinationDir = path.dirname(phpFilePath);
  const destinationDockerComposeFile = path.join(
    destinationDir,
    'docker-compose.yml'
  );

  try {
    await fs.copyFile(sourceDockerComposeFile, destinationDockerComposeFile);
    console.log(
      `Docker Compose file copied to ${destinationDockerComposeFile}`
    );
  } catch (error) {
    console.error('Error copying Docker Compose file:', error);
    throw error;
  }
};
