<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

import AppShell from '@/components/AppShell.vue'
import BottomActionBar from '@/components/BottomActionBar.vue'
import DetailHero from '@/components/DetailHero.vue'
import MatchReasonsBlock from '@/components/MatchReasonsBlock.vue'
import PromptAnswerBlock from '@/components/PromptAnswerBlock.vue'
import { onboardingApi } from '@/services/onboarding'
import { useFeedStore } from '@/stores/feed'
import type { MatchProfile } from '@/types/models'
import { getCatalogProfileById } from '@/utils/match-catalog'

const feedStore = useFeedStore()

const profileId = ref<number>(0)
const actioning = ref(false)

const profile = computed<MatchProfile | null>(() => {
  const existing = feedStore.getProfileById(profileId.value)
  if (existing) return existing

  const preview = feedStore.previews.find(item => item.targetUserId === profileId.value)
  const catalog = getCatalogProfileById(profileId.value)
  if (!preview || !catalog) return null

  return {
    id: preview.targetUserId,
    name: preview.name,
    age: 22,
    school: preview.school,
    gradeLabel: preview.gradeLabel,
    identityLabel: '你们已经进入同一条连接线',
    compatibility: 90,
    compatibilityLabel: '值得认真了解',
    heroTone: catalog.heroTone,
    intro: preview.stateHint,
    tags: catalog.personalityTags,
    personalityTags: catalog.personalityTags,
    relationshipIntent: catalog.relationshipIntent,
    reasons: [
      {
        title: '你们已经建立了连接',
        detail: '现在更适合把资料认真看完，再决定怎么开口，而不是只凭第一条消息推进关系。',
      },
    ],
    promptPreview: catalog.prompts[0],
    prompts: catalog.prompts,
    campusMoments: catalog.campusMoments,
    actionState: 'LIKE',
    connectionState: preview.state,
    connectionId: preview.id,
    conversationId: preview.conversationId,
    canSendFirstMessage: preview.canSendFirstMessage,
    canMutualChat: preview.canMutualChat,
  }
})

const relationHint = computed(() => {
  if (!profile.value) return ''
  if (profile.value.connectionState === 'WAITING_FIRST_MESSAGE') {
    return '你们已经建立连接，但还没有真正开始。先看完资料，再发出第一条有内容的消息。'
  }
  if (profile.value.connectionState === 'WAITING_REPLY') {
    return '你已经发出第一条消息。现在适合回来看资料，确认你们为什么会被推荐到一起。'
  }
  if (profile.value.connectionState === 'MUTUAL_CHAT') {
    return '你们已经进入正常聊天。资料页更适合帮助你确认彼此的节奏、边界和长期感。'
  }
  return '这不是只看头像的一步。先确认你是不是真的想认识这个人，再做决定。'
})

const primaryText = computed(() => {
  if (!profile.value) return '返回发现'
  if (profile.value.connectionState) return '去聊天'
  return '建立连接'
})

const openChat = () => {
  if (!profile.value?.connectionId) return
  uni.navigateTo({
    url: `/pages/chat/detail/index?connectionId=${profile.value.connectionId}`,
  })
}

const handleSkip = async () => {
  if (!profile.value || actioning.value) return

  try {
    actioning.value = true
    await onboardingApi.passRecommendation(profile.value.id)
    feedStore.removeProfile(profile.value.id)
    uni.showToast({ title: '已从当前推荐中移除', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 280)
  } catch {
    uni.showToast({ title: '操作失败', icon: 'none' })
  } finally {
    actioning.value = false
  }
}

const openMoreActions = () => {
  if (!profile.value) return

  uni.showActionSheet({
    itemList: ['不再推荐', '举报', '拉黑'],
    success: async ({ tapIndex }) => {
      if (!profile.value) return

      if (tapIndex === 0) {
        await handleSkip()
      }

      if (tapIndex === 1) {
        uni.showModal({
          title: '举报对方',
          editable: true,
          placeholderText: '简要说明原因，例如骚扰、虚假身份、广告引流',
          success: async modal => {
            if (!modal.confirm) return
            const description = String(modal.content ?? '').trim()
            if (!description) return

            try {
              const currentProfile = profile.value
              if (!currentProfile) return
              await onboardingApi.createReport({
                targetUserId: currentProfile.id,
                category: 'HARASSMENT',
                description,
              })
              feedStore.removeProfile(currentProfile.id)
              uni.showToast({ title: '已提交举报，我们会尽快处理', icon: 'success' })
              setTimeout(() => uni.navigateBack(), 300)
            } catch {
              uni.showToast({ title: '举报失败', icon: 'none' })
            }
          },
        })
      }

      if (tapIndex === 2) {
        try {
          await onboardingApi.createBlock({ blockedUserId: profile.value.id })
          feedStore.removeProfile(profile.value.id)
          feedStore.removePreviewByUserId(profile.value.id)
          uni.showToast({ title: '已拉黑，对方会从消息和推荐中移除', icon: 'success' })
          setTimeout(() => uni.switchTab({ url: '/pages/messages/index' }), 300)
        } catch {
          uni.showToast({ title: '拉黑失败', icon: 'none' })
        }
      }
    },
  })
}

const handlePrimary = async () => {
  if (!profile.value || actioning.value) return

  if (profile.value.connectionState) {
    openChat()
    return
  }

  try {
    actioning.value = true
    const response = await onboardingApi.likeRecommendation(profile.value.id)
    feedStore.updateConnectionState(profile.value.id, {
      state: String(response.state) as 'WAITING_FIRST_MESSAGE',
      connectionId: Number(response.connectionId),
      conversationId: 20000 + profile.value.id,
      canSendFirstMessage: true,
      canMutualChat: false,
    })
    uni.navigateTo({
      url: `/pages/discover/index?profileId=${profile.value.id}&connectionId=${response.connectionId}`,
    })
  } catch {
    uni.showToast({ title: '建立连接失败', icon: 'none' })
  } finally {
    actioning.value = false
  }
}

onLoad(options => {
  profileId.value = Number(options?.profileId ?? 0)
})

onShow(() => {
  if (!profile.value) {
    uni.showToast({ title: '没有找到这份资料', icon: 'none' })
  }
})
</script>

<template>
  <AppShell
    eyebrow="Profile"
    title="认真看完，再做决定"
    subtitle="如果你愿意往下走，再建立连接。"
  >
    <view v-if="profile" class="detail">
      <DetailHero :profile="profile" />

      <view class="summary">
        <text class="summary__label">现在适合怎么做</text>
        <text class="summary__body">{{ relationHint }}</text>
      </view>

      <MatchReasonsBlock :reasons="profile.reasons" />

      <view class="section">
        <text class="section__title">看看她怎么表达自己</text>
        <PromptAnswerBlock
          v-for="prompt in profile.prompts"
          :key="prompt.id"
          :prompt="prompt"
        />
      </view>

      <view class="section">
        <text class="section__title">关系取向和个性线索</text>
        <view class="chips">
          <text class="chip chip--intent">{{ profile.relationshipIntent }}</text>
          <text v-for="tag in profile.personalityTags" :key="tag" class="chip">{{ tag }}</text>
        </view>
      </view>

      <view class="section section--muted">
        <text class="section__title">校园里的相处线索</text>
        <view class="moments">
          <text v-for="item in profile.campusMoments" :key="item" class="moment">{{ item }}</text>
        </view>
      </view>

      <view class="section section--muted">
        <view class="section__topline">
          <text class="section__title">安全操作</text>
          <button class="section__link" @tap="openMoreActions">更多操作</button>
        </view>
        <text class="section__body">不感兴趣、举报和拉黑都放在这里，不需要勉强继续。</text>
      </view>

      <BottomActionBar
        :primary-text="primaryText"
        secondary-text="暂时略过"
        :primary-loading="actioning"
        :done="Boolean(profile.connectionState)"
        @primary="handlePrimary"
        @secondary="handleSkip"
      />
    </view>
  </AppShell>
</template>

<style lang="scss" scoped>
.detail,
.section {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.summary,
.section {
  padding: 28rpx;
  border-radius: 30rpx;
  background: var(--cm-surface);
  border: 1rpx solid var(--cm-border);
}

.section--muted {
  background: var(--cm-surface-muted);
}

.summary__label {
  font-size: 22rpx;
  letter-spacing: 3rpx;
  color: var(--cm-accent);
  text-transform: uppercase;
}

.summary__body,
.section__body {
  font-size: 26rpx;
  line-height: 1.75;
  color: var(--cm-text-soft);
}

.section__title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--cm-text);
}

.section__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.section__link {
  height: 64rpx;
  line-height: 64rpx;
  padding: 0 22rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.04);
  color: var(--cm-text);
  border: 1rpx solid var(--cm-border);
  font-size: 24rpx;
}

.section__link::after {
  border: none;
}

.chips,
.moments {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.chip,
.moment {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
}

.chip {
  background: rgba(255, 255, 255, 0.05);
  color: var(--cm-text);
}

.chip--intent {
  background: rgba(232, 93, 117, 0.16);
  color: #ffbdc7;
}

.moment {
  background: rgba(255, 255, 255, 0.04);
  color: var(--cm-text-soft);
}
</style>
