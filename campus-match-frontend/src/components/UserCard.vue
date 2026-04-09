<script setup lang="ts">
import { computed } from 'vue'

import type { MatchProfile } from '@/types/models'
import { getToneColor } from '@/utils/match-catalog'

const props = defineProps<{
  profile: MatchProfile
  loading?: boolean
}>()

const emit = defineEmits<{
  pass: [profileId: number]
  view: [profileId: number]
}>()

const heroStyle = computed(() => ({
  background: `linear-gradient(180deg, rgba(15,17,21,0.04) 0%, rgba(15,17,21,0.58) 62%, rgba(15,17,21,0.94) 100%), linear-gradient(145deg, ${getToneColor(props.profile.heroTone)}, #11161d)`,
}))
</script>

<template>
  <view class="card">
    <view class="card__hero" :style="heroStyle" @tap="emit('view', profile.id)">
      <view class="card__portrait">
        <text class="card__portrait-text">{{ profile.name.slice(0, 1) }}</text>
      </view>

      <view class="card__content">
        <view class="card__identity">
          <text class="card__name">{{ profile.name }}, {{ profile.age }}</text>
          <text class="card__meta">{{ profile.school }}</text>
        </view>
        <text class="card__reason">{{ profile.reasons[0]?.title }}</text>
      </view>
    </view>

    <view class="card__actions">
      <button class="card__button card__button--ghost" :disabled="loading" @tap="emit('pass', profile.id)">
        不感兴趣
      </button>
      <button class="card__button card__button--primary" @tap="emit('view', profile.id)">
        查看详情
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.card__hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 980rpx;
  padding: 26rpx;
  border-radius: 40rpx;
  overflow: hidden;
  box-shadow: 0 28rpx 70rpx rgba(0, 0, 0, 0.34);
}

.card__portrait {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card__portrait-text {
  font-size: 220rpx;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.18);
  transform: translateY(-64rpx);
}

.card__content {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 14rpx;
}

.card__identity {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.card__name {
  font-size: 50rpx;
  line-height: 1.08;
  font-weight: 700;
  color: #f7f8fb;
}

.card__meta {
  font-size: 25rpx;
  color: rgba(247, 248, 251, 0.78);
}

.card__reason {
  display: inline-flex;
  max-width: 82%;
  padding: 14rpx 18rpx;
  border-radius: 22rpx;
  background: rgba(9, 11, 15, 0.54);
  font-size: 25rpx;
  line-height: 1.55;
  color: rgba(247, 248, 251, 0.94);
  backdrop-filter: blur(10px);
}

.card__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14rpx;
}

.card__button {
  height: 92rpx;
  line-height: 92rpx;
  border-radius: 26rpx;
  font-size: 28rpx;
}

.card__button::after {
  border: none;
}

.card__button--ghost {
  background: var(--cm-surface);
  color: var(--cm-text);
  border: 1rpx solid var(--cm-border);
}

.card__button--primary {
  background: var(--cm-accent);
  color: #fff;
  box-shadow: 0 18rpx 36rpx rgba(232, 93, 117, 0.22);
}

.card__button[disabled] {
  opacity: 0.55;
}
</style>
