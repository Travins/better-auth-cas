# Better Auth CAS Skill

一个最小化的开源仓库，目标只有两件事：

- 提供可发布的 `better-auth-cas` 插件（NPM 包形态）
- 提供一个可复制的 CAS 集成 Skill 说明（`SKILL.md`）

## 仓库内容

- `packages/better-auth-cas`: 标准 CAS 插件源码
- `examples/simple-next`: 单一最小示例（Next.js App Router）
- `SKILL.md`: 集成步骤与落地约束

## 安全说明

- 仓库不包含真实 CAS 生产地址、真实密钥或数据库凭据。
- `.env` 已忽略，仅保留 `.env.example` 占位符。

## 本地验证

```bash
npm run plugin:install
npm run plugin:build
npm run plugin:test
```

或一键：

```bash
npm run plugin:verify
```

## 插件快速使用

```ts
import { betterAuth } from 'better-auth';
import { createStandardCasPlugin } from 'better-auth-cas';

export const auth = betterAuth({
  emailAndPassword: { enabled: true },
  plugins: [
    createStandardCasPlugin({
      casBaseUrl: 'https://cas.example.com/cas',
      callbackPath: '/cas/callback',
      providerId: 'cas',
    }),
  ],
});
```

## 发布到 npm

见 [docs/release-plugin.md](docs/release-plugin.md)。
