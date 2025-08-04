import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    // Run this as a Node lib, not a browser bundle
    target: 'node16',
    platform: 'node',

    lib: {
      entry: resolve(__dirname, 'dist/index.mjs'),
      name: 'OpenAIAgentsRealtime',
      fileName: 'openai-realtime-agents',
      // only emit ESM (remove 'umd' which is the default 3rd format)
      formats: ['es'],
    },

    sourcemap: 'inline',

    rollupOptions: {
      // Externalize all Node built-ins & optional SDK
      external: (id) => {
        if (id.startsWith('node:')) return true;
        const builtins = [
          'fs', 'path', 'events', 'stream', 'stream/web',
          'async_hooks', 'timers', 'crypto', 'child_process',
        ];
        if (builtins.includes(id)) return true;
        if (id === '@modelcontextprotocol/sdk' || id === 'cross-spawn') return true;
        return false;
      },

      output: {
        dir: 'dist/bundle',
        banner: '/** OpenAI Agents Realtime **/',
        minifyInternalExports: false,
        // no need for UMD globals now since we’re not building UMD
        globals: {},
      },
    },
  },
});