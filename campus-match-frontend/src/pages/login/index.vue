<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

import { onboardingApi } from '@/services/onboarding'
import { useAuthStore } from '@/stores/auth'
import { useOnboardingStore } from '@/stores/onboarding'

const authStore = useAuthStore()
const onboardingStore = useOnboardingStore()

const submitting = ref(false)
const errorText = ref('')
const showPassword = ref(false)

const form = reactive({
  account: '',
  password: '',
})

const canSubmit = computed(() => Boolean(form.account.trim() && form.password.trim()))

const hydrateAndRedirect = async () => {
  const currentUser = await onboardingApi.getCurrentUser()
  onboardingStore.syncFromCurrentUser(currentUser)

  const next = onboardingStore.getNextRoute()
  if (next === '/pages/home/index') {
    uni.switchTab({ url: next })
    return
  }

  uni.reLaunch({ url: next })
}

const goRegister = () => {
  uni.navigateTo({
    url: '/pages/onboarding/register/index',
  })
}

const goForgotPassword = () => {
  uni.navigateTo({
    url: '/pages/auth/forgot-password/index',
  })
}

const sanitizeAccountInput = (value: string) => value.replace(/\s+/g, '')
const handleAccountInput = (event: any) => {
  form.account = sanitizeAccountInput(String(event?.detail?.value ?? event?.target?.value ?? ''))
}
const sanitizePasswordInput = (value: string) => value.replace(/\s+/g, '').slice(0, 32)
const handlePasswordInput = (event: any) => {
  form.password = sanitizePasswordInput(String(event?.detail?.value ?? event?.target?.value ?? ''))
}

const submitLogin = async () => {
  if (!canSubmit.value || submitting.value) {
    return
  }

  submitting.value = true
  errorText.value = ''

  try {
    const response = await onboardingApi.loginByEmail({
      email: form.account.trim(),
      password: form.password.trim(),
    })

    authStore.setToken(response.accessToken)
    await hydrateAndRedirect()
  } catch (error) {
    const rawMessage = error instanceof Error && error.message ? error.message : ''
    errorText.value =
      rawMessage === 'AUTH_INVALID_CREDENTIALS' || rawMessage.includes('账号') || rawMessage.includes('密码')
        ? '用户名或密码错误'
        : '登录失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

onShow(async () => {
  if (!authStore.isLoggedIn) return
  try {
    await hydrateAndRedirect()
  } catch {
    authStore.clearToken()
  }
})

onLoad(options => {
  const nextAccount = String(options?.account ?? '').trim()
  if (nextAccount) {
    form.account = sanitizeAccountInput(decodeURIComponent(nextAccount))
  }
})
</script>

<template>
  <view class="login">
    <view class="login__hero">
      <text class="login__eyebrow">Campus Match</text>
      <text class="login__title">登录后继续你的校园匹配流程</text>
      <text class="login__subtitle">
        支持用户名或校园邮箱登录。未登录状态下访问任意用户页，会自动回到这里。
      </text>
    </view>

    <view class="login__panel">
      <view class="login__form">
        <view class="login__field">
          <text class="login__label">用户名 / 校园邮箱</text>
          <input
            :value="form.account"
            class="login__input"
            maxlength="128"
            placeholder="输入用户名、邮箱前缀或完整校园邮箱"
            placeholder-class="login__placeholder"
            @input="handleAccountInput"
          />
        </view>

        <view class="login__field">
          <text class="login__label">密码</text>
          <view class="login__password">
            <input
              :value="form.password"
              class="login__input login__input--password"
              :password="!showPassword"
              maxlength="32"
              placeholder="输入登录密码"
              placeholder-class="login__placeholder"
              @input="handlePasswordInput"
            />
            <button class="login__toggle" @tap="showPassword = !showPassword">
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </view>
        </view>
      </view>

      <text v-if="errorText" class="login__error">{{ errorText }}</text>

      <button
        class="login__primary"
        :class="{ 'login__primary--disabled': !canSubmit || submitting }"
        :disabled="!canSubmit || submitting"
        @tap="submitLogin"
      >
        {{ submitting ? '登录中...' : '登录并继续' }}
      </button>

      <view class="login__links">
        <button class="login__link" @tap="goRegister">去注册</button>
        <button class="login__link" @tap="goForgotPassword">找回密码</button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  justify-content: space-between;
  padding: 80rpx 32rpx calc(48rpx + env(safe-area-inset-bottom));
}

.login__hero {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  padding-top: 44rpx;
}

.login__eyebrow {
  font-size: 22rpx;
  letter-spacing: 6rpx;
  color: var(--cm-accent);
  text-transform: uppercase;
}

.login__title {
  font-size: 68rpx;
  line-height: 1.12;
  font-weight: 700;
  color: var(--cm-text);
}

.login__subtitle {
  font-size: 28rpx;
  line-height: 1.7;
  color: var(--cm-text-soft);
}

.login__panel {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 30rpx;
  border-radius: 34rpx;
  background: var(--cm-surface);
  border: 1rpx solid var(--cm-border);
  box-shadow: var(--cm-shadow);
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.login__field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.login__label {
  font-size: 24rpx;
  color: var(--cm-text-soft);
}

.login__input {
  height: 92rpx;
  padding: 0 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid var(--cm-border);
  color: var(--cm-text);
  font-size: 28rpx;
}

.login__password {
  display: flex;
  gap: 14rpx;
}

.login__input--password {
  flex: 1;
}

.login__toggle {
  min-width: 132rpx;
  height: 92rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.04);
  color: var(--cm-text-soft);
  border: 1rpx solid var(--cm-border);
  font-size: 24rpx;
  line-height: 92rpx;
}

.login__placeholder {
  color: rgba(243, 244, 246, 0.34);
}

.login__error {
  font-size: 24rpx;
  color: #ff8f98;
}

.login__primary {
  height: 92rpx;
  border-radius: 24rpx;
  font-size: 30rpx;
  line-height: 92rpx;
  background: var(--cm-accent);
  color: #fff;
}

.login__primary--disabled {
  opacity: 0.55;
}

.login__links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.login__link {
  height: 82rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.04);
  color: var(--cm-text);
  border: 1rpx solid var(--cm-border);
  font-size: 26rpx;
  line-height: 82rpx;
}

.login__primary::after,
.login__link::after,
.login__toggle::after {
  border: none;
}
</style>
