# Release `better-auth-cas` to npm

This repository supports both manual publishing and GitHub Actions publishing.

## Option A: GitHub Actions (Recommended)

Workflow file: `.github/workflows/publish.yml`

Trigger:

- Push tag `v*` (for example `v0.1.1`)
- Or run workflow manually via `workflow_dispatch`

### Publishing modes

- Preferred: npm Trusted Publishing (OIDC, no token)
- Fallback: `NPM_TOKEN` repository secret

The workflow automatically:

1. Installs dependencies for `packages/better-auth-cas`
2. Validates `tag version == package version`
3. Builds and tests
4. Publishes to npm

### Setup for Trusted Publishing

In npm package settings (`better-auth-cas`), add this repo/workflow as a trusted publisher:

- owner/repo: `Travins/better-auth-cas`
- workflow: `.github/workflows/publish.yml`

If Trusted Publishing is not configured, set repository secret `NPM_TOKEN` instead.

## Option B: Manual publish

### 1. Verify package quality

```bash
npm run plugin:verify
```

### 2. Update package version

```bash
npm version patch --prefix packages/better-auth-cas
```

### 3. Publish

```bash
npm publish --prefix packages/better-auth-cas --access public
```

### 4. Validate package

```bash
npm install better-auth-cas
```

## Tag-based release flow example

```bash
git add -A
git commit -m "release: v0.1.1"
git push
git tag v0.1.1
git push origin v0.1.1
```

After pushing the tag, GitHub Actions `publish` workflow publishes automatically.
