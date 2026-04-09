<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

import AppShell from '@/components/AppShell.vue'
import UserCard from '@/components/UserCard.vue'
import { onboardingApi } from '@/services/onboarding'
import { useAuthStore } from '@/stores/auth'
import { useFeedStore } from '@/stores/feed'
import { useOnboardingStore } from '@/stores/onboarding'
import { buildMatchProfile } from '@/utils/match-catalog'

const authStore = useAuthStore()
const onboardingStore = useOnboardingStore()
const feedStore = useFeedStore()

const loading = ref(false)
const actioning = ref(false)

const topProfile = computed(() => feedStore.profiles[0] ?? null)
const isIncomplete = computed(() => !onboardingStore.isFullyReady)

const loadRecommendations = async () => {
  if (isIncomplete.value) return

  try {
    loading.value = true
    const response = await onboardingApi.getRecommendations()
    feedStore.setProfiles(
      response.items
        .map(item => buildMatchProfile(item))
        .filter(profile => profile.actionState !== 'PASS'),
    )
  } catch {
    uni.showToast({ title: '推荐加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const openProfileDetail = (profileId: number) => {
  uni.navigateTo({
    url: `/pages/profile/detail/index?profileId=${profileId}`,
  })
}

const openOnboarding = () => {
  uni.navigateTo({ url: onboardingStore.getNextRoute() })
}

const handlePass = async (profileId: number) => {
  if (actioning.value) return

  try {
    actioning.value = true
    await onboardingApi.passRecommendation(profileId)
    feedStore.removeProfile(profileId)
    uni.showToast({ title: '已从当前推荐中移除', icon: 'none' })
  } catch {
    uni.showToast({ title: '操作失败', icon: 'none' })
  } finally {
    actioning.value = false
  }
}

onShow(async () => {
  if (!authStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' })
    return
  }

  try {
    const currentUser = await onboardingApi.getCurrentUser()
    onboardingStore.syncFromCurrentUser(currentUser)
  } catch {
    authStore.clearToken()
    uni.reLaunch({ url: '/pages/login/index' })
    return
  }

  await loadRecommendations()
})
</script>

<template>
  <AppShell
    eyebrow="Discover"
    title="今天先看这一位"
    subtitle="首页只做初筛。真正的决定，留到详情页。"
  >
    <view v-if="isIncomplete" class="state-card">
      <text class="state-card__title">先把资料和问卷补完整</text>
      <text class="state-card__desc">
        这不是一个直接刷脸的流。完成资料和问卷后，系统才会给你更稳定的推荐。
      </text>
      <button class="state-card__button" @tap="openOnboarding">继续完善</button>
    </view>

    <view v-else-if="loading" class="state-card">
      <text class="state-card__title">正在整理推荐</text>
      <text class="state-card__desc">优先展示和你节奏更接近、资料更完整的人。</text>
    </view>

    <template v-else-if="topProfile">
      <view class="lead-copy">
        <text class="lead-copy__title">先看感觉，再决定要不要认真了解。</text>
        <text class="lead-copy__desc">如果这张卡让你想继续看，点进详情页再做判断。</text>
      </view>

      <UserCard
        :profile="topProfile"
        :loading="actioning"
        @view="openProfileDetail"
        @pass="handlePass"
      />
    </template>

    <view v-else class="state-card">
      <text class="state-card__title">暂时没有新的推荐</text>
      <text class="state-card__desc">
        可以回去调整资料或问卷，或者稍后再看。资料更完整时，推荐通常也会更准。
      </text>
      <button class="state-card__button state-card__button--secondary" @tap="openOnboarding">
        查看问卷
      </button>
    </view>
  </AppShell>
</template>

<style lang="scss" scoped>
.lead-copy,
.state-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.lead-copy {
  padding: 6rpx 6rpx 0;
}

.lead-copy__title,
.state-card__title {
  font-size: 32rpx;
  line-height: 1.4;
  font-weight: 700;
  color: var(--cm-text);
}

.lead-copy__desc,
.state-card__desc {
  font-size: 25rpx;
  line-height: 1.7;
  color: var(--cm-text-soft);
}

.state-card {
  padding: 30rpx;
  border-radius: 32rpx;
  background: var(--cm-surface);
  border: 1rpx solid var(--cm-border);
  box-shadow: var(--cm-shadow);
}

.state-card__button {
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 24rpx;
  background: var(--cm-accent);
  color: #fff;
  font-size: 28rpx;
}

.state-card__button--secondary {
  background: var(--cm-surface-muted);
  color: var(--cm-text);
}

.state-card__button::after {
  border: none;
}
</style>
