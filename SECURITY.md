# Security Policy

## Supported Versions

Security fixes are applied to the latest code on `main`.

## Reporting a Vulnerability

Please do not open a public issue for security vulnerabilities.

Use one of the following:

1. GitHub Security Advisory (preferred):
   https://github.com/Travins/better-auth-cas/security/advisories/new
2. If advisory reporting is unavailable, open an issue with minimal details and request private follow-up.

## What to Include

- affected version/commit
- clear reproduction steps
- impact assessment
- suggested remediation (if available)

## Response Targets

- Initial triage: within 72 hours
- Status update: within 7 days

## Secret Hygiene

- Never commit real CAS production URLs, credentials, tickets, or session artifacts.
- Keep sensitive config in `.env` or a secret manager.
- Sanitize logs and screenshots before sharing.
