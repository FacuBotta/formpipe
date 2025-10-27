import { promises as fs } from 'fs';

export async function copyPhpFolder(
  sourcePhpFolder: string,
  destinationPhpFolder: string
) {
  try {
    await fs.cp(sourcePhpFolder, destinationPhpFolder, { recursive: true });
  } catch (error) {
    throw new Error(
      `Failed to copy PHP folder from ${sourcePhpFolder} to ${destinationPhpFolder}: ${
        (error as Error).message
      }`
    );
  }
}
