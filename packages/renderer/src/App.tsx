import { Button, Card, CardBody, CardHeader } from '@heroui/react'

const HERO_LABEL = 'Electron Frontend'
const HERO_TITLE = 'Tailwind v4 + HeroUI 已就绪'
const HERO_DESCRIPTION =
  '这里是渲染层示例界面，用于验证 HeroUI 组件样式与 Tailwind v4 实用类是否正常生效。'
const PRIMARY_ACTION = '开始使用'
const SECONDARY_ACTION = '查看文档'

function App() {
  return (
    <main className="flex min-h-full items-center justify-center bg-slate-950 px-6 text-slate-100">
      <Card className="w-full max-w-lg border border-white/10 bg-slate-900/70">
        <CardHeader className="flex flex-col items-start gap-2">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            {HERO_LABEL}
          </p>
          <h1 className="text-3xl font-semibold text-white">
            {HERO_TITLE}
          </h1>
        </CardHeader>
        <CardBody className="space-y-4 text-sm text-slate-300">
          <p>{HERO_DESCRIPTION}</p>
          <div className="flex flex-wrap gap-3">
            <Button color="primary">{PRIMARY_ACTION}</Button>
            <Button variant="flat">{SECONDARY_ACTION}</Button>
          </div>
        </CardBody>
      </Card>
    </main>
  )
}

export default App
