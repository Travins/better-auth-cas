import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
  external: [
    'better-auth',
    '@better-auth/core/api',
    '@better-auth/core/error',
    'better-auth/cookies',
    'better-auth/oauth2',
    'zod',
  ],
});
