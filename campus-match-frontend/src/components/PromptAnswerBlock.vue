<script setup lang="ts">
import type { PromptBlock } from '@/types/models'

defineProps<{
  prompt: PromptBlock
  emphasis?: boolean
}>()
</script>

<template>
  <view class="prompt" :class="{ 'prompt--emphasis': emphasis }">
    <text class="prompt__question">{{ prompt.question }}</text>
    <text class="prompt__answer">{{ prompt.answer }}</text>
  </view>
</template>

<style lang="scss" scoped>
.prompt {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 22rpx 24rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.03);
  border: 1rpx solid var(--cm-border);
}

.prompt--emphasis {
  background: rgba(232, 93, 117, 0.08);
}

.prompt__question {
  font-size: 22rpx;
  letter-spacing: 2rpx;
  color: var(--cm-text-soft);
}

.prompt__answer {
  font-size: 30rpx;
  line-height: 1.6;
  color: var(--cm-text);
}
</style>
