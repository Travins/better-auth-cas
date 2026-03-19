# Release Checklist (v0.1.0)

## 1. Verify quality

```bash
npm run plugin:verify
```

## 2. Confirm package metadata

```bash
cat packages/better-auth-cas/package.json
```

Check:

- `name` is `better-auth-cas`
- `version` is `0.1.0`
- `license` is `MIT`
- `publishConfig.access` is `public`

## 3. Dry-run package contents

```bash
npm pack --prefix packages/better-auth-cas --dry-run
```

## 4. Publish

```bash
npm publish --prefix packages/better-auth-cas --access public
```

## 5. Post-release

- Create Git tag `v0.1.0`
- Create GitHub release notes from `CHANGELOG.md`
- Verify install in clean project:

```bash
npm install better-auth-cas
```
