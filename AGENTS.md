# Repository Guidelines

## 项目结构与模块组织
- 本仓库为 npm workspaces 单体仓库，核心代码位于 `packages/*`，内部包统一使用 `@app/*` 命名。
- `packages/main`：Electron 主进程（TypeScript）。
- `packages/preload`：预加载脚本，负责安全桥接。
- `packages/renderer`：Vite + React 渲染层（Web UI）。
- `packages/integrate-renderer`：初始化/集成渲染层的工具包。
- `packages/electron-versions`：Electron 版本辅助工具。
- `packages/dev-mode.js`：开发模式入口，`packages/entry-point.mjs`：应用入口聚合。
- 各包源码通常在 `packages/*/src`，编译产物在 `packages/*/dist`。
- `tests/`：E2E 测试（当前为 `tests/e2e.spec.ts`）。
- `buildResources/`：打包资源（图标等），`electron-builder.mjs` 为打包配置。
- `types/env.d.ts`：环境变量类型声明。

## 构建、测试与开发命令
- `npm run init`：创建并集成渲染层，同时安装依赖。
- `npm start`：开发模式启动应用（包含热重载）。
- `npm run build`：构建所有工作区（若存在 `build` 脚本）。
- `npm run typecheck`：对所有工作区进行类型检查。
- `npm run compile`：构建并使用 `electron-builder` 产出可执行包。
- `npm run openapi`：从 `http://127.0.0.1:8089/schema/openapi.json` 生成前端 API 客户端代码（输出到 `packages/renderer/src/api/generated/`）。
- `npm run test`：运行 Playwright E2E 测试。
- `npm run lint --workspace @app/renderer`：仅渲染层 ESLint 检查。
- `npm run dev --workspace @app/renderer`：单独启动渲染层开发服务。
- `npm run web --workspace @app/preload`：仅启动 Web 应用（纯前端，不启动 Electron）。
- `npm run web:build --workspace @app/preload`：构建纯前端 Web 产物（用于发布 Web 端）。
- `npm run preview --workspace @app/renderer`：预览渲染层构建产物。
- `npm run create-renderer` / `npm run integrate-renderer`：创建并集成新的渲染层工程。

## 编码风格与命名约定
- 项目以 TypeScript + ESM 为主，保持与现有代码一致：2 空格缩进、单引号、分号。
- 包命名使用 `@app/*` 前缀；渲染层与主进程职责分离，避免跨层直接访问 Node API。
- 仓库未强制全局格式化/风格工具；新增代码遵循就近模块的既有风格即可。
- 依赖保持精简，避免无充分理由引入新的第三方库（参见 `CONTRIBUTING.md`）。

## 架构与边界
- 渲染层通过 `@app/preload` 暴露能力，避免直接调用 Node/Electron API。
- IPC 或窗口控制逻辑放在 `packages/main`，`preload` 只做最小桥接。
- 新增环境变量请同步更新 `types/env.d.ts` 以获得类型提示。
- OpenAPI 客户端生成配置位于 `openapi-ts.config.ts`，生成产物位于 `packages/renderer/src/api/generated/`，请勿手改。
- 运行时配置通过 `packages/renderer/src/api/client-config.ts` 注入 `baseUrl`。

## 测试指南
- 使用 Playwright 进行端到端测试；文件命名遵循 `*.spec.ts`。
- 若测试依赖打包产物，先执行 `npm run compile` 再运行测试。
- 可在各包内部补充单元测试，按包脚本约定执行。

## 提交与 PR 规范
- 当前 Git 历史仅有初始提交，尚无固定提交格式；建议简洁动词开头，必要时加作用域。
- 提 PR 前优先创建 issue 讨论；避免无必要的第三方依赖。
- 无法本地跑测试时，请提交 Draft PR 并说明原因。
- UI 变更请附截图，描述需包含变更动机与影响范围。
- PR 描述建议包含：变更摘要、验证方式（命令/截图）、风险点，并关联 issue。

## 配置与安全提示
- 环境变量通过 `import.meta.env` 读取，仅 `VITE_` 前缀会暴露给渲染层。
- 可通过 `VITE_API_BASE_URL` 覆盖后端地址，示例见 `.env.example`。
- Node 版本要求：`>=23.0.0`（见 `package.json`）。
- 需要访问系统/Node 能力时，优先放在 `preload` 或 `main`，通过安全桥接暴露给渲染层。
