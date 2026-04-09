<script setup lang="ts">
import type { MatchReason } from '@/types/models'

defineProps<{
  reasons: MatchReason[]
}>()
</script>

<template>
  <view class="reasons">
    <view class="reasons__head">
      <text class="reasons__eyebrow">Why matched</text>
      <text class="reasons__title">这次推荐不是一个分数，而是一份解释。</text>
    </view>
    <view class="reasons__list">
      <view v-for="reason in reasons" :key="reason.title" class="reasons__item">
        <text class="reasons__item-title">{{ reason.title }}</text>
        <text class="reasons__item-detail">{{ reason.detail }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.reasons {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 24rpx;
  border-radius: var(--cm-radius-lg);
  background: var(--cm-surface);
  border: 1rpx solid var(--cm-border);
}

.reasons__head {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.reasons__eyebrow {
  font-size: 22rpx;
  letter-spacing: 3rpx;
  color: var(--cm-accent);
}

.reasons__title {
  font-size: 30rpx;
  line-height: 1.45;
  font-weight: 700;
  color: var(--cm-text);
}

.reasons__list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.reasons__item {
  padding: 18rpx 18rpx 18rpx 22rpx;
  border-left: 6rpx solid rgba(232, 93, 117, 0.42);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 18rpx;
}

.reasons__item-title {
  display: block;
  margin-bottom: 6rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: var(--cm-text);
}

.reasons__item-detail {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--cm-text-soft);
}
</style>
