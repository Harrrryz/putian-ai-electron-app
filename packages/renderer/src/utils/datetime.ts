export const toDatetimeLocal = (isoString: string | null | undefined) => {
  if (!isoString) {
    return ''
  }

  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const offset = date.getTimezoneOffset() * 60000
  const local = new Date(date.getTime() - offset)
  return local.toISOString().slice(0, 16)
}

export const toIsoString = (localInput: string | null | undefined) => {
  if (!localInput) {
    return ''
  }

  const date = new Date(localInput)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString()
}

export const formatDateTime = (isoString: string | null | undefined) => {
  if (!isoString) {
    return '未设置'
  }

  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) {
    return '时间格式错误'
  }

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDateOnly = (isoString: string | null | undefined) => {
  if (!isoString) {
    return '未设置'
  }

  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) {
    return '时间格式错误'
  }

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
