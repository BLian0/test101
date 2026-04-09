<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'

import AppShell from '@/components/AppShell.vue'
import { onboardingApi } from '@/services/onboarding'
import { useAuthStore } from '@/stores/auth'
import { useOnboardingStore } from '@/stores/onboarding'

const authStore = useAuthStore()
const onboardingStore = useOnboardingStore()
const allowedSuffixes = ref<string[]>([])
const emailSending = ref(false)
const emailCountdown = ref(0)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

let emailTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  username: onboardingStore.registerDraft.username,
  email: onboardingStore.registerDraft.email,
  emailCode: onboardingStore.registerDraft.emailCode,
  password: onboardingStore.registerDraft.password,
  confirmPassword: onboardingStore.registerDraft.confirmPassword,
})

const showError = (message: string) => {
  uni.showToast({ title: message, icon: 'none', duration: 2200 })
}

const normalizeEmail = (value: string) => value.trim().toLowerCase()
const sanitizeUsernameInput = (value: string) => value.replace(/[^A-Za-z0-9_]/g, '').toLowerCase().slice(0, 24)
const sanitizeEmailInput = (value: string) => value.replace(/\s+/g, '').toLowerCase()
const sanitizeCodeInput = (value: string) => value.replace(/\D/g, '').slice(0, 6)
const sanitizePasswordInput = (value: string) => value.replace(/\s+/g, '').slice(0, 32)
const getInputValue = (event: any) => String(event?.detail?.value ?? event?.target?.value ?? '')

const isAllowedSchoolEmail = (email: string) =>
  allowedSuffixes.value.some(suffix => normalizeEmail(email).endsWith(`@${suffix}`))

const startEmailCountdown = () => {
  if (emailTimer) clearInterval(emailTimer)
  emailCountdown.value = 60
  emailTimer = setInterval(() => {
    if (emailCountdown.value <= 1) {
      if (emailTimer) {
        clearInterval(emailTimer)
        emailTimer = null
      }
      emailCountdown.value = 0
      return
    }
    emailCountdown.value -= 1
  }, 1000)
}

const validateUsername = () => {
  if (!form.username.trim()) return '请先设置用户名'
  if (form.username.trim().length < 3) return '用户名至少需要 3 位'
  if (!/^[A-Za-z0-9_]+$/.test(form.username.trim())) {
    return '用户名仅支持英文字母、数字和下划线'
  }
  return ''
}

const validateBeforeSendEmailCode = () => {
  const usernameError = validateUsername()
  if (usernameError) return usernameError
  if (!form.email.trim()) return '请先输入校园邮箱'
  if (!isAllowedSchoolEmail(form.email)) return '请填写允许的校园邮箱后缀'
  return ''
}

const validateRegisterForm = () => {
  const usernameError = validateUsername()
  if (usernameError) return usernameError
  if (!form.email.trim()) return '请填写校园邮箱'
  if (!isAllowedSchoolEmail(form.email)) return '请填写允许的校园邮箱后缀'
  if (!/^\d{6}$/.test(form.emailCode.trim())) return '邮箱验证码应为 6 位数字'
  if (!form.password.trim()) return '请设置登录密码'
  if (form.password.trim().length < 6) return '密码至少需要 6 位'
  if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(form.password.trim())) return '密码需同时包含字母和数字'
  if (!form.confirmPassword.trim()) return '请再次输入密码'
  if (form.password.trim() !== form.confirmPassword.trim()) return '两次输入的密码不一致'
  return ''
}

const handleUsernameInput = (event: any) => {
  form.username = sanitizeUsernameInput(getInputValue(event))
}

const handleEmailInput = (event: any) => {
  form.email = sanitizeEmailInput(getInputValue(event))
}

const handleEmailCodeInput = (event: any) => {
  form.emailCode = sanitizeCodeInput(getInputValue(event))
}

const handlePasswordInput = (event: any) => {
  form.password = sanitizePasswordInput(getInputValue(event))
}

const handleConfirmPasswordInput = (event: any) => {
  form.confirmPassword = sanitizePasswordInput(getInputValue(event))
}

const sendEmailCode = async () => {
  const validationMessage = validateBeforeSendEmailCode()
  if (validationMessage) {
    showError(validationMessage)
    return
  }

  if (emailSending.value || emailCountdown.value > 0) {
    return
  }

  emailSending.value = true
  try {
    await onboardingApi.sendEmailCode({
      email: normalizeEmail(form.email),
      scene: 'REGISTER',
    })
    startEmailCountdown()
    uni.showToast({ title: '验证码已发送，请查收邮箱', icon: 'none', duration: 2200 })
  } catch (error) {
    showError(error instanceof Error && error.message ? error.message : '邮箱验证码发送失败')
  } finally {
    emailSending.value = false
  }
}

