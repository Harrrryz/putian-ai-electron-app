import { Button, Card, CardBody, CardHeader, Input, Tab, Tabs } from '@heroui/react'
import { useState } from 'react'
import { api } from '../api/service'
import type { User } from '../api/generated/types.gen'

type AuthPageProps = {
  onAuthSuccess: (user: User) => void
}

const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const [activeTab, setActiveTab] = useState('login')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    name: '',
  })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)

    const response = await api.login({
      username: loginForm.username,
      password: loginForm.password,
    })

    if (!response.ok) {
      setError(response.error)
      setBusy(false)
      return
    }

    const profile = await api.profile()
    setBusy(false)

    if (!profile.ok) {
      setError('登录成功，但获取用户信息失败。请重试。')
      return
    }

    onAuthSuccess(profile.data)
  }

  const handleRegister = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)

    const response = await api.register({
      email: registerForm.email,
      password: registerForm.password,
      name: registerForm.name || undefined,
    })

    setBusy(false)

    if (!response.ok) {
      setError(response.error)
      return
    }

    setNotice('注册成功，请前往邮箱完成验证后再登录。')
    setActiveTab('login')
  }

  const handleResendVerification = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)

    const response = await api.resendVerification(loginForm.username)
    setBusy(false)

    if (!response.ok) {
      setError(response.error)
      return
    }

    setNotice('验证邮件已重新发送，请检查邮箱。')
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-8">
      <Card className="app-surface app-card w-full max-w-xl rounded-lg">
        <CardHeader className="flex flex-col items-start gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
            Todo AI Desktop
          </p>
          <h1 className="app-title text-3xl font-semibold text-[var(--ink-strong)]">
            开始高效规划你的时间
          </h1>
          <p className="text-sm text-[var(--ink-soft)]">
            模块化 Todo 管理 + AI 助手，专为日程规划而生。
          </p>
        </CardHeader>
        <CardBody className="app-card-body space-y-3">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(String(key))}
            variant="underlined"
            color="default"
          >
            <Tab key="login" title="登录">
              <div className="space-y-3">
                <Input
                  label="邮箱"
                  type="email"
                  value={loginForm.username}
                  onValueChange={(value) =>
                    setLoginForm((prev) => ({ ...prev, username: value }))
                  }
                />
                <Input
                  label="密码"
                  type="password"
                  value={loginForm.password}
                  onValueChange={(value) =>
                    setLoginForm((prev) => ({ ...prev, password: value }))
                  }
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    color="default"
                    variant="flat"
                    className="app-btn app-btn-primary"
                    onPress={handleLogin}
                    isLoading={busy}
                  >
                    登录
                  </Button>
                  <Button
                    color="default"
                    variant="flat"
                    className="app-btn"
                    onPress={handleResendVerification}
                    isDisabled={!loginForm.username || busy}
                  >
                    重新发送验证邮件
                  </Button>
                </div>
              </div>
            </Tab>
            <Tab key="register" title="注册">
              <div className="space-y-3">
                <Input
                  label="邮箱"
                  type="email"
                  value={registerForm.email}
                  onValueChange={(value) =>
                    setRegisterForm((prev) => ({ ...prev, email: value }))
                  }
                />
                <Input
                  label="姓名"
                  value={registerForm.name}
                  onValueChange={(value) =>
                    setRegisterForm((prev) => ({ ...prev, name: value }))
                  }
                />
                <Input
                  label="密码"
                  type="password"
                  value={registerForm.password}
                  onValueChange={(value) =>
                    setRegisterForm((prev) => ({ ...prev, password: value }))
                  }
                />
                <Button
                  color="default"
                  variant="flat"
                  className="app-btn app-btn-primary"
                  onPress={handleRegister}
                  isLoading={busy}
                >
                  创建账户
                </Button>
              </div>
            </Tab>
          </Tabs>
          {error ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="app-surface-muted rounded-md px-4 py-3 text-sm text-[var(--ink-soft)]">
              {notice}
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  )
}

export default AuthPage
