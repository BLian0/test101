<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type AdminSection = 'users' | 'reports' | 'emailRules' | 'questionnaires'

interface LoginResponse {
  accessToken: string
  profile: {
    username: string
    role: string
  }
}

interface AdminOperationLog {
  id: number
  actionType: string
  targetType: string
  targetId: number
  detail: string
  createdAt: string
}

interface UserItem {
  id: number
  uid: string
  email: string
  phone: string
  schoolName: string
  registeredAt: string
  nickname: string | null
  profileCompleted: boolean
  questionnaireCompleted: boolean
  preferencesCompleted: boolean
  isBanned: boolean
  banReason: string | null
}

interface UserDetail extends UserItem {
  latestLogs: AdminOperationLog[]
}

interface ReportItem {
  id: number
  reporterUserId: number
  targetUserId: number
  category: string
  description: string
  status: 'PENDING' | 'RESOLVED'
  createdAt: string
  resolutionNote: string | null
  resolvedAt: string | null
}

interface ReportDetail extends ReportItem {
  latestLogs: AdminOperationLog[]
}

interface EmailRuleItem {
  id: number
  emailSuffix: string
  isActive: boolean
}

interface QuestionnaireItem {
  id: number
  versionCode: string
  status: string
  title: string
  sections: string[]
}

const API_BASE_URL = 'http://localhost:3000/api/v1'
const TOKEN_KEY = 'campus-match-admin-token'

const activeSection = ref<AdminSection>('users')
const loading = ref(false)
const token = ref(localStorage.getItem(TOKEN_KEY) ?? '')
const loginForm = ref({
  username: 'admin',
  password: 'admin123',
})
const adminProfile = ref({
  username: 'admin',
  role: 'SUPER_ADMIN',
})
const users = ref<UserItem[]>([])
const reports = ref<ReportItem[]>([])
const emailRules = ref<EmailRuleItem[]>([])
const questionnaires = ref<QuestionnaireItem[]>([])
const operationLogs = ref<AdminOperationLog[]>([])
const selectedUser = ref<UserDetail | null>(null)
const selectedReport = ref<ReportDetail | null>(null)
const errorMessage = ref('')
const actionMessage = ref('')
const newRuleSuffix = ref('')
const reportResolutionNotes = ref<Record<number, string>>({})

const sections = [
  { id: 'users', label: '用户' },
  { id: 'reports', label: '举报' },
  { id: 'emailRules', label: '邮箱规则' },
  { id: 'questionnaires', label: '问卷版本' },
] satisfies Array<{ id: AdminSection; label: string }>

const isLoggedIn = computed(() => Boolean(token.value))
const userStats = computed(() => [
  { label: '注册用户', value: users.value.length.toString() },
  {
    label: '完成画像',
    value: users.value.filter(item => item.questionnaireCompleted).length.toString(),
  },
  {
    label: '待处理举报',
    value: reports.value.filter(item => item.status === 'PENDING').length.toString(),
  },
])

const request = async <T>(path: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  const data = (await response.json()) as T | { message?: string }
  if (!response.ok) {
    throw new Error(typeof data === 'object' && data && 'message' in data ? String(data.message) : 'REQUEST_FAILED')
  }

  return data as T
}

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

const loadDashboardData = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const [userResponse, reportResponse, ruleResponse, questionnaireResponse, logResponse] = await Promise.all([
      request<{ items: UserItem[] }>('/admin/users'),
      request<{ items: ReportItem[] }>('/admin/reports'),
      request<{ items: EmailRuleItem[] }>('/admin/schools/1/email-rules'),
      request<{ items: QuestionnaireItem[] }>('/admin/questionnaires'),
      request<{ items: AdminOperationLog[] }>('/admin/operation-logs'),
    ])

    users.value = userResponse.items
    reports.value = reportResponse.items
    emailRules.value = ruleResponse.items
    questionnaires.value = questionnaireResponse.items
    operationLogs.value = logResponse.items
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '后台数据加载失败'
  } finally {
    loading.value = false
  }
}

const handleLogin = async () => {
  errorMessage.value = ''
  actionMessage.value = ''
  loading.value = true

  try {
    const response = await request<LoginResponse>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginForm.value),
    })

    token.value = response.accessToken
    adminProfile.value = response.profile
    localStorage.setItem(TOKEN_KEY, response.accessToken)
    await loadDashboardData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败'
  } finally {
    loading.value = false
  }
}

