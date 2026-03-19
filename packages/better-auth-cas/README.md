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

## Real-World Integration Notes

### 1. Why users may "auto-login" after local logout

CAS keeps its own SSO session cookie.  
If you only call Better Auth `sign-out`, you clear local session but CAS session may still be valid.

Result: user clicks login again and CAS can immediately redirect back with a new ticket.

### 2. Recommended global logout (local + CAS)

Use a dedicated route (for example `GET /api/logout`) that:

1. Clears local Better Auth session
2. Redirects user to CAS `/logout` with `service` back to your app

```ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

function buildCasLogoutUrl(origin: string) {
  const casBaseUrl = process.env.CAS_BASE_URL || 'https://cas.example.com/cas';
  const logoutUrl = new URL(`${casBaseUrl}/logout`);
  logoutUrl.searchParams.set(
    'service',
    process.env.CAS_LOGOUT_SERVICE_URL || `${origin}/`
  );
  return logoutUrl.toString();
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const response = NextResponse.redirect(buildCasLogoutUrl(origin), 302);

  const signOutResponse = await (auth.api as any).signOut({
    headers: request.headers,
    body: {},
    asResponse: true,
  });

  if (signOutResponse instanceof Response) {
    const headersWithGetSetCookie = signOutResponse.headers as Headers & {
      getSetCookie?: () => string[];
    };
    const setCookies = headersWithGetSetCookie.getSetCookie?.() || [];
    for (const cookieValue of setCookies) {
      response.headers.append('set-cookie', cookieValue);
    }
  }

  return response;
}
```

### 3. Callback URL allowlist mismatch

In many CAS deployments, the `service` URL must be explicitly allowlisted.

Set `redirectUri` to your final callback URL so generated login URLs match CAS allowlist exactly:

```ts
createStandardCasPlugin({
  casBaseUrl: 'https://cas.example.com/cas',
  redirectUri: 'http://localhost:3000/api/auth/cas/callback',
  callbackPath: '/cas/callback',
});
```

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
