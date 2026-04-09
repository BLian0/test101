const API_BASE_URL = 'http://localhost:3000/api/v1'
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, '')
const TOKEN_KEY = 'campus-match-token'

type UploadSource = string | File | Blob

const API_ERROR_MESSAGES: Record<string, string> = {
  AUTH_EMAIL_SUFFIX_INVALID: '请输入允许的校园邮箱',
  AUTH_EMAIL_CODE_INVALID: '邮箱验证码错误或已过期',
  AUTH_EMAIL_ALREADY_EXISTS: '该邮箱已经注册',
  AUTH_USERNAME_ALREADY_EXISTS: '用户名已被占用',
  AUTH_EMAIL_NOT_FOUND: '该邮箱尚未注册',
  AUTH_INVALID_CREDENTIALS: '用户名或密码错误',
  AUTH_EMAIL_SEND_FAILED: '邮箱验证码发送失败，请稍后重试',
  AUTH_EMAIL_CODE_TOO_FREQUENT: '发送过于频繁，请 60 秒后再试',
  AUTH_EMAIL_CODE_RATE_LIMITED: '这一小时发送次数过多，请稍后再试',
  AUTH_EMAIL_SMTP_CONFIG_MISSING: '邮件服务暂时不可用',
  AUTH_PASSWORD_RESET_FAILED: '密码重置失败，请稍后重试',
  PROFILE_NICKNAME_ALREADY_EXISTS: '昵称已被占用',
  PROFILE_NICKNAME_CHANGE_LIMIT: '昵称注册后仅允许修改一次',
  REPORT_TARGET_REQUIRED: '请选择要举报的对象',
  REPORT_CONTENT_REQUIRED: '请填写举报原因',
  REPORT_TARGET_NOT_FOUND: '当前对象已不可见',
  BLOCK_TARGET_REQUIRED: '请选择要拉黑的对象',
  BLOCK_TARGET_NOT_FOUND: '当前对象已不可见',
  CHAT_CONNECTION_NOT_FOUND: '当前连接已失效',
  CHAT_CONVERSATION_NOT_FOUND: '当前会话已失效',
  CHAT_FIRST_MESSAGE_CONTACT_INFO_FORBIDDEN: '首条消息暂不允许发送联系方式',
}

function parseApiErrorMessage(error: unknown) {
  if (typeof error === 'string') {
    return API_ERROR_MESSAGES[error] ?? error
  }

  if (Array.isArray(error) && error.length > 0) {
    return parseApiErrorMessage(error[0])
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    if (Array.isArray(record.message) && record.message.length > 0) {
      return parseApiErrorMessage(record.message[0])
    }
    if (typeof record.message === 'string') {
      return API_ERROR_MESSAGES[record.message] ?? record.message
    }
    if (typeof record.error === 'string') {
      return API_ERROR_MESSAGES[record.error] ?? record.error
    }
  }

  return '请求失败，请稍后重试'
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
  token?: string
}

export function request<T>(path: string, options: RequestOptions = {}) {
  return new Promise<T>((resolve, reject) => {
    const token =
      options.token ??
      (typeof uni.getStorageSync(TOKEN_KEY) === 'string' ? String(uni.getStorageSync(TOKEN_KEY)) : '')

    uni.request({
      url: `${API_BASE_URL}${path}`,
      method: options.method ?? 'GET',
      data: options.data,
      header: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
      success: response => {
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data as T)
          return
        }

        reject(new Error(parseApiErrorMessage(response.data)))
      },
      fail: error => reject(new Error(parseApiErrorMessage(error))),
    })
  })
}

export function getStoredToken() {
  return typeof uni.getStorageSync(TOKEN_KEY) === 'string' ? String(uni.getStorageSync(TOKEN_KEY)) : ''
}

interface UploadFileResult {
  message: string
  file: {
    originalName: string
    filename: string
    mimeType: string
    size: number
    url: string
    relativeUrl: string
  }
}

export function uploadFile(
  path: string,
  filePath: UploadSource,
  name?: string,
  formData?: Record<string, string>,
) {
  const token = typeof uni.getStorageSync(TOKEN_KEY) === 'string' ? String(uni.getStorageSync(TOKEN_KEY)) : ''

  if (typeof filePath !== 'string' && typeof FormData !== 'undefined' && typeof fetch !== 'undefined') {
    return new Promise<UploadFileResult>((resolve, reject) => {
      const body = new FormData()
      body.append(name ?? 'file', filePath)

      Object.entries(formData ?? {}).forEach(([key, value]) => {
        body.append(key, value)
      })

      fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        body,
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      })
        .then(async response => {
          const data = (await response.json()) as UploadFileResult
          if (response.ok) {
            resolve(data)
            return
          }

          reject(new Error(parseApiErrorMessage(data)))
        })
        .catch(error => reject(new Error(parseApiErrorMessage(error))))
    })
  }

  return new Promise<UploadFileResult>((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}${path}`,
      filePath: String(filePath),
      name: 'file',
      formData,
      header: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
      success: response => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(JSON.parse(response.data) as UploadFileResult)
          return
        }

        reject(new Error(parseApiErrorMessage(response.data)))
      },
      fail: error => reject(new Error(parseApiErrorMessage(error))),
    })
  })
}

export { API_BASE_URL, API_ORIGIN, parseApiErrorMessage }
