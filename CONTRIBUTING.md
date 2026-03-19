# Contributing

Thanks for contributing to `better-auth-cas`.

## Scope

This repository has three primary parts:

- `packages/better-auth-cas`: plugin source code
- `examples/simple-next`: minimal integration example
- `SKILL.md`: integration playbook for existing projects

## Local Setup

1. Install dependencies for the plugin package:

```bash
npm run plugin:install
```

2. Run full verification:

```bash
npm run plugin:verify
```

## Development Workflow

1. Create a branch from `main`.
2. Make focused changes (one concern per PR).
3. Keep public examples free of real credentials/URLs.
4. Ensure tests pass before opening PR.

## Pull Request Checklist

- Code compiles and tests pass.
- README/docs updated if behavior or APIs changed.
- No secrets, cookies, tickets, or private endpoints are committed.
- Changes remain backward-compatible unless clearly documented.

## Commit Messages

Use clear, scoped commit messages. Example:

- `feat(plugin): add custom validateUrl option`
- `fix(plugin): handle missing CAS user element`
- `docs: clarify callback route integration`

## Reporting Bugs

Please open a GitHub issue with:

- environment details (Node version, Better Auth version)
- reproduction steps
- expected vs actual behavior
- minimal code snippet (sanitized)
