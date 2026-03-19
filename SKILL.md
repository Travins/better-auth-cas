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
5. Ensure callback path matches plugin config.

## Recommended Defaults

- `providerId`: `cas`
- `callbackPath`: `/cas/callback`
- `fallbackEmailDomain`: `noemail.local`

## Profile Mapping Suggestion

- stable id: `id`, `attributes.accountId`, `attributes.userId`, `user`
- name: `attributes.userName`, `attributes.name`, `name`
- email: `attributes.email`, `email`

## Security Notes

- Never commit real CAS production URLs, cookies, or private credentials.
- Keep secrets in local `.env` or your secret manager.
- Do not expose raw CAS ticket validation payloads publicly in logs.
