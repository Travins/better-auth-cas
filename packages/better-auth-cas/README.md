# better-auth-cas

Standard CAS plugin for Better Auth.

## Features

- `POST /api/auth/sign-in/cas`
- `GET /api/auth/cas/callback`
- CAS `serviceValidate` ticket verification
- profile mapping + Better Auth user/session creation
- hook for custom persistence (`onProfileResolved`)

## Install

```bash
npm install better-auth-cas better-auth
```

## Usage

```ts
import { betterAuth } from 'better-auth';
import { createStandardCasPlugin } from 'better-auth-cas';

export const auth = betterAuth({
  plugins: [
    createStandardCasPlugin({
      casBaseUrl: 'https://cas.example.com/cas',
      callbackPath: '/cas/callback',
      providerId: 'cas',
    }),
  ],
});
```

## Endpoints

- `POST /api/auth/sign-in/cas`
- `GET /api/auth/cas/callback`

## Development

```bash
npm run build
npm run test
```
