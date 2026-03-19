# Better Auth CAS Skill

## Goal

Integrate standard CAS SSO into an existing Better Auth app without replacing email/password login.

## Inputs

- A Better Auth server instance
- A CAS endpoint set (`/login`, `/serviceValidate`)
- Optional profile mapping paths

## Minimal Steps

1. Install package:

```bash
npm install better-auth-cas better-auth
```

2. Register CAS plugin in your Better Auth config.
3. Add Better Auth route handler (`/api/auth/[...all]`).
4. Add a login button that calls `POST /api/auth/sign-in/cas`.
5. Set explicit `redirectUri` to match CAS allowlist exactly (for example `http://localhost:3000/api/auth/cas/callback`).
6. Add global logout route (`/api/logout`) to clear local session and redirect to CAS `/logout`.

## Recommended Defaults

- `providerId`: `cas`
- `callbackPath`: `/cas/callback`
- `fallbackEmailDomain`: `noemail.local`
- `redirectUri`: `${BETTER_AUTH_URL}/api/auth/cas/callback`

## Runtime Behavior Notes

- Local sign-out only clears app session. CAS SSO session may still be active.
- If CAS session remains active, next login can appear automatic.
- For expected re-authentication UX, use global logout: local sign-out + CAS `/logout`.

## Profile Mapping Suggestion

- stable id: `id`, `attributes.accountId`, `attributes.userId`, `user`
- name: `attributes.userName`, `attributes.name`, `name`
- email: `attributes.email`, `email`

## Security Notes

- Never commit real CAS production URLs, cookies, or private credentials.
- Keep secrets in local `.env` or your secret manager.
- Do not expose raw CAS ticket validation payloads publicly in logs.
