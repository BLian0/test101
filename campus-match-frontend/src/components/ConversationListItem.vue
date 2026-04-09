<script setup lang="ts">
import type { MessagePreview } from '@/types/models'
import { getToneColor } from '@/utils/match-catalog'

defineProps<{
  preview: MessagePreview
}>()

const emit = defineEmits<{
  openProfile: [userId: number]
  openChat: [connectionId: number]
}>()

const formatTime = (value: string) => {
  const date = new Date(value)
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${hours}:${minutes}`
}
</script>

<template>
  <view class="conversation">
    <view class="conversation__identity" @tap.stop="emit('openProfile', preview.targetUserId)">
      <view class="conversation__avatar" :style="{ background: getToneColor(preview.accent) }">
        <text>{{ preview.name.slice(0, 1) }}</text>
      </view>
      <view class="conversation__profile-copy">
        <view class="conversation__name-row">
          <text class="conversation__name">{{ preview.name }}</text>
          <text class="conversation__time">{{ formatTime(preview.updatedAt) }}</text>
        </view>
        <text class="conversation__meta">{{ preview.school }} · {{ preview.gradeLabel }}</text>
      </view>
    </view>

    <view class="conversation__chat" @tap="emit('openChat', preview.id)">
      <view class="conversation__state-row">
        <text class="conversation__state">{{ preview.stateLabel }}</text>
        <text v-if="preview.unread" class="conversation__unread">{{ preview.unread }}</text>
      </view>
      <text class="conversation__snippet" :class="{ 'conversation__snippet--unread': preview.unread > 0 }">
        {{ preview.snippet || preview.stateHint }}
      </text>
      <text class="conversation__hint">
        {{ preview.unread > 0 ? `有 ${preview.unread} 条未读消息` : preview.stateHint }}
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.conversation {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding: 22rpx;
  border-radius: 30rpx;
  background: var(--cm-surface);
  border: 1rpx solid var(--cm-border);
  box-shadow: var(--cm-shadow);
}

.conversation__identity {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.conversation__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border-radius: 28rpx;
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
}

.conversation__profile-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6rpx;
}

.conversation__name-row,
.conversation__state-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.conversation__name {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--cm-text);
}

.conversation__meta,
.conversation__hint,
.conversation__time {
  font-size: 23rpx;
  line-height: 1.6;
  color: var(--cm-text-soft);
}

.conversation__chat {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 18rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.03);
}

.conversation__state {
  font-size: 23rpx;
  font-weight: 700;
  color: #ffd0d8;
}

.conversation__snippet {
  font-size: 26rpx;
  line-height: 1.55;
  color: var(--cm-text);
}

.conversation__snippet--unread {
  font-weight: 700;
}

.conversation__unread {
  min-width: 40rpx;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: var(--cm-accent);
  color: #fff;
  text-align: center;
  font-size: 22rpx;
}
</style>
