# 启用主题切换与可滚动卡片布局

这份 ExecPlan 是一份动态文档。随着工作的进行，`Progress`、`Surprises & Discoveries`、`Decision Log` 和 `Outcomes & Retrospective` 章节必须保持更新。

本文档遵循仓库规范 `".agents/PLANS.md"`，所有步骤与产物必须以该文件为准绳持续维护。

## Purpose / Big Picture (目的/大图景)

完成后，用户可以在左侧“工作台”标题右侧切换浅色/深色主题，主题选择会写入本地存储并在下次启动时优先读取；如果没有本地记忆，则跟随系统主题变化。主页与各页面卡片会遵循一致的布局规范：卡片不超过窗口高度，卡片内容在内部滚动，避免页面整体被超长内容撑开。

## Progress (进度)

- [x] (2026-01-23 00:00Z) 生成 ExecPlan 并确认关键需求与边界。
- [x] (2026-01-23 00:06Z) 安装 `@heroui/use-theme` 并确认其导出 API 与行为。
- [x] (2026-01-23 00:12Z) 新增主题偏好管理 Hook 与主题切换组件。
- [x] (2026-01-23 00:20Z) 调整 `App` 外层布局与侧边栏标题区布局。
- [x] (2026-01-23 00:28Z) 统一卡片样式与滚动行为，并更新所有页面使用。
- [ ] 验证主题持久化、系统跟随与卡片高度/滚动行为。

## Surprises & Discoveries (惊喜与发现)

- 观察：`@heroui/use-theme` 会使用 `heroui-theme` 作为本地存储 key，且在 `system` 模式下仍会写入主题值。
  证据：阅读 `node_modules/@heroui/use-theme/dist/index.mjs` 的 `ThemeProps.KEY` 与 `setTheme` 实现逻辑。

## Decision Log (决策日志)

- 决策：使用 `@heroui/use-theme` 作为主题状态与切换入口，同时在本地实现“先读记忆否则跟随系统”的逻辑。
  理由：符合用户选择的方案 1，并将主题与 UI 解耦，便于以后复用。
  日期/作者：2026-01-23 / Codex

- 决策：新增 `app-theme-preference` 作为用户偏好 key，与 `heroui-theme` 解耦，避免系统跟随时误判为用户手动选择。
  理由：`@heroui/use-theme` 会写入 `heroui-theme`，独立偏好 key 更清晰地表达“是否有用户记忆”。
  日期/作者：2026-01-23 / Codex

- 决策：通过统一 `.app-card` 与 `.app-card-body` 样式为所有卡片提供最大高度与内部滚动能力。
  理由：避免在每个页面手写相同的布局/滚动逻辑，符合 DRY/KISS。
  日期/作者：2026-01-23 / Codex

## Outcomes & Retrospective (结果与回顾)

- 待执行完成后补充。

## Context and Orientation (背景与导向)

本仓库是 Electron + Vite 的前端工程，渲染层在 `"packages/renderer"`。现有布局由 `"packages/renderer/src/App.tsx"` 负责，侧边栏使用自定义样式 `app-surface`，主内容区域通过 `Card` 组件承载。全局样式位于 `"packages/renderer/src/index.css"`，目前已有自定义 CSS 变量与背景渐变，但没有暗色主题变量。

涉及的页面与组件如下：
- 入口：`"packages/renderer/src/main.tsx"` 使用 `HeroUIProvider` 包裹应用。
- 主布局：`"packages/renderer/src/App.tsx"`。
- 页面卡片：`"packages/renderer/src/pages/DashboardPage.tsx"`、`"packages/renderer/src/pages/TodosPage.tsx"`、`"packages/renderer/src/pages/SchedulePage.tsx"`、`"packages/renderer/src/pages/AgentPage.tsx"`、`"packages/renderer/src/pages/AuthPage.tsx"`、`"packages/renderer/src/pages/SettingsPage.tsx"`。
- 组件：`"packages/renderer/src/components/PageHeader.tsx"` 等。

“卡片”指 `@heroui/react` 的 `Card` 组件。主题切换将通过 `@heroui/use-theme` 的 Hook 获取/设置当前主题，并在本地存储中记忆用户选择；当没有记忆时，使用 `prefers-color-scheme` 作为系统主题来源。

## Plan of Work (工作计划)

首先在渲染层添加 `@heroui/use-theme` 依赖，并通过阅读 `node_modules` 中的 README 或类型定义确认其 Hook 的实际 API。然后新增一个主题偏好 Hook（建议路径 `"packages/renderer/src/hooks/useThemePreference.ts"`），集中处理：读取本地存储、在无记忆时跟随系统主题、切换时写回本地存储、并同步 `html` 元素的 `light/dark` 类名。

