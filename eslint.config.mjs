import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

export default tseslint.config(
  // Ignore build outputs and large example folders
  globalIgnores([
    '**/dist/**',
    '**/dist-cjs/**',
    '**/node_modules/**',
    '**/docs/.astro/**',
    'examples/realtime-next/**',
    'examples/realtime-demo/**',
    'examples/nextjs/**',
    'examples/tools/**',
    'integration-tests/**',
    // Docs code snippets: not intended to pass lint as runtime code
    'examples/docs/**',
    'packages/**/test/**/*.cjs',
    'packages/**/test/**/*.cjs.map',
  ]),

  // Base + TS + Prettier
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettierConfig,

  // Repo-wide TS rules
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Allow CommonJS in .cjs files (configs, tests, scripts, CJS entrypoints)
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'script', // treat as CommonJS
      ecmaVersion: 'latest',
      globals: {
        // Node/CJS
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setImmediate: 'readonly',
        structuredClone: 'readonly',
        URL: 'readonly',
        AbortController: 'readonly',
        // Some runtimes/polyfills supply these even in CJS contexts
        Response: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      // Helpful if these plugins are present:
      'import/no-commonjs': 'off',
      'n/no-missing-require': 'off',
      'n/no-unsupported-features/es-syntax': 'off',
      'unicorn/prefer-module': 'off',
      // Some CJS files intentionally use expression statements
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },

  // Tests override: Node + web-like globals used/mocked in CJS tests
  {
    files: ['**/test/**/*.cjs'],
    languageOptions: {
      sourceType: 'script',
      ecmaVersion: 'latest',
      globals: {
        // Node-ish
        global: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setImmediate: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        AbortController: 'readonly',

        // Web APIs commonly mocked/polyfilled in tests
        Event: 'readonly',
        EventTarget: 'readonly',
        MessageEvent: 'readonly',
        TextEncoder: 'readonly',
        FormData: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        document: 'readonly',
        window: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        Response: 'readonly',
        RTCPeerConnection: 'readonly',

        // Vitest-style test globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Source CJS that target browser-like environments (e.g., realtime WebRTC)
  {
    files: ['**/src/**/*.cjs'],
    languageOptions: {
      sourceType: 'script',
      ecmaVersion: 'latest',
      globals: {
        // Node
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setImmediate: 'readonly',
        Buffer: 'readonly',
        structuredClone: 'readonly',
        URL: 'readonly',
        AbortController: 'readonly',
        // Web
        Event: 'readonly',
        EventTarget: 'readonly',
        MessageEvent: 'readonly',
        TextEncoder: 'readonly',
        FormData: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        document: 'readonly',
        window: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        RTCPeerConnection: 'readonly',
        CustomEvent: 'readonly',
        crypto: 'readonly',
        Response: 'readonly',
      },
    },
  },

  // Shims often intentionally shadow/process globals; relax specific rules there
  {
    files: [
      '**/src/shims/**/*.cjs',
      '**/src/shims/**/*.js',
      '**/src/shims/**/*.ts',
      'docs/src/scripts/**/*.cjs', // docs script: allow redefining __filename/__dirname
    ],
    rules: {
      'no-redeclare': 'off',
    },
  },

  // Lambda test folder uses CommonJS
  {
    files: ['lambda-test/**'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Declaration files: don't flag private class members as unused in .d.ts
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-unused-private-class-members': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
);
