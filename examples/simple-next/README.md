# Simple Next.js Example

This example shows the minimum practical wiring for `better-auth-cas` in a Next.js App Router project.

## Install

```bash
npm install better-auth better-auth-cas @better-auth/memory-adapter
```

## Environment

Copy `.env.example` and adjust values for your CAS server:

```bash
cp examples/simple-next/.env.example .env.local
```

## Included Files

- `src/lib/auth.ts`
  Better Auth configuration with:
  - in-memory adapter (for local verification only)
  - explicit CAS `redirectUri`
  - standard CAS plugin registration
- `src/app/api/auth/[...all]/route.ts`
  Better Auth route handler
- `src/app/api/auth/methods/route.ts`
  Small capability endpoint (`emailPassword`, `ssoCas`)
- `src/app/api/me/route.ts`
  Session inspection endpoint for manual verification
- `src/app/api/logout/route.ts`
  Global logout route: local sign-out + CAS logout redirect

## Test Sequence

1. Call `POST /api/auth/sign-in/cas`
2. Complete CAS login
3. Verify session at `GET /api/me`
4. Call `GET /api/logout`
5. Confirm next login requires CAS authentication again

## Important Behavior Notes

### CAS session is independent from local app session

If you only call local sign-out (`/api/auth/sign-out`), CAS may still have an active SSO session.
That can make the next login appear "automatic".

### Use global logout in CAS deployments

Use `/api/logout` in this example to clear local session and redirect to CAS `/logout`.
This is the recommended default for production CAS integrations.