const submit = async () => {
  const validationMessage = validateRegisterForm()
  if (validationMessage) {
    showError(validationMessage)
    return
  }

  try {
    const result = await onboardingApi.register({
      username: form.username.trim(),
      email: normalizeEmail(form.email),
      emailCode: form.emailCode.trim(),
      password: form.password.trim(),
    })

    onboardingStore.saveRegisterDraft({
      username: form.username.trim(),
      email: normalizeEmail(form.email),
      emailCode: form.emailCode.trim(),
      password: form.password.trim(),
      confirmPassword: form.confirmPassword.trim(),
    })

    authStore.setToken(result.accessToken)
    uni.navigateTo({ url: '/pages/onboarding/basic-profile/index' })
  } catch (error) {
    showError(error instanceof Error && error.message ? error.message : '注册失败，请检查输入')
  }
}

onMounted(async () => {
  try {
    allowedSuffixes.value = await onboardingApi.getSchoolRules()
  } catch {
    allowedSuffixes.value = ['mail.dlut.edu.cn', 'dlut.edu.cn']
  }
})

onUnmounted(() => {
  if (emailTimer) {
    clearInterval(emailTimer)
    emailTimer = null
  }
})
</script>

<template>
  <AppShell
    eyebrow="Step 1"
    title="注册与认证"
    subtitle="注册阶段先完成校园邮箱认证。当前填写的是登录账号，个人昵称会在下一步资料页设置，注册后仍可修改一次。"
  >
    <view class="note">
      用户名仅支持英文字母、数字和下划线。邮箱验证码以实际收到的邮件为准，10 分钟内有效。
    </view>

    <view class="form-card">
      <view class="field">
        <text class="field__label">用户名</text>
        <input
          :value="form.username"
          class="field__input"
          placeholder="3-24 位，仅支持字母、数字和下划线"
          maxlength="24"
          @input="handleUsernameInput"
        />
      </view>

      <view class="field">
        <text class="field__label">校园邮箱</text>
        <input
          :value="form.email"
          class="field__input"
          placeholder="name@mail.dlut.edu.cn"
          maxlength="128"
          @input="handleEmailInput"
        />
      </view>

      <view class="field">
        <text class="field__label">邮箱验证码</text>
        <view class="field__inline">
          <input
            :value="form.emailCode"
            class="field__input field__input--inline"
            placeholder="输入 6 位数字验证码"
            maxlength="6"
            @input="handleEmailCodeInput"
          />
          <button
            class="field__action"
            :disabled="emailSending || emailCountdown > 0"
            @tap="sendEmailCode"
          >
            {{ emailSending ? '发送中...' : emailCountdown > 0 ? `${emailCountdown}s` : '发送验证码' }}
          </button>
        </view>
      </view>

      <view class="field">
        <text class="field__label">登录密码</text>
        <view class="field__password">
          <input
            :value="form.password"
            class="field__input field__input--password"
            :password="!showPassword"
            placeholder="至少 6 位，且包含字母和数字"
            maxlength="32"
            @input="handlePasswordInput"
          />
          <button class="field__toggle" @tap="showPassword = !showPassword">
            {{ showPassword ? '隐藏' : '显示' }}
          </button>
        </view>
      </view>

      <view class="field">
        <text class="field__label">确认密码</text>
        <view class="field__password">
          <input
            :value="form.confirmPassword"
            class="field__input field__input--password"
            :password="!showConfirmPassword"
            placeholder="再次输入密码"
            maxlength="32"
            @input="handleConfirmPasswordInput"
          />
          <button class="field__toggle" @tap="showConfirmPassword = !showConfirmPassword">
            {{ showConfirmPassword ? '隐藏' : '显示' }}
          </button>
        </view>
      </view>
    </view>

    <button class="submit" @tap="submit">保存注册信息并继续</button>
  </AppShell>
</template>

<style lang="scss" scoped>
.note,
.form-card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: var(--cm-surface);
  border: 1rpx solid var(--cm-border);
}

.note {
  color: var(--cm-text-soft);
  font-size: 24rpx;
  line-height: 1.6;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.field__label {
  font-size: 24rpx;
  color: var(--cm-text-soft);
}

.field__input {
  height: 92rpx;
  padding: 0 24rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.04);
  color: var(--cm-text);
  font-size: 28rpx;
  border: 1rpx solid var(--cm-border);
}

.field__inline,
.field__password {
  display: flex;
  gap: 14rpx;
}

.field__input--inline,
.field__input--password {
  flex: 1;
}

.field__action,
.field__toggle {
  min-width: 148rpx;
  height: 92rpx;
  border-radius: 22rpx;
  font-size: 24rpx;
  line-height: 92rpx;
}

.field__action {
  background: rgba(232, 93, 117, 0.12);
  color: var(--cm-text);
  border: 1rpx solid rgba(232, 93, 117, 0.3);
}

.field__toggle {
  background: rgba(255, 255, 255, 0.04);
  color: var(--cm-text-soft);
  border: 1rpx solid var(--cm-border);
}

.field__action::after,
.field__toggle::after,
.submit::after {
  border: none;
}

.submit {
  border-radius: 24rpx;
  background: var(--cm-accent);
  font-size: 28rpx;
  color: #fff;
}
</style>
