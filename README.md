# better-auth-cas

[![CI](https://github.com/Travins/better-auth-cas/actions/workflows/ci.yml/badge.svg)](https://github.com/Travins/better-auth-cas/actions/workflows/ci.yml)

A clean open-source repo for building and shipping a standard CAS integration for Better Auth.

## What This Repo Contains

- `packages/better-auth-cas`: the plugin package source (publishable to npm)
- `examples/simple-next`: one minimal Next.js App Router example
- `SKILL.md`: integration playbook for dropping CAS into existing Better Auth apps

## Quick Start (Repository)

```bash
npm run plugin:verify
```

This runs install + build + tests for the plugin package.

## Plugin Quick Start (Application)

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

Then expose Better Auth with your route handler and call:

- `POST /api/auth/sign-in/cas`
- `GET /api/auth/cas/callback`

## CAS Flow

1. Frontend triggers `POST /api/auth/sign-in/cas`.
2. Plugin redirects user to CAS `/login?service=...`.
3. CAS returns `ticket` to callback endpoint.
4. Plugin validates ticket via CAS `/serviceValidate`.
5. Better Auth creates or links account and issues session.

## Integration Notes From Real Testing

- Local sign-out alone is not enough for CAS deployments. Use a global logout route (`/api/logout`) to clear local session and redirect to CAS `/logout`.
- Many CAS servers strictly validate callback allowlists. Set `redirectUri` explicitly (for example `http://localhost:3000/api/auth/cas/callback`) to avoid service URL mismatch.
- For a runnable reference, see `examples/simple-next` including:
  - `src/app/api/me/route.ts`
  - `src/app/api/logout/route.ts`

## Security Notes

- No real production CAS URL, keys, or DB credentials are stored in this repository.
- `.env` is ignored; only `.env.example` placeholders are tracked.
- Security reporting process: [SECURITY.md](SECURITY.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, workflow, and PR checklist.

## Roadmap

- Publish `better-auth-cas` to npm.
- Add typed examples for dynamic profile mapping strategies.
- Add integration tests against a CAS-compatible mock server.

## Release Guide

See [docs/release-plugin.md](docs/release-plugin.md).

## Automated Publishing

This repo includes `.github/workflows/publish.yml`.
When you push a tag like `v0.1.1`, GitHub Actions will validate, test, and publish `better-auth-cas` to npm.

## Project Governance

- Contribution guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Security policy: [SECURITY.md](SECURITY.md)
- Changelog: [CHANGELOG.md](CHANGELOG.md)
