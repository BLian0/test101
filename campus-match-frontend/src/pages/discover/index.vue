<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

import AppShell from '@/components/AppShell.vue'
import BottomActionBar from '@/components/BottomActionBar.vue'
import DetailHero from '@/components/DetailHero.vue'
import { useFeedStore } from '@/stores/feed'

const feedStore = useFeedStore()
const profileId = ref(0)
const connectionId = ref(0)

const profile = computed(() => feedStore.getProfileById(profileId.value))

const goChat = () => {
  if (!connectionId.value) return
  uni.redirectTo({
    url: `/pages/chat/detail/index?connectionId=${connectionId.value}`,
  })
}

const goDetail = () => {
  if (!profileId.value) return
  uni.redirectTo({
    url: `/pages/profile/detail/index?profileId=${profileId.value}`,
  })
}

const continueBrowse = () => {
  uni.switchTab({ url: '/pages/home/index' })
}

onLoad(options => {
  profileId.value = Number(options?.profileId ?? 0)
  connectionId.value = Number(options?.connectionId ?? 0)
})
</script>

<template>
  <AppShell
    eyebrow="Connected"
    title="连接已经建立"
    subtitle="别急着随便开口，先决定你想怎么开始。"
    compact
  >
    <view v-if="profile" class="feedback">
      <DetailHero :profile="profile" compact />

      <view class="feedback__panel">
        <text class="feedback__title">现在有两个自然的动作</text>
        <view class="feedback__options">
          <view class="feedback__option">
            <text class="feedback__option-title">去聊天</text>
            <text class="feedback__option-desc">直接进入对话页，发出第一条真正有内容的消息。</text>
          </view>
          <view class="feedback__option">
            <text class="feedback__option-title">再看一遍资料</text>
            <text class="feedback__option-desc">如果你还没想好怎么开场，先回到资料页再看一遍也没问题。</text>
          </view>
        </view>
      </view>

      <BottomActionBar
        primary-text="去聊天"
        secondary-text="查看完整资料"
        @primary="goChat"
        @secondary="goDetail"
      />

      <button class="feedback__ghost" @tap="continueBrowse">继续看推荐</button>
    </view>
  </AppShell>
</template>

<style lang="scss" scoped>
.feedback {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.feedback__panel {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 26rpx;
  border-radius: 30rpx;
  background: var(--cm-surface);
  border: 1rpx solid var(--cm-border);
}

.feedback__title,
.feedback__option-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--cm-text);
}

.feedback__options {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.feedback__option {
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.03);
}

.feedback__option-desc {
  margin-top: 6rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--cm-text-soft);
}

.feedback__ghost {
  height: 78rpx;
  line-height: 78rpx;
  border-radius: 22rpx;
  background: transparent;
  color: var(--cm-text-soft);
  font-size: 24rpx;
  border: 1rpx solid var(--cm-border);
}

.feedback__ghost::after {
  border: none;
}
</style>
