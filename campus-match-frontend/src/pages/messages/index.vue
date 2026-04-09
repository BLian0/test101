<script setup lang="ts">
import { computed, ref } from 'vue'
import { onHide, onShow, onUnload } from '@dcloudio/uni-app'

import AppShell from '@/components/AppShell.vue'
import ConversationListItem from '@/components/ConversationListItem.vue'
import { onboardingApi } from '@/services/onboarding'
import { connectRealtime, subscribeChatUpdates } from '@/services/realtime'
import { useAuthStore } from '@/stores/auth'
import { useFeedStore } from '@/stores/feed'
import { buildMessagePreview } from '@/utils/match-catalog'

const authStore = useAuthStore()
const feedStore = useFeedStore()

const loading = ref(false)
let unsubscribeRealtime: (() => void) | null = null

const pendingList = computed(() =>
  feedStore.previews.filter(item => item.state === 'WAITING_FIRST_MESSAGE' || item.state === 'WAITING_REPLY'),
)
const activeList = computed(() => feedStore.previews.filter(item => item.state === 'MUTUAL_CHAT'))

const loadConnections = async () => {
  try {
    loading.value = true
    const response = await onboardingApi.getConnections()
    feedStore.setPreviews(response.items.map(item => buildMessagePreview(item)))
  } catch {
    uni.showToast({ title: '消息加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const openChat = (connectionId: number) => {
  feedStore.markPreviewRead(connectionId)
  uni.navigateTo({
    url: `/pages/chat/detail/index?connectionId=${connectionId}`,
  })
}

const openProfile = (targetUserId: number) => {
  uni.navigateTo({
    url: `/pages/profile/detail/index?profileId=${targetUserId}`,
  })
}

const goDiscover = () => {
  uni.switchTab({ url: '/pages/home/index' })
}

onShow(async () => {
  if (!authStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' })
    return
  }

  connectRealtime()
  if (!unsubscribeRealtime) {
    unsubscribeRealtime = subscribeChatUpdates(async () => {
      await loadConnections()
    })
  }

  await loadConnections()
})

onHide(() => {
  if (unsubscribeRealtime) {
    unsubscribeRealtime()
    unsubscribeRealtime = null
  }
})

onUnload(() => {
  if (unsubscribeRealtime) {
    unsubscribeRealtime()
    unsubscribeRealtime = null
  }
})
</script>

<template>
  <AppShell
    eyebrow="Messages"
    title="连接与聊天"
    subtitle="先处理刚建立的连接，再回到已经聊起来的人。"
  >
    <view class="search-placeholder">
      <text class="search-placeholder__icon">⌕</text>
      <text class="search-placeholder__text">搜索名字或连接状态</text>
    </view>

    <view v-if="loading" class="state-card">
      <text class="state-card__title">正在整理你的会话</text>
      <text class="state-card__desc">优先把需要你先处理的连接放在前面。</text>
    </view>

    <template v-else>
      <view v-if="pendingList.length" class="section">
        <text class="section__title">还在建立节奏</text>
        <ConversationListItem
          v-for="item in pendingList"
          :key="item.id"
          :preview="item"
          @open-chat="openChat"
          @open-profile="openProfile"
        />
      </view>

      <view v-if="activeList.length" class="section">
        <text class="section__title">已经开始聊天</text>
        <ConversationListItem
          v-for="item in activeList"
          :key="item.id"
          :preview="item"
          @open-chat="openChat"
          @open-profile="openProfile"
        />
      </view>

      <view v-if="!feedStore.previews.length" class="state-card">
        <text class="state-card__title">你还没有正在进行的连接</text>
        <text class="state-card__desc">先去发现页看看资料，再决定要不要认真点开一个人。</text>
        <button class="state-card__button" @tap="goDiscover">回到发现页</button>
      </view>
    </template>
  </AppShell>
</template>

<style lang="scss" scoped>
.search-placeholder,
.state-card,
.section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.search-placeholder {
  flex-direction: row;
  align-items: center;
  padding: 22rpx 24rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid var(--cm-border);
}

.search-placeholder__icon {
  font-size: 26rpx;
  color: var(--cm-text-soft);
}

.search-placeholder__text,
.state-card__desc {
  font-size: 25rpx;
  color: var(--cm-text-soft);
}

.state-card {
  padding: 28rpx;
  border-radius: 30rpx;
  background: var(--cm-surface);
  border: 1rpx solid var(--cm-border);
  box-shadow: var(--cm-shadow);
}

.state-card__title,
.section__title {
  font-size: 32rpx;
  line-height: 1.4;
  font-weight: 700;
  color: var(--cm-text);
}

.state-card__button {
  margin-top: 4rpx;
  height: 82rpx;
  line-height: 82rpx;
  padding: 0 28rpx;
  border-radius: 22rpx;
  background: var(--cm-accent);
  color: #fff;
  font-size: 26rpx;
}

.state-card__button::after {
  border: none;
}
</style>
