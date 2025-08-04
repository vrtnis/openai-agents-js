import { describe, test, beforeAll, expect } from 'vitest';
import { execa as execaBase } from 'execa';

const execa = execaBase({ cwd: './integration-tests/esm-import' });

describe('ESM import', () => {
  beforeAll(async () => {
    // Remove existing modules to ensure a clean install.
    console.log('[esm-import] Removing node_modules');
    await execa`rm -rf node_modules`;
    console.log('[esm-import] Installing dependencies');
    await execa`npm install`;
  }, 60000);

  test('should import @openai/agents under Node 22', async () => {
    const { exitCode } =
      await execa`npx --yes node@22 -e "import('@openai/agents');"`;
    expect(exitCode).toBe(0);
  });
});
