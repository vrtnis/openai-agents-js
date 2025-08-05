import { describe, test, expect, beforeAll } from 'vitest';
import { execa as execaBase } from 'execa';

const execa = execaBase({ cwd: './integration-tests/lambda-local' });

describe('lambda-local', () => {
  beforeAll(async () => {
    // Remove existing modules to ensure a clean install.
    console.log('[lambda-local] Removing node_modules');
    await execa`rm -rf node_modules`;
    console.log('[lambda-local] Installing dependencies');
    await execa`npm install`;
  }, 60000);

  test('should return a 200 response', async () => {
    const { stdout } =
      await execa`npx --yes lambda-local -l index.cjs -h handler -e event.json`;
    expect(stdout).toContain('"statusCode": 200');
  });
});
