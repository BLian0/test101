<script setup lang="ts">
import { reactive } from 'vue'

import AppShell from '@/components/AppShell.vue'
import { onboardingApi } from '@/services/onboarding'
import { useOnboardingStore } from '@/stores/onboarding'

const onboardingStore = useOnboardingStore()

const relationshipGoalOptions = ['SERIOUS', 'EXPLORE', 'BOTH'] as const
const relationshipGoalLabels = ['认真关系', '先了解看看', '两种都接受']
const intimacyOptions = ['CONSERVATIVE', 'BALANCED', 'OPEN'] as const
const intimacyLabels = ['边界更慢热', '顺其自然', '更开放一点']
const valueOptions = ['STABILITY', 'GROWTH', 'FREEDOM'] as const
const valueLabels = ['稳定感', '共同成长', '自由空间']
const emotionalOptions = ['CALM', 'DIRECT', 'WARM'] as const
const emotionalLabels = ['冷静沟通', '直接表达', '温和回应']

const form = reactive({
  relationshipGoal: onboardingStore.preferences.relationshipGoal,
  intimacyPreference: onboardingStore.preferences.intimacyPreference,
  valuePriority: onboardingStore.preferences.valuePriority,
  emotionalStyle: onboardingStore.preferences.emotionalStyle,
})

const submit = async () => {
  const payload = {
    preferredGenders: onboardingStore.profile.sexualOrientation
      ? [onboardingStore.profile.sexualOrientation]
      : onboardingStore.preferences.preferredGenders,
    ageMin: onboardingStore.preferences.ageMin,
    ageMax: onboardingStore.preferences.ageMax,
    relationshipGoal: form.relationshipGoal as any,
    intimacyPreference: form.intimacyPreference as any,
    valuePriority: form.valuePriority as any,
    emotionalStyle: form.emotionalStyle as any,
  }

  try {
    await onboardingApi.updatePreferences(payload)
    onboardingStore.applyPreferences(payload)
    uni.switchTab({ url: '/pages/home/index' })
  } catch {
    uni.showToast({ title: '偏好保存失败', icon: 'none' })
  }
}
</script>

<template>
  <AppShell
    eyebrow="Step 4"
    title="关系偏好设置"
    subtitle="这里保留的是软偏好。性别、性取向等硬标准已经放到资料里直接参与筛选，不再重复设置。"
  >
    <view class="form-card">
      <view class="field">
        <text class="field__label">关系目标</text>
        <picker :range="relationshipGoalLabels" @change="form.relationshipGoal = relationshipGoalOptions[$event.detail.value]">
          <view class="field__input field__picker">
            {{ relationshipGoalLabels[relationshipGoalOptions.indexOf(form.relationshipGoal)] }}
          </view>
        </picker>
      </view>

      <view class="field">
        <text class="field__label">亲密边界兼容度</text>
        <picker :range="intimacyLabels" @change="form.intimacyPreference = intimacyOptions[$event.detail.value]">
          <view class="field__input field__picker">
            {{ intimacyLabels[intimacyOptions.indexOf(form.intimacyPreference)] }}
          </view>
        </picker>
      </view>

      <view class="field">
        <text class="field__label">价值观优先项</text>
        <picker :range="valueLabels" @change="form.valuePriority = valueOptions[$event.detail.value]">
          <view class="field__input field__picker">
            {{ valueLabels[valueOptions.indexOf(form.valuePriority)] }}
          </view>
        </picker>
      </view>

      <view class="field">
        <text class="field__label">情绪表达偏好</text>
        <picker :range="emotionalLabels" @change="form.emotionalStyle = emotionalOptions[$event.detail.value]">
          <view class="field__input field__picker">
            {{ emotionalLabels[emotionalOptions.indexOf(form.emotionalStyle)] }}
          </view>
        </picker>
      </view>
    </view>

    <button class="submit" @tap="submit">完成设置并进入推荐</button>
  </AppShell>
</template>

<style lang="scss" scoped>
.form-card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: var(--cm-surface);
  border: 1rpx solid var(--cm-border);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.field__label {
  font-size: 24rpx;
  color: var(--cm-text-soft);
}

.field__input {
  min-height: 92rpx;
  padding: 24rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.04);
  color: var(--cm-text);
  font-size: 28rpx;
  border: 1rpx solid var(--cm-border);
}

.field__picker {
  display: flex;
  align-items: center;
}

.submit {
  border-radius: 24rpx;
  background: var(--cm-accent);
  font-size: 28rpx;
  color: #fff;
}

.submit::after {
  border: none;
}
</style>
