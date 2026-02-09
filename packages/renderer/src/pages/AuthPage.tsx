import { Button, Card, Input, Label, Tabs, TextField } from '@heroui/react'
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
        <Card.Header className="flex flex-col items-start gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
            Todo AI Desktop
          </p>
          <h1 className="app-title text-3xl font-semibold text-[var(--ink-strong)]">
            开始高效规划你的时间
          </h1>
          <p className="text-sm text-[var(--ink-soft)]">
            模块化 Todo 管理 + AI 助手，专为日程规划而生。
          </p>
        </Card.Header>
        <Card.Content className="app-card-body space-y-3">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(String(key))}
            variant="secondary"
          >
            <Tabs.ListContainer>
              <Tabs.List>
                <Tabs.Tab id="login">登录</Tabs.Tab>
                <Tabs.Tab id="register">注册</Tabs.Tab>
                <Tabs.Indicator />
              </Tabs.List>
            </Tabs.ListContainer>
            <Tabs.Panel id="login">
              <div className="space-y-3">
                <TextField
                  value={loginForm.username}
                  onChange={(value) =>
                    setLoginForm((prev) => ({ ...prev, username: value }))
                  }
                  className="space-y-1"
                >
                  <Label className="app-label">邮箱</Label>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    className="app-input"
                  />
                </TextField>
                <TextField
                  value={loginForm.password}
                  onChange={(value) =>
                    setLoginForm((prev) => ({ ...prev, password: value }))
                  }
                  className="space-y-1"
                >
                  <Label className="app-label">密码</Label>
                  <Input
                    type="password"
                    placeholder="输入密码"
                    className="app-input"
                  />
                </TextField>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    className="app-btn app-btn-primary"
                    onPress={handleLogin}
                    isPending={busy}
                  >
                    登录
                  </Button>
                  <Button
                    variant="secondary"
                    className="app-btn"
                    onPress={handleResendVerification}
                    isDisabled={!loginForm.username || busy}
                  >
                    重新发送验证邮件
                  </Button>
                </div>
              </div>
            </Tabs.Panel>
            <Tabs.Panel id="register">
              <div className="space-y-3">
                <TextField
                  value={registerForm.email}
                  onChange={(value) =>
                    setRegisterForm((prev) => ({ ...prev, email: value }))
                  }
                  className="space-y-1"
                >
                  <Label className="app-label">邮箱</Label>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    className="app-input"
                  />
                </TextField>
                <TextField
                  value={registerForm.name}
                  onChange={(value) =>
                    setRegisterForm((prev) => ({ ...prev, name: value }))
                  }
                  className="space-y-1"
                >
                  <Label className="app-label">姓名</Label>
                  <Input placeholder="输入姓名" className="app-input" />
                </TextField>
                <TextField
                  value={registerForm.password}
                  onChange={(value) =>
                    setRegisterForm((prev) => ({ ...prev, password: value }))
                  }
                  className="space-y-1"
                >
                  <Label className="app-label">密码</Label>
                  <Input
                    type="password"
                    placeholder="设置密码"
                    className="app-input"
                  />
                </TextField>
                <Button
                  variant="primary"
                  className="app-btn app-btn-primary"
                  onPress={handleRegister}
                  isPending={busy}
                >
                  创建账户
                </Button>
              </div>
            </Tabs.Panel>
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
        </Card.Content>
      </Card>
    </div>
  )
}

export default AuthPage
