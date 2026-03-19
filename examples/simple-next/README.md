# Simple Next.js Example

This is the only example in this repository.

## Files

- `src/lib/auth.ts`: Better Auth + CAS plugin registration
- `src/app/api/auth/[...all]/route.ts`: Auth route handler

## Install

```bash
npm install better-auth better-auth-cas
```

## CAS Flow

1. Frontend calls `POST /api/auth/sign-in/cas`
2. User is redirected to CAS `/login`
3. CAS redirects back to `/api/auth/cas/callback`
4. Plugin validates ticket via `/serviceValidate`
5. Better Auth session is created