接着新增主题切换组件（建议路径 `"packages/renderer/src/components/ThemeToggle.tsx"`），使用 HeroUI 的 `Switch` 或轻量 `Button` 作为 UI，放置在侧边栏“工作台”标题右侧，并通过 `useThemePreference` 驱动。

然后优化主页布局：调整 `"packages/renderer/src/App.tsx"` 为更稳定的列布局（保留左侧栏），为主卡片与侧边栏留出明确的垂直高度约束，并确保主卡片 `CardBody` 可以内部滚动。

最后统一卡片样式与滚动行为：在 `"packages/renderer/src/index.css"` 新增 `.app-card` 与 `.app-card-body` 样式，并在所有页面的 `Card`/`CardBody` 上补充类名，确保每张卡片最大高度不超过当前窗口、内容超出时卡片内部滚动。同步补充暗色主题变量与暗色背景渐变。

## Concrete Steps (具体步骤)

1) 安装依赖（从仓库根目录执行）：

   npm install --workspace "@app/renderer" "@heroui/use-theme"

2) 查看 `"node_modules/@heroui/use-theme"` 内 README 或类型定义，确认 Hook 名称、返回值与参数，记录在 `Decision Log`。

3) 新增主题偏好 Hook：创建 `"packages/renderer/src/hooks/useThemePreference.ts"`，实现以下逻辑：
   - 读取本地存储 `app-theme-preference`。
   - 如存在记忆，直接设置主题；否则读取 `prefers-color-scheme` 并监听系统主题变化。
   - 当用户切换主题时写回本地存储，并停止系统跟随。
   - 每次主题变化时同步 `html` 元素 `light/dark` 类名。

4) 新增 `"packages/renderer/src/components/ThemeToggle.tsx"`，使用 HeroUI 组件呈现开关，调用 `useThemePreference`，并提供清晰的无障碍标签。

5) 更新 `"packages/renderer/src/App.tsx"`：
   - 在侧边栏标题区域引入 `ThemeToggle`，靠右对齐。
   - 调整主布局为更稳健的列/网格结构，补充 `min-h-0` 等防止溢出的布局类。
   - 为主内容 `Card` 增加 `.app-card` 类，`CardBody` 增加 `.app-card-body` 类。

6) 更新 `"packages/renderer/src/index.css"`：
   - 添加 `.dark` 覆盖的颜色变量与背景渐变。
   - 新增 `.app-card` 与 `.app-card-body` 样式，实现最大高度与内部滚动。

7) 更新所有页面卡片类名：
   - `"packages/renderer/src/pages/DashboardPage.tsx"`
   - `"packages/renderer/src/pages/TodosPage.tsx"`
   - `"packages/renderer/src/pages/SchedulePage.tsx"`
   - `"packages/renderer/src/pages/AgentPage.tsx"`
   - `"packages/renderer/src/pages/AuthPage.tsx"`
   - `"packages/renderer/src/pages/SettingsPage.tsx"`

8) 运行开发预览并人工验证主题与滚动行为。

## Validation and Acceptance (验证与验收)

在仓库根目录运行：

- 启动渲染层：

  npm run dev --workspace "@app/renderer"

验收标准：
- 侧边栏“工作台”右侧可切换主题，切换后 UI 颜色明显变化。
- 刷新页面后主题保持上次选择；如果手动清除本地存储 `app-theme-preference`，主题将跟随系统偏好，并在系统主题变化时自动切换。
- 任意页面中任意卡片内容超出时仅卡片内部滚动，卡片高度不超过窗口高度。

## Idempotence and Recovery (幂等性与恢复)

- 主题逻辑与样式变更可重复执行；如需回退，移除新增 Hook/组件并删除 `.app-card`/暗色变量即可。
- 若依赖安装失败，可重试 `npm install --workspace "@app/renderer" "@heroui/use-theme"`；不影响其他包。

## Artifacts and Notes (工件与笔记)

- 待实现后补充关键 diff 与验证记录。

## Interfaces and Dependencies (接口与依赖)

- 新增依赖：`@heroui/use-theme`（仅渲染层）。
- 新增 Hook：`useThemePreference`，对外提供 `theme`、`isDark`、`setTheme`/`toggleTheme` 等轻量接口。
- 新增组件：`ThemeToggle`，仅依赖 `@heroui/react` 与 `useThemePreference`。

变更记录：
- 2026-01-23：初版 ExecPlan，新增主题切换与卡片滚动的实施路线。
- 2026-01-23：更新进度与决策，明确 `app-theme-preference` 偏好 key 与 `@heroui/use-theme` 行为，以匹配实际实现。
