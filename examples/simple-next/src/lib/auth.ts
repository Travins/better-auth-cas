import { betterAuth } from 'better-auth';
import { createStandardCasPlugin } from 'better-auth-cas';

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    createStandardCasPlugin({
      casBaseUrl: process.env.CAS_BASE_URL || 'https://cas.example.com/cas',
      callbackPath: process.env.CAS_CALLBACK_PATH || '/cas/callback',
      providerId: 'cas',
      profileMapping: {
        stableIdPaths: ['id', 'attributes.accountId', 'attributes.userId', 'user'],
        namePaths: ['attributes.userName', 'attributes.name', 'name'],
        emailPaths: ['attributes.email', 'email'],
      },
    }),
  ],
});
