# 配置渲染层 Tailwind v4 与 HeroUI

这份 ExecPlan 是一份动态文档。随着工作的进行，`Progress`、`Surprises & Discoveries`、`Decision Log` 和 `Outcomes & Retrospective` 章节必须保持更新。

本文档遵循 `.agents/PLANS.md` 的要求编写与维护。

## Purpose / Big Picture (目的/大图景)

完成后，渲染层将启用 Tailwind CSS v4 与 HeroUI 组件体系。用户可以在运行渲染层时看到 HeroUI 组件的样式与交互生效，并以此作为后续 UI 开发的基础。

## Progress (进度)

- [x] (2026-01-12 08:15Z) 盘点渲染层现状与依赖，确认需要新增的配置文件与入口改动。
- [x] (2026-01-12 08:25Z) 安装 Tailwind v4 与 HeroUI 相关依赖（分为 dev 依赖与运行时依赖）。
- [x] (2026-01-12 08:30Z) 新增 HeroUI Tailwind 插件入口文件并更新全局 CSS。
- [x] (2026-01-12 08:32Z) 更新 Vite 与 PostCSS 配置以启用 Tailwind v4。
- [x] (2026-01-12 08:35Z) 在渲染层入口挂载 HeroUIProvider 并替换示例 UI。
- [x] (2026-01-12 08:40Z) 验证本地开发构建与 UI 渲染效果（Vite dev server 正常启动）。

## Surprises & Discoveries (惊喜与发现)

- 观察：HeroUI 的 Tailwind v4 方案基于 CSS-first 模式，需要在主 CSS 中使用 `@plugin`、`@source` 与 `@custom-variant`。
  证据：HeroUI 官方文档的 Tailwind v4 与安装说明。
- 观察：本地 5173 端口被占用，Vite 自动切换至 5174。
  证据：运行 `npm run dev --workspace @app/renderer` 的控制台输出。

## Decision Log (决策日志)

- 决策：采用手动安装而非 HeroUI CLI。
  理由：当前项目已存在渲染层，手动安装改动范围更小且可控，避免全局工具引入。
  日期/作者：2026-01-12 / Codex
- 决策：将 `hero.ts` 放置在 `packages/renderer/hero.ts`，并在 `packages/renderer/src/index.css` 中使用相对路径引用。
  理由：保持配置文件与渲染层包同级，路径清晰且便于后续维护。
  日期/作者：2026-01-12 / Codex

## Outcomes & Retrospective (结果与回顾)

- 结果：渲染层已启用 Tailwind v4 与 HeroUI，Vite dev server 可启动并提供本地访问地址。
- 差距：尚未在浏览器确认组件渲染效果（需人工打开本地地址）。
- 教训：在自动化验证时需要注意端口冲突，必要时使用 `--host` 或指定端口参数。

## Context and Orientation (背景与导向)

本仓库是 npm workspaces 的 Electron + Vite 项目。渲染层位于 `packages/renderer/`，入口为 `packages/renderer/src/main.tsx`，样式入口为 `packages/renderer/src/index.css`，Vite 配置为 `packages/renderer/vite.config.ts`。当前未配置 Tailwind 或 HeroUI。

本次变更只涉及渲染层，不触碰主进程与 preload。新增依赖使用 npm workspace 方式安装到 `@app/renderer`。

## Plan of Work (工作计划)

先安装 Tailwind v4 与 HeroUI 依赖，避免配置文件引用不存在的包。随后新增 `packages/renderer/hero.ts` 并替换 `packages/renderer/src/index.css` 为 Tailwind v4 的 CSS-first 配置，包含 HeroUI 的 `@plugin` 与 `@source`。接着补充 `packages/renderer/postcss.config.js` 并更新 `packages/renderer/vite.config.ts` 引入 `@tailwindcss/vite` 插件。最后在 `packages/renderer/src/main.tsx` 挂载 `HeroUIProvider`，并在 `packages/renderer/src/App.tsx` 使用一个 HeroUI 组件以验证样式是否生效。

## Concrete Steps (具体步骤)

1. 安装依赖（工作目录：仓库根目录）。
   - 运行：
     - `npm install -w @app/renderer -D tailwindcss @tailwindcss/vite @tailwindcss/postcss`
     - `npm install -w @app/renderer @heroui/react framer-motion`
   - 预期：`packages/renderer/package.json` 中新增相应依赖。

2. 新增 HeroUI 插件入口文件。
   - 创建 `packages/renderer/hero.ts`，导出 `heroui()` 插件。

3. 更新全局样式入口。
   - 编辑 `packages/renderer/src/index.css`，移除现有示例样式，改为 Tailwind v4 CSS-first 配置，并接入 HeroUI 插件与 `@source`。

4. 配置 PostCSS 与 Vite。
   - 新增 `packages/renderer/postcss.config.js`，配置 `@tailwindcss/postcss`。
   - 更新 `packages/renderer/vite.config.ts`，新增 `@tailwindcss/vite` 插件。

5. 更新渲染层入口与示例 UI。
   - 编辑 `packages/renderer/src/main.tsx`：引入并包裹 `HeroUIProvider`。
   - 编辑 `packages/renderer/src/App.tsx`：替换示例 UI，加入一个 HeroUI 组件（如 Button）用于验证。

## Validation and Acceptance (验证与验收)

在仓库根目录执行 `npm run dev --workspace @app/renderer`。打开终端输出的本地地址（当前为 `http://localhost:5174/`），页面应渲染 HeroUI 组件并带有 Tailwind 基础样式。若 Tailwind 与 HeroUI 未生效，优先检查 `@plugin` 与 `@source` 路径是否正确。

## Idempotence and Recovery (幂等性与恢复)

上述步骤可重复执行；若安装依赖失败，可再次运行相同的 `npm install` 命令。若样式未加载，先回退 `packages/renderer/src/index.css` 到变更前内容，再逐步恢复 `@import`、`@plugin` 与 `@source` 以定位问题。

## Artifacts and Notes (工件与笔记)

关键配置片段示例（路径需与实际项目结构一致）：

  `packages/renderer/hero.ts`
    import { heroui } from '@heroui/react';
    export default heroui();

  `packages/renderer/src/index.css`
    @import 'tailwindcss';
    @plugin '../hero.ts';
    @source '../../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}';
    @custom-variant dark (&:is(.dark *));

  `packages/renderer/postcss.config.js`
    export default {
      plugins: {
        '@tailwindcss/postcss': {},
      },
    };

## Interfaces and Dependencies (接口与依赖)

依赖新增：
- `tailwindcss`、`@tailwindcss/vite`、`@tailwindcss/postcss` 作为渲染层构建期依赖。
- `@heroui/react` 与 `framer-motion` 作为运行时依赖。

接口变更：
- 渲染层入口 `packages/renderer/src/main.tsx` 需要使用 `HeroUIProvider` 包裹应用根节点。
  
---
变更记录：补充验证结果、端口冲突观察以及 Outcome 总结。