const logout = () => {
  token.value = ''
  localStorage.removeItem(TOKEN_KEY)
}

const openUserDetail = async (userId: number) => {
  try {
    selectedUser.value = await request<UserDetail>(`/admin/users/${userId}`)
    selectedReport.value = null
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载用户详情失败'
  }
}

const openReportDetail = async (reportId: number) => {
  try {
    selectedReport.value = await request<ReportDetail>(`/admin/reports/${reportId}`)
    selectedUser.value = null
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载举报详情失败'
  }
}

const resolveReport = async (reportId: number) => {
  actionMessage.value = ''
  errorMessage.value = ''
  try {
    await request(`/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        resolutionNote: reportResolutionNotes.value[reportId] ?? '',
      }),
    })
    actionMessage.value = `举报 #${reportId} 已处理`
    await loadDashboardData()
    await openReportDetail(reportId)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '处理举报失败'
  }
}

const toggleBan = async (user: UserItem) => {
  actionMessage.value = ''
  errorMessage.value = ''
  try {
    await request(`/admin/users/${user.id}/ban`, {
      method: 'POST',
      body: JSON.stringify({
        isBanned: !user.isBanned,
        reason: user.isBanned ? '' : `管理员手动封禁：${user.nickname || user.email}`,
      }),
    })
    actionMessage.value = user.isBanned ? `用户 ${user.uid} 已解封` : `用户 ${user.uid} 已封禁`
    await loadDashboardData()
    await openUserDetail(user.id)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '更新封禁状态失败'
  }
}

const createEmailRule = async () => {
  const emailSuffix = newRuleSuffix.value.trim().toLowerCase()
  if (!emailSuffix) {
    errorMessage.value = '请输入邮箱后缀'
    return
  }

  actionMessage.value = ''
  errorMessage.value = ''
  try {
    const response = await request<{ items: EmailRuleItem[] }>('/admin/schools/1/email-rules', {
      method: 'POST',
      body: JSON.stringify({ emailSuffix }),
    })
    emailRules.value = response.items
    newRuleSuffix.value = ''
    actionMessage.value = `邮箱后缀 ${emailSuffix} 已加入规则`
    const logs = await request<{ items: AdminOperationLog[] }>('/admin/operation-logs')
    operationLogs.value = logs.items
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '新增邮箱规则失败'
  }
}

const toggleEmailRule = async (rule: EmailRuleItem) => {
  actionMessage.value = ''
  errorMessage.value = ''
  try {
    const response = await request<{ rule: EmailRuleItem }>(`/admin/email-rules/${rule.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: !rule.isActive }),
    })
    emailRules.value = emailRules.value.map(item => (item.id === rule.id ? response.rule : item))
    actionMessage.value = `邮箱规则 ${rule.emailSuffix} 已${rule.isActive ? '停用' : '启用'}`
    const logs = await request<{ items: AdminOperationLog[] }>('/admin/operation-logs')
    operationLogs.value = logs.items
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '更新邮箱规则失败'
  }
}

onMounted(async () => {
  if (isLoggedIn.value) {
    await loadDashboardData()
  }
})
</script>

<template>
  <div class="admin-app">
    <main v-if="!isLoggedIn" class="login-layout">
      <section class="login-panel">
        <p class="eyebrow">Campus Match Admin</p>
        <h1>校园搭子管理后台</h1>
        <p class="intro">当前支持用户审核、举报处理、校园邮箱后缀管理、问卷版本查看和操作日志。</p>

        <label class="field">
          <span>管理员账号</span>
          <input v-model="loginForm.username" type="text" placeholder="admin" />
        </label>

        <label class="field">
          <span>密码</span>
          <input v-model="loginForm.password" type="password" placeholder="admin123" />
        </label>

        <button class="primary-button" :disabled="loading" @click="handleLogin">
          {{ loading ? '登录中...' : '进入后台' }}
        </button>

        <p class="hint">开发账号：`admin` / `admin123`</p>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </section>
    </main>

    <main v-else class="dashboard-layout">
      <aside class="sidebar">
        <div class="sidebar__brand">
          <p class="eyebrow">Operations</p>
          <h2>管理后台</h2>
          <p>{{ adminProfile.username }} · {{ adminProfile.role }}</p>
        </div>

        <button
          v-for="section in sections"
          :key="section.id"
          class="sidebar__nav"
          :class="{ 'sidebar__nav--active': activeSection === section.id }"
          @click="activeSection = section.id"
        >
          {{ section.label }}
        </button>

        <button class="sidebar__logout" @click="logout">退出登录</button>
      </aside>

      <section class="content">
        <header class="hero">
          <div>
            <p class="eyebrow">Dashboard</p>
            <h1>校园社交运行面板</h1>
            <p class="hero__desc">这一版已经把审核、配置和操作记录串起来，后续可以继续细化权限和风控策略。</p>
          </div>

          <div class="stats">
            <article v-for="stat in userStats" :key="stat.label" class="stat-card">
              <span>{{ stat.label }}</span>
              <strong>{{ stat.value }}</strong>
            </article>
          </div>
        </header>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <p v-if="actionMessage" class="success-message">{{ actionMessage }}</p>

        <div class="workspace">
          <section class="main-column">
            <section v-if="activeSection === 'users'" class="panel">
              <div class="panel__header">
                <h3>用户列表</h3>
                <span>{{ users.length }} 人</span>
              </div>

              <table class="data-table">
                <thead>
                  <tr>
                    <th>UID</th>
                    <th>昵称</th>
                    <th>邮箱</th>
                    <th>完成状态</th>
                    <th>封禁状态</th>
                    <th>注册时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in users" :key="user.id">
                    <td>{{ user.uid }}</td>
                    <td>{{ user.nickname || '未填写' }}</td>
                    <td>{{ user.email }}</td>
                    <td>
                      <span class="pill" :class="{ 'pill--done': user.profileCompleted }">资料</span>
                      <span class="pill" :class="{ 'pill--done': user.questionnaireCompleted }">画像</span>
                    </td>
                    <td>
                      <span class="pill" :class="{ 'pill--danger': user.isBanned }">
                        {{ user.isBanned ? '已封禁' : '正常' }}
                      </span>
                    </td>
                    <td>{{ formatDateTime(user.registeredAt) }}</td>
                    <td class="action-cell">
                      <button class="ghost-button" @click="openUserDetail(user.id)">详情</button>
                      <button class="ghost-button" @click="toggleBan(user)">
                        {{ user.isBanned ? '解封' : '封禁' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section v-if="activeSection === 'reports'" class="panel">
              <div class="panel__header">
                <h3>举报处理</h3>
                <span>{{ reports.length }} 条</span>
              </div>

              <article v-for="report in reports" :key="report.id" class="report-card">
                <div class="report-card__content">
                  <strong>#{{ report.id }} · {{ report.category }}</strong>
                  <p>举报人 {{ report.reporterUserId }} -> 被举报 {{ report.targetUserId }}</p>
                  <p>{{ report.description }}</p>
                  <p v-if="report.resolutionNote" class="subtext">处理备注：{{ report.resolutionNote }}</p>
                </div>
                <div class="report-card__meta">
                  <span class="pill" :class="{ 'pill--done': report.status === 'RESOLVED' }">{{ report.status }}</span>
                  <span>{{ formatDateTime(report.createdAt) }}</span>
                  <textarea
                    v-model="reportResolutionNotes[report.id]"
                    class="report-note"
                    placeholder="处理备注，例如：已提醒、已封禁、证据不足"
                    :disabled="report.status === 'RESOLVED'"
                  />
                  <div class="report-card__actions">
                    <button class="ghost-button" @click="openReportDetail(report.id)">详情</button>
                    <button
                      class="ghost-button"
                      :disabled="report.status === 'RESOLVED'"
                      @click="resolveReport(report.id)"
                    >
                      标记已处理
                    </button>
                  </div>
                </div>
              </article>
            </section>

            <section v-if="activeSection === 'emailRules'" class="panel">
              <div class="panel__header">
                <h3>校园邮箱规则</h3>
                <span>学校 ID 1</span>
              </div>

              <div class="rule-create">
                <input v-model="newRuleSuffix" type="text" placeholder="例如 student.dlut.edu.cn" />
                <button class="primary-button primary-button--inline" @click="createEmailRule">新增后缀</button>
              </div>

              <div class="rule-grid">
                <article v-for="rule in emailRules" :key="rule.id" class="rule-card">
                  <div>
                    <strong>{{ rule.emailSuffix }}</strong>
                    <p class="subtext">规则 ID {{ rule.id }}</p>
                  </div>
                  <div class="rule-card__meta">
                    <span class="pill" :class="{ 'pill--done': rule.isActive }">
                      {{ rule.isActive ? '启用中' : '已停用' }}
                    </span>
                    <button class="ghost-button" @click="toggleEmailRule(rule)">
                      {{ rule.isActive ? '停用' : '启用' }}
                    </button>
                  </div>
                </article>
              </div>
            </section>

            <section v-if="activeSection === 'questionnaires'" class="panel">
              <div class="panel__header">
                <h3>问卷版本</h3>
                <span>{{ questionnaires.length }} 个版本</span>
              </div>

              <article v-for="item in questionnaires" :key="item.id" class="questionnaire-card">
                <div>
                  <strong>{{ item.title }}</strong>
                  <p>版本 {{ item.versionCode }} · {{ item.status }}</p>
                </div>
                <div class="tag-row">
                  <span v-for="section in item.sections" :key="section" class="tag-chip">{{ section }}</span>
                </div>
              </article>
            </section>
          </section>

          <aside class="detail-column">
            <section class="panel">
              <div class="panel__header">
                <h3>详情面板</h3>
                <span>{{ selectedUser ? '用户' : selectedReport ? '举报' : '未选择' }}</span>
              </div>

              <div v-if="selectedUser" class="detail-card">
                <strong>用户 {{ selectedUser.uid }}</strong>
                <p>UID：{{ selectedUser.uid }}</p>
                <p>昵称：{{ selectedUser.nickname || '未填写' }}</p>
                <p>邮箱：{{ selectedUser.email }}</p>
                <p>注册时间：{{ formatDateTime(selectedUser.registeredAt) }}</p>
                <p>封禁状态：{{ selectedUser.isBanned ? '已封禁' : '正常' }}</p>
                <p v-if="selectedUser.banReason">封禁原因：{{ selectedUser.banReason }}</p>
                <div class="log-list">
                  <strong>相关日志</strong>
                  <div v-for="log in selectedUser.latestLogs" :key="log.id" class="log-item">
                    <span>{{ log.actionType }}</span>
                    <span>{{ formatDateTime(log.createdAt) }}</span>
                    <p>{{ log.detail }}</p>
                  </div>
                </div>
              </div>

              <div v-else-if="selectedReport" class="detail-card">
                <strong>举报 #{{ selectedReport.id }}</strong>
                <p>类别：{{ selectedReport.category }}</p>
                <p>举报人：{{ selectedReport.reporterUserId }}</p>
                <p>被举报人：{{ selectedReport.targetUserId }}</p>
                <p>提交时间：{{ formatDateTime(selectedReport.createdAt) }}</p>
                <p>状态：{{ selectedReport.status }}</p>
                <p>描述：{{ selectedReport.description }}</p>
                <p v-if="selectedReport.resolutionNote">处理备注：{{ selectedReport.resolutionNote }}</p>
                <div class="log-list">
                  <strong>相关日志</strong>
                  <div v-for="log in selectedReport.latestLogs" :key="log.id" class="log-item">
                    <span>{{ log.actionType }}</span>
                    <span>{{ formatDateTime(log.createdAt) }}</span>
                    <p>{{ log.detail }}</p>
                  </div>
                </div>
              </div>

              <div v-else class="empty-detail">
                <p>从左侧列表点“详情”后，这里会显示完整信息。</p>
              </div>
            </section>

            <section class="panel">
              <div class="panel__header">
                <h3>最近操作日志</h3>
                <span>{{ operationLogs.length }} 条</span>
              </div>
              <div class="log-list">
                <div v-for="log in operationLogs" :key="log.id" class="log-item">
                  <div class="log-item__top">
                    <span>{{ log.actionType }}</span>
                    <span>{{ log.targetType }} #{{ log.targetId }}</span>
                  </div>
                  <p>{{ log.detail }}</p>
                  <span class="subtext">{{ formatDateTime(log.createdAt) }}</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-app {
  min-height: 100vh;
}

.login-layout {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 40px;
}

.login-panel {
  width: 100%;
  max-width: 460px;
  padding: 36px;
  border: 1px solid rgba(23, 32, 51, 0.08);
  border-radius: 28px;
  background: rgba(255, 251, 247, 0.92);
  box-shadow: 0 24px 80px rgba(23, 32, 51, 0.08);
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #c35b32;
}

h1,
h2,
h3,
p {
  margin: 0;
}

.intro {
  margin-top: 12px;
  color: #5b6477;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}

.field span {
  font-size: 14px;
  color: #4f5666;
}

.field input,
.rule-create input,
.report-note {
  border: 1px solid rgba(23, 32, 51, 0.12);
  border-radius: 14px;
  background: #fff;
}

.field input,
.rule-create input {
  height: 48px;
  padding: 0 14px;
}

.primary-button,
.ghost-button,
.sidebar__nav,
.sidebar__logout {
  border: none;
  border-radius: 14px;
  cursor: pointer;
}

.primary-button {
  width: 100%;
  height: 50px;
  margin-top: 24px;
  background: #c35b32;
  color: #fff;
}

.primary-button--inline {
  width: 160px;
  margin-top: 0;
}

.hint,
.error-message,
.success-message,
.subtext {
  margin-top: 16px;
  font-size: 14px;
}

.hint,
.subtext {
  color: #677086;
}

.error-message {
  color: #c0392b;
}

.success-message {
  color: #1e7b53;
}

.dashboard-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 28px 22px;
  background: rgba(24, 33, 50, 0.96);
  color: #eef3ff;
}

.sidebar__brand {
  margin-bottom: 20px;
}

.sidebar__brand p:last-child {
  margin-top: 10px;
  color: rgba(238, 243, 255, 0.72);
}

.sidebar__nav,
.sidebar__logout {
  padding: 14px 16px;
  text-align: left;
  background: rgba(255, 255, 255, 0.06);
  color: inherit;
}

.sidebar__nav--active {
  background: #c35b32;
}

.sidebar__logout {
  margin-top: auto;
}

.content {
  padding: 28px;
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  padding: 28px;
  border-radius: 28px;
  background: rgba(255, 251, 247, 0.92);
}

.hero__desc {
  margin-top: 10px;
  color: #5b6477;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 140px);
  gap: 14px;
}

.stat-card {
  padding: 18px;
  border-radius: 20px;
  background: #fff;
}

.stat-card span {
  display: block;
  margin-bottom: 12px;
  color: #677086;
}

.stat-card strong {
  font-size: 28px;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 20px;
  align-items: start;
}

.main-column,
.detail-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel {
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 251, 247, 0.92);
}

.panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 14px 10px;
  border-bottom: 1px solid rgba(23, 32, 51, 0.08);
  text-align: left;
  vertical-align: top;
}

.action-cell {
  display: flex;
  gap: 8px;
}

.pill,
.tag-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  margin-right: 8px;
  border-radius: 999px;
  background: #ece3dc;
  color: #5b6477;
  font-size: 12px;
}

.pill--done {
  background: #dff2e8;
  color: #1e7b53;
}

.pill--danger {
  background: #f6dddb;
  color: #b93a2f;
}

.report-card,
.questionnaire-card,
.rule-card,
.detail-card {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 18px;
  border-radius: 20px;
  background: #fff;
}

.report-card + .report-card,
.questionnaire-card + .questionnaire-card {
  margin-top: 16px;
}

.report-card__content {
  flex: 1;
}

.report-card__meta,
.rule-card__meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.report-card__actions {
  display: flex;
  gap: 8px;
}

.ghost-button {
  padding: 10px 14px;
  background: #182132;
  color: #fff;
}

.ghost-button[disabled] {
  cursor: not-allowed;
  opacity: 0.45;
}

.rule-create {
  display: flex;
  gap: 14px;
  margin-bottom: 18px;
}

.rule-create input {
  flex: 1;
}

.rule-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.rule-card,
.questionnaire-card {
  align-items: center;
}

.report-note {
  width: 220px;
  min-height: 90px;
  padding: 10px 12px;
  resize: vertical;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.detail-card,
.empty-detail {
  flex-direction: column;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

.log-item {
  padding: 12px 14px;
  border-radius: 14px;
  background: #f6f2ed;
}

.log-item__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #4f5666;
}
</style>
