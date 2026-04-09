<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  eyebrow?: string
  compact?: boolean
}>()
</script>

<template>
  <view class="shell" :class="{ 'shell--compact': compact }">
    <view class="shell__header">
      <text v-if="eyebrow" class="shell__eyebrow">{{ eyebrow }}</text>
      <text class="shell__title">{{ title }}</text>
      <text v-if="subtitle" class="shell__subtitle">{{ subtitle }}</text>
    </view>
    <view class="shell__body">
      <slot />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.shell {
  min-height: 100vh;
  padding: 34rpx 28rpx calc(40rpx + env(safe-area-inset-bottom));
}

.shell--compact .shell__header {
  margin-bottom: 20rpx;
}

.shell--compact .shell__title {
  font-size: 46rpx;
}

.shell__header {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-bottom: 26rpx;
}

.shell__eyebrow {
  font-size: 22rpx;
  letter-spacing: 4rpx;
  color: var(--cm-accent);
  text-transform: uppercase;
}

.shell__title {
  font-size: 52rpx;
  line-height: 1.14;
  font-weight: 700;
  color: var(--cm-text);
}

.shell__subtitle {
  max-width: 92%;
  font-size: 25rpx;
  line-height: 1.6;
  color: var(--cm-text-soft);
}

.shell__body {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}
</style>
