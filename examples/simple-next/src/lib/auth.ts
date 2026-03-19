import { memoryAdapter, type MemoryDB } from '@better-auth/memory-adapter';
import { betterAuth } from 'better-auth';
import { createStandardCasPlugin } from 'better-auth-cas';

const DEFAULT_SECRET = 'dev-secret-dev-secret-dev-secret-dev-secret';
const DEFAULT_BASE_URL = 'http://localhost:3000';
const DEFAULT_CAS_BASE_URL = 'https://cas.example.com/cas';

type GlobalWithAuthMemory = typeof globalThis & {
  __betterAuthMemoryDb?: MemoryDB;
};

const globalWithAuthMemory = globalThis as GlobalWithAuthMemory;
const memoryDb = globalWithAuthMemory.__betterAuthMemoryDb ?? {};

for (const modelName of ['user', 'session', 'account', 'verification']) {
  if (!Array.isArray(memoryDb[modelName])) {
    memoryDb[modelName] = [];
  }
}

if (!globalWithAuthMemory.__betterAuthMemoryDb) {
  globalWithAuthMemory.__betterAuthMemoryDb = memoryDb;
}

const baseUrl = process.env.BETTER_AUTH_URL || DEFAULT_BASE_URL;
const casBaseUrl = process.env.CAS_BASE_URL || DEFAULT_CAS_BASE_URL;
const casRedirectUri =
  process.env.CAS_REDIRECT_URI || `${baseUrl}/api/auth/cas/callback`;

export const auth = betterAuth({
  appName: 'better-auth-cas-example',
  baseURL: baseUrl,
  secret: process.env.BETTER_AUTH_SECRET || DEFAULT_SECRET,
  database: memoryAdapter(memoryDb),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    createStandardCasPlugin({
      casBaseUrl,
      redirectUri: casRedirectUri,
      callbackPath: '/cas/callback',
      providerId: 'cas',
      profileMapping: {
        stableIdPaths: ['id', 'attributes.accountId', 'attributes.userId', 'user'],
        namePaths: ['attributes.userName', 'attributes.name', 'name'],
        emailPaths: ['attributes.email', 'email'],
      },
    }),
  ],
});
