# Release `better-auth-cas` to npm

## Prerequisites

- npm account with publish permission
- `npm login` completed on local machine

## Steps

1. Verify package quality

```bash
npm run plugin:install
npm run plugin:verify
```

2. Update version

```bash
npm version patch --prefix packages/better-auth-cas
```

3. Publish

```bash
npm publish --prefix packages/better-auth-cas --access public
```

4. Validate package on npm

- Check package page and install command
- Smoke test in a fresh project:

```bash
npm install better-auth-cas
```
