<script setup lang="ts">
import type { ChatMessage } from '@/types/models'

defineProps<{
  message: ChatMessage
  activeVoiceUrl?: string
}>()

const emit = defineEmits<{
  playVoice: [url: string]
}>()

const formatTime = (value: string) => {
  const date = new Date(value)
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${hours}:${minutes}`
}
</script>

<template>
  <view class="row" :class="{ 'row--self': message.senderRole === 'SELF' }">
    <view class="bubble" :class="{ 'bubble--self': message.senderRole === 'SELF' }">
      <image
        v-if="message.type === 'IMAGE'"
        class="bubble__image"
        :src="message.content"
        mode="widthFix"
      />
      <button
        v-else-if="message.type === 'VOICE'"
        class="bubble__voice"
        @tap="emit('playVoice', message.content)"
      >
        {{ activeVoiceUrl === message.content ? '停止语音' : '播放语音' }}
      </button>
      <text v-else class="bubble__text">{{ message.content }}</text>
      <text class="bubble__time">{{ formatTime(message.createdAt) }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.row {
  display: flex;
  justify-content: flex-start;
}

.row--self {
  justify-content: flex-end;
}

.bubble {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  max-width: 78%;
  padding: 20rpx 22rpx;
  border-radius: 26rpx;
  background: #1a1f27;
  border: 1rpx solid rgba(255, 255, 255, 0.05);
}

.bubble--self {
  background: linear-gradient(145deg, #e85d75, #bf485f);
}

.bubble__text {
  font-size: 28rpx;
  line-height: 1.65;
  color: var(--cm-text);
}

.bubble--self .bubble__text,
.bubble--self .bubble__time {
  color: #fff;
}

.bubble__time {
  align-self: flex-end;
  font-size: 22rpx;
  color: var(--cm-text-soft);
}

.bubble__image {
  width: 340rpx;
  border-radius: 18rpx;
}

.bubble__voice {
  width: 300rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.08);
  color: var(--cm-text);
  font-size: 24rpx;
}

.bubble__voice::after {
  border: none;
}
</style>
