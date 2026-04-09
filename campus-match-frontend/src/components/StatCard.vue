<script setup lang="ts">
defineProps<{
  label: string
  value: string
  accent?: string
}>()
</script>

<template>
  <view class="stat" :style="{ '--accent': accent || '#ff6f59' }">
    <text class="stat__label">{{ label }}</text>
    <text class="stat__value">{{ value }}</text>
  </view>
</template>

<style lang="scss" scoped>
.stat {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18rpx 40rpx rgba(31, 36, 48, 0.05);
}

.stat__label {
  font-size: 22rpx;
  color: #8e95a5;
}

.stat__value {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--accent);
}
</style>
