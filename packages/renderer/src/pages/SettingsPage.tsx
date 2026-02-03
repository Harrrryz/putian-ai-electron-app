import { Button, Card, CardBody, CardHeader } from '@heroui/react'
import PageHeader from '../components/PageHeader'
import type { User } from '../api/generated/types.gen'
import { api } from '../api/service'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8089'

type SettingsPageProps = {
  user: User
  onLogout: () => void
}

const SettingsPage = ({ user, onLogout }: SettingsPageProps) => {
  const handleLogout = async () => {
    await api.logout()
    onLogout()
  }

  return (
    <div className="space-y-4">
      <PageHeader title="设置" description="账户、环境与系统信息。" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="app-surface app-card rounded-lg">
          <CardHeader>
            <p className="text-lg font-semibold text-[var(--ink-strong)]">
              账户信息
            </p>
          </CardHeader>
          <CardBody className="app-card-body space-y-2 text-sm text-[var(--ink-soft)]">
            <p>
              <span className="font-semibold text-[var(--ink-strong)]">邮箱：</span>
              {user.email}
            </p>
            <p>
              <span className="font-semibold text-[var(--ink-strong)]">姓名：</span>
              {user.name || '未设置'}
            </p>
            <p>
              <span className="font-semibold text-[var(--ink-strong)]">状态：</span>
              {user.is_verified ? '已验证' : '未验证'}
            </p>
            <Button color="default" variant="flat" className="app-btn app-btn-ghost" onPress={handleLogout}>
              退出登录
            </Button>
          </CardBody>
        </Card>

        <Card className="app-surface app-card rounded-lg">
          <CardHeader>
            <p className="text-lg font-semibold text-[var(--ink-strong)]">
              连接配置
            </p>
          </CardHeader>
          <CardBody className="app-card-body space-y-2 text-sm text-[var(--ink-soft)]">
            <p>
              <span className="font-semibold text-[var(--ink-strong)]">API：</span>
              {BASE_URL}
            </p>
            <p>如需切换环境，请修改 VITE_API_BASE_URL 并重启应用。</p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default SettingsPage
