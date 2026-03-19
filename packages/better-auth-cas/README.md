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
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    createStandardCasPlugin({
      casBaseUrl: 'https://cas.example.com/cas',
      callbackPath: '/cas/callback',
      providerId: 'cas',
    }),
  ],
});
```

## Options

| Option | Required | Description |
| --- | --- | --- |
| `casBaseUrl` | yes | CAS base URL, e.g. `https://cas.example.com/cas` |
| `validateUrl` | no | Override validate URL, default `${casBaseUrl}/serviceValidate` |
| `redirectUri` | no | Absolute callback base URL override |
| `callbackPath` | no | Callback endpoint path, default `/cas/callback` |
| `providerId` | no | Better Auth provider ID, default `cas` |
| `pluginId` | no | Better Auth plugin ID, default `cas-standard-auth` |
| `profileMapping` | no | Mapping paths for stable id/name/email/image |
| `fallbackName` | no | Used when CAS profile has no mapped name |
| `fallbackEmailDomain` | no | Used to generate fallback email |
| `onProfileResolved` | no | Hook for persisting normalized and raw CAS profile |

## Endpoints

- `POST /api/auth/sign-in/cas`
- `GET /api/auth/cas/callback`

## Profile Mapping

Default mapping paths:

- stable id: `id`, `attributes.accountId`, `attributes.userId`, `user`
- name: `attributes.userName`, `attributes.name`, `name`
- email: `attributes.email`, `email`
- image: `attributes.avatar`, `avatar`, `image`

## Development

```bash
npm run build
npm run test
```
