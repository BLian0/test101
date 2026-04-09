<script setup lang="ts">
import { computed } from 'vue'

import type { MatchProfile } from '@/types/models'
import { getToneColor } from '@/utils/match-catalog'

const props = defineProps<{
  profile: MatchProfile
  compact?: boolean
}>()

const heroStyle = computed(() => ({
  background: `linear-gradient(180deg, rgba(10,12,16,0.08) 0%, rgba(10,12,16,0.56) 64%, rgba(10,12,16,0.9) 100%), linear-gradient(145deg, ${getToneColor(props.profile.heroTone)}, #11161d)`,
}))

const initials = computed(() => props.profile.name.slice(0, 1))
</script>

<template>
  <view class="hero" :class="{ 'hero--compact': compact }" :style="heroStyle">
    <view class="hero__copy">
      <text class="hero__eyebrow">{{ profile.compatibility }}% · {{ profile.compatibilityLabel }}</text>
      <text class="hero__name">{{ profile.name }}, {{ profile.age }}</text>
      <text class="hero__meta">{{ profile.school }} · {{ profile.gradeLabel }}</text>
      <text class="hero__identity">{{ profile.identityLabel }}</text>
    </view>
    <view class="hero__portrait">
      <text class="hero__portrait-text">{{ initials }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20rpx;
  min-height: 360rpx;
  padding: 28rpx;
  border-radius: 36rpx;
  color: #fff;
  box-shadow: 0 28rpx 70rpx rgba(0, 0, 0, 0.34);
}

.hero--compact {
  min-height: 220rpx;
}

.hero__copy {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  max-width: 72%;
}

.hero__eyebrow {
  font-size: 22rpx;
  letter-spacing: 3rpx;
  color: rgba(255, 255, 255, 0.86);
}

.hero__name {
  font-size: 48rpx;
  line-height: 1.08;
  font-weight: 700;
}

.hero__meta,
.hero__identity {
  font-size: 24rpx;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}

.hero__portrait {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 148rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.12);
}

.hero__portrait-text {
  font-size: 54rpx;
  font-weight: 700;
}
</style>
