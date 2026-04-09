<script setup lang="ts">
import { onUnmounted, reactive, ref } from 'vue'

import AppShell from '@/components/AppShell.vue'
import { onboardingApi } from '@/services/onboarding'

const form = reactive({
  email: '',
  emailCode: '',
  password: '',
  confirmPassword: '',
})

const sending = ref(false)
const countdown = ref(0)
const submitting = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const normalizeEmail = (value: string) => value.replace(/\s+/g, '').toLowerCase()
const normalizeCode = (value: string) => value.replace(/\D/g, '').slice(0, 6)
const sanitizePasswordInput = (value: string) => value.replace(/\s+/g, '').slice(0, 32)

const showError = (message: string) => {
  uni.showToast({ title: message, icon: 'none', duration: 2200 })
}

const startCountdown = () => {
  if (timer) clearInterval(timer)
  countdown.value = 60
  timer = setInterval(() => {
    if (countdown.value <= 1) {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      countdown.value = 0
      return
    }
    countdown.value -= 1
  }, 1000)
}

const validate = () => {
  if (!form.email.trim()) return '请先输入校园邮箱'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return '请输入正确的校园邮箱'
  if (!form.emailCode.trim()) return '请填写邮箱验证码'
  if (!/^\d{6}$/.test(form.emailCode.trim())) return '邮箱验证码应为 6 位数字'
  if (!form.password.trim()) return '请设置新密码'
  if (form.password.trim().length < 6) return '密码至少需要 6 位'
  if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(form.password.trim())) return '密码需同时包含字母和数字'
  if (!form.confirmPassword.trim()) return '请再次输入新密码'
  if (form.password.trim() !== form.confirmPassword.trim()) return '两次输入的密码不一致'
  return ''
}

const sendEmailCode = async () => {
  if (!form.email.trim()) {
    showError('请先输入校园邮箱')
    return
  }

  if (sending.value || countdown.value > 0) return

  sending.value = true
  try {
    await onboardingApi.sendEmailCode({
      email: normalizeEmail(form.email),
      scene: 'RESET_PASSWORD',
    })
    startCountdown()
    uni.showToast({ title: '验证码已发送，请查收邮箱', icon: 'none', duration: 2200 })
  } catch (error) {
    showError(error instanceof Error && error.message ? error.message : '验证码发送失败')
  } finally {
    sending.value = false
  }
}

const submit = async () => {
  const errorMessage = validate()
  if (errorMessage) {
    showError(errorMessage)
    return
  }

  submitting.value = true
  try {
    await onboardingApi.resetPassword({
      email: normalizeEmail(form.email),
      emailCode: form.emailCode.trim(),
      password: form.password.trim(),
    })
    uni.showToast({ title: '密码已重置，请重新登录', icon: 'success', duration: 1800 })
    setTimeout(() => {
      uni.reLaunch({ url: `/pages/login/index?account=${encodeURIComponent(normalizeEmail(form.email))}` })
    }, 400)
  } catch (error) {
    showError(error instanceof Error && error.message ? error.message : '密码重置失败')
  } finally {
    submitting.value = false
  }
}

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <AppShell
    eyebrow="Account"
    title="找回密码"
    subtitle="通过校园邮箱验证码重置密码。验证码 5 分钟内有效，重置成功后请重新登录。"
  >
    <view class="card">
      <view class="field">
        <text class="field__label">校园邮箱</text>
        <input
          :value="form.email"
          class="field__input"
          placeholder="name@mail.dlut.edu.cn"
          @input="form.email = normalizeEmail(($event as any)?.detail?.value ?? '')"
        />
      </view>

      <view class="field">
        <text class="field__label">邮箱验证码</text>
        <view class="field__inline">
          <input
            :value="form.emailCode"
            class="field__input field__input--inline"
            maxlength="6"
            placeholder="输入 6 位验证码"
            @input="form.emailCode = normalizeCode(($event as any)?.detail?.value ?? '')"
          />
          <button class="field__action" :disabled="sending || countdown > 0" @tap="sendEmailCode">
            {{ sending ? '发送中...' : countdown > 0 ? `${countdown}s` : '发送验证码' }}
          </button>
        </view>
      </view>

      <view class="field">
        <text class="field__label">新密码</text>
        <view class="field__inline">
          <input
            :value="form.password"
            class="field__input field__input--inline"
            :password="!showPassword"
            placeholder="至少 6 位，需包含字母和数字"
            @input="form.password = sanitizePasswordInput(($event as any)?.detail?.value ?? '')"
          />
          <button class="field__toggle" @tap="showPassword = !showPassword">
            {{ showPassword ? '隐藏' : '显示' }}
          </button>
        </view>
      </view>

      <view class="field">
        <text class="field__label">确认新密码</text>
        <view class="field__inline">
          <input
            :value="form.confirmPassword"
            class="field__input field__input--inline"
            :password="!showConfirmPassword"
            placeholder="再次输入新密码"
            @input="form.confirmPassword = sanitizePasswordInput(($event as any)?.detail?.value ?? '')"
          />
          <button class="field__toggle" @tap="showConfirmPassword = !showConfirmPassword">
            {{ showConfirmPassword ? '隐藏' : '显示' }}
          </button>
        </view>
      </view>
    </view>

    <button class="submit" :disabled="submitting" @tap="submit">
      {{ submitting ? '提交中...' : '确认重置密码' }}
    </button>
  </AppShell>
</template>

<style lang="scss" scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 30rpx;
  border-radius: 30rpx;
  background: var(--cm-surface);
  border: 1rpx solid var(--cm-border);
  box-shadow: var(--cm-shadow);
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

.field__inline {
  display: flex;
  gap: 14rpx;
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

.field__input--inline {
  flex: 1;
}

.field__action,
.field__toggle,
.submit {
  height: 92rpx;
  border-radius: 22rpx;
  font-size: 24rpx;
  line-height: 92rpx;
}

.field__action,
.field__toggle {
  min-width: 148rpx;
  background: rgba(255, 255, 255, 0.04);
  color: var(--cm-text);
  border: 1rpx solid var(--cm-border);
}

.submit {
  background: var(--cm-accent);
  color: #fff;
  font-size: 28rpx;
}

.field__action::after,
.field__toggle::after,
.submit::after {
  border: none;
}
</style>
