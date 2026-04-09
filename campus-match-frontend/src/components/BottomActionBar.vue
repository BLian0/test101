<script setup lang="ts">
defineProps<{
  primaryText: string
  secondaryText?: string
  primaryDisabled?: boolean
  primaryLoading?: boolean
  done?: boolean
}>()

const emit = defineEmits<{
  primary: []
  secondary: []
}>()
</script>

<template>
  <view class="bar">
    <button
      v-if="secondaryText"
      class="bar__button bar__button--secondary"
      @tap="emit('secondary')"
    >
      {{ secondaryText }}
    </button>
    <button
      class="bar__button"
      :class="{ 'bar__button--done': done }"
      :disabled="primaryDisabled || primaryLoading"
      @tap="emit('primary')"
    >
      {{ primaryLoading ? '处理中...' : primaryText }}
    </button>
  </view>
</template>

<style lang="scss" scoped>
.bar {
  position: sticky;
  bottom: calc(22rpx + env(safe-area-inset-bottom));
  z-index: 8;
  display: flex;
  gap: 14rpx;
  padding: 16rpx;
  border-radius: 28rpx;
  background: rgba(18, 21, 27, 0.92);
  border: 1rpx solid var(--cm-border);
  box-shadow: var(--cm-shadow);
  backdrop-filter: blur(8px);
}

.bar__button {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 24rpx;
  background: var(--cm-accent);
  color: #fff;
  font-size: 28rpx;
}

.bar__button::after {
  border: none;
}

.bar__button--secondary {
  background: rgba(255, 255, 255, 0.04);
  color: var(--cm-text);
  border: 1rpx solid var(--cm-border);
}

.bar__button--done {
  background: rgba(77, 176, 137, 0.18);
  color: #b8f0da;
}

.bar__button[disabled] {
  opacity: 0.55;
}
</style>
