<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'

import { useAuthStore } from '@/stores/auth'
import { useOnboardingStore } from '@/stores/onboarding'

const PUBLIC_ROUTES = new Set([
  'pages/login/index',
  'pages/onboarding/register/index',
  'pages/auth/forgot-password/index',
])

const guardAuthRoute = () => {
  const authStore = useAuthStore()
  const pages = getCurrentPages()
  const currentRoute = pages[pages.length - 1]?.route
  if (!currentRoute || PUBLIC_ROUTES.has(currentRoute)) {
    return
  }

  if (!authStore.isLoggedIn) {
    uni.reLaunch({
      url: '/pages/login/index',
    })
  }
}

onLaunch(() => {
  const authStore = useAuthStore()
  const onboardingStore = useOnboardingStore()
  authStore.bootstrap()
  onboardingStore.bootstrap()
  guardAuthRoute()
})

onShow(() => {
  guardAuthRoute()
})
</script>

<style lang="scss">
@import '@climblee/uv-ui/index.scss';

:root {
  --cm-bg: #0f1115;
  --cm-surface: #171b22;
  --cm-surface-muted: #1d222b;
  --cm-border: rgba(255, 255, 255, 0.08);
  --cm-text: #f3f4f6;
  --cm-text-soft: #a8b0bd;
  --cm-accent: #e85d75;
  --cm-accent-strong: #c94b61;
  --cm-ink: #8da1b8;
  --cm-sage: #70816f;
  --cm-success: #4db089;
  --cm-danger: #d76a76;
  --cm-radius-lg: 32rpx;
  --cm-radius-md: 22rpx;
  --cm-shadow: 0 20rpx 54rpx rgba(0, 0, 0, 0.28);
}

page {
  min-height: 100%;
  background:
    radial-gradient(circle at top left, rgba(232, 93, 117, 0.12), transparent 24%),
    radial-gradient(circle at top right, rgba(77, 163, 255, 0.09), transparent 20%),
    linear-gradient(180deg, #0d1014 0%, #10131a 38%, #0e1117 100%);
  color: var(--cm-text);
  font-family: 'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
}

view,
text,
button,
input,
textarea,
scroll-view,
swiper,
navigator {
  box-sizing: border-box;
}

button {
  margin: 0;
}
</style>
