<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'

import AppShell from '@/components/AppShell.vue'
import ChatBubble from '@/components/ChatBubble.vue'
import { onboardingApi } from '@/services/onboarding'
import { connectRealtime, subscribeChatUpdates } from '@/services/realtime'
import { useFeedStore } from '@/stores/feed'
import type { ChatMessage } from '@/types/models'

const feedStore = useFeedStore()
const connectionId = ref(0)
const targetUserId = ref(0)
const targetName = ref('对方资料')
const state = ref<'WAITING_FIRST_MESSAGE' | 'WAITING_REPLY' | 'MUTUAL_CHAT'>('WAITING_FIRST_MESSAGE')
const conversationId = ref<number | null>(null)
const inputValue = ref('')
const messages = ref<ChatMessage[]>([])
const submitting = ref(false)
const mediaSubmitting = ref(false)
const loading = ref(false)
const loadError = ref('')
const currentVoiceUrl = ref('')
let activeAudio: HTMLAudioElement | null = null
let unsubscribeRealtime: (() => void) | null = null

const title = computed(() => targetName.value)
const statusText = computed(() => {
  if (state.value === 'WAITING_FIRST_MESSAGE') return '等待你发出第一条消息'
  if (state.value === 'WAITING_REPLY') return '等待对方回复'
  return '已进入双向聊天'
})

const bannerText = computed(() => {
  if (state.value === 'WAITING_FIRST_MESSAGE') {
    return '先写一句你为什么想认识对方。首条消息阶段暂不允许发送联系方式。'
  }
  if (state.value === 'WAITING_REPLY') {
    return '你已经发出第一条消息，等对方回复后会开放正常双向聊天。'
  }
  return '现在可以正常聊天，也可以点顶部头像回到对方资料页。'
})

const canSendFirstMessage = computed(() => state.value === 'WAITING_FIRST_MESSAGE')
const canSendMutualMessage = computed(() => state.value === 'MUTUAL_CHAT' && conversationId.value !== null)
const canSend = computed(() => canSendFirstMessage.value || canSendMutualMessage.value)
const placeholder = computed(() => {
  if (canSendFirstMessage.value) return '先说一句你为什么想认识对方'
  if (canSendMutualMessage.value) return '继续聊天'
  return '等待对方回复后开放双向聊天'
})

const openerSuggestions = [
  '你资料里哪一段最像现在的你？',
  '如果第一次在校园里见面，你会怎么安排？',
  '我点开这份资料，是因为你的回答看起来很认真。',
]

const mapMessages = (items: Array<Record<string, unknown>>) => {
  messages.value = items.map(item => ({
    id: Number(item.id),
    conversationId: Number(item.conversationId ?? item.conversation_id),
    senderRole: String(item.senderRole ?? item.sender_role) as ChatMessage['senderRole'],
    type: String(item.type ?? item.message_type) as ChatMessage['type'],
    content: String(item.content),
    createdAt: String(item.createdAt ?? item.created_at),
  }))
}

const loadConversationMessages = async () => {
  if (!conversationId.value) {
    messages.value = []
    return
  }

  const response = await onboardingApi.getConversationMessages(conversationId.value)
  mapMessages(response.items)
}

const loadConnectionDetail = async () => {
  const detail = await onboardingApi.getConnectionDetail(connectionId.value)
  targetUserId.value = Number(detail.targetUserId ?? 0)
  targetName.value = String(detail.targetName ?? '对方资料')
  state.value = String(detail.state) as typeof state.value
  conversationId.value = detail.conversationId == null ? null : Number(detail.conversationId)
  feedStore.markPreviewRead(connectionId.value)
  await loadConversationMessages()
}

const openProfile = () => {
  if (!targetUserId.value) return
  uni.navigateTo({
    url: `/pages/profile/detail/index?profileId=${targetUserId.value}`,
  })
}

const goMessages = () => {
  uni.switchTab({ url: '/pages/messages/index' })
}

const submitMessage = async () => {
  const content = inputValue.value.trim()
  if (!content || submitting.value) return

  try {
    submitting.value = true

    if (canSendFirstMessage.value) {
      await onboardingApi.sendFirstMessage(connectionId.value, { content })
      inputValue.value = ''
      await loadConnectionDetail()
      uni.showToast({ title: '首条消息已发出', icon: 'success' })
      return
    }

    if (canSendMutualMessage.value && conversationId.value) {
      const response = await onboardingApi.sendTextMessage(conversationId.value, { content })
      inputValue.value = ''
      mapMessages(response.items)
    }
  } catch (error) {
    const message =
      typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: string }).message)
        : '发送失败'

    uni.showToast({
      title: message === 'CHAT_FIRST_MESSAGE_CONTACT_INFO_FORBIDDEN' ? '首条消息不能发送联系方式' : message,
      icon: 'none',
    })
  } finally {
    submitting.value = false
  }
}

const fillSuggestion = (value: string) => {
  inputValue.value = value
}

const chooseAndSendImage = () => {
  if (!canSendMutualMessage.value || !conversationId.value || mediaSubmitting.value) return

  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async result => {
      const filePath = result.tempFilePaths?.[0]
      if (!filePath) return

      try {
        mediaSubmitting.value = true
        const upload = await onboardingApi.uploadChatImage(filePath)
        const response = await onboardingApi.sendImageMessage(conversationId.value!, {
          imageUrl: upload.file.url,
        })
        mapMessages(response.items)
      } catch {
        uni.showToast({ title: '图片发送失败', icon: 'none' })
      } finally {
        mediaSubmitting.value = false
      }
    },
  })
}

const chooseAndSendVoice = () => {
  if (!canSendMutualMessage.value || !conversationId.value || mediaSubmitting.value) return

  // #ifdef H5
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'audio/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return

    try {
      mediaSubmitting.value = true
      const upload = await onboardingApi.uploadChatVoice(file)
      const response = await onboardingApi.sendVoiceMessage(conversationId.value!, {
        voiceUrl: upload.file.url,
      })
      mapMessages(response.items)
    } catch {
      uni.showToast({ title: '语音发送失败', icon: 'none' })
    } finally {
      mediaSubmitting.value = false
    }
  }
  input.click()
  // #endif

  // #ifndef H5
  uni.showToast({ title: '当前端暂未开放语音文件发送', icon: 'none' })
  // #endif
}

const playVoice = (url: string) => {
  // #ifdef H5
  if (!url) return

  if (activeAudio && currentVoiceUrl.value === url) {
    activeAudio.pause()
    activeAudio.currentTime = 0
    activeAudio = null
    currentVoiceUrl.value = ''
    return
  }

  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
  }

  const audio = new Audio(url)
  activeAudio = audio
  currentVoiceUrl.value = url
  audio.onended = () => {
    activeAudio = null
    currentVoiceUrl.value = ''
  }
  void audio.play().catch(() => {
    activeAudio = null
    currentVoiceUrl.value = ''
    uni.showToast({ title: '语音播放失败', icon: 'none' })
  })
  // #endif

  // #ifndef H5
  uni.showToast({ title: '当前端暂未开放语音播放', icon: 'none' })
  // #endif
}

const openMore = () => {
  uni.showActionSheet({
    itemList: ['查看对方资料', '举报', '拉黑'],
    success: ({ tapIndex }) => {
      if (tapIndex === 0) {
        openProfile()
        return
      }

      if (tapIndex === 1) {
        uni.showModal({
          title: '举报对方',
          editable: true,
          placeholderText: '简要说明原因',
          success: async modal => {
            if (!modal.confirm) return
            const description = String(modal.content ?? '').trim()
            if (!description) return
            try {
              await onboardingApi.createReport({
                targetUserId: targetUserId.value,
                category: 'HARASSMENT',
                description,
              })
              feedStore.removeProfile(targetUserId.value)
              uni.showToast({ title: '已提交举报，我们会尽快处理', icon: 'success' })
            } catch {
              uni.showToast({ title: '举报失败', icon: 'none' })
            }
          },
        })
        return
      }

      onboardingApi
        .createBlock({ blockedUserId: targetUserId.value })
        .then(() => {
          feedStore.removeProfile(targetUserId.value)
          feedStore.removePreviewByUserId(targetUserId.value)
          uni.showToast({ title: '已拉黑，对方会从消息和推荐中移除', icon: 'success' })
          setTimeout(() => uni.switchTab({ url: '/pages/messages/index' }), 300)
        })
        .catch(() => {
          uni.showToast({ title: '拉黑失败', icon: 'none' })
        })
    },
  })
}

onLoad(async options => {
  connectionId.value = Number(options?.connectionId ?? 0)
  if (!connectionId.value) {
    loadError.value = '当前连接不存在或已失效'
    return
  }

  try {
    loading.value = true
    await loadConnectionDetail()
    connectRealtime()
    unsubscribeRealtime = subscribeChatUpdates(async payload => {
      const nextConversationId = payload.conversationId == null ? null : Number(payload.conversationId)
      if (payload.connectionId !== connectionId.value && nextConversationId !== conversationId.value) {
        return
      }
      await loadConnectionDetail()
    })
  } catch (error) {
    loadError.value = error instanceof Error && error.message ? error.message : '当前会话已不可用'
  } finally {
    loading.value = false
  }
})

onUnload(() => {
  if (unsubscribeRealtime) {
    unsubscribeRealtime()
    unsubscribeRealtime = null
  }

  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
    activeAudio = null
    currentVoiceUrl.value = ''
  }
})
</script>

<template>
  <AppShell eyebrow="Chat" :title="title" :subtitle="statusText">
    <view class="chat-page">
      <view class="chat-head">
        <view class="chat-head__identity" @tap="openProfile">
          <view class="chat-head__avatar">{{ targetName.slice(0, 1) }}</view>
          <view class="chat-head__copy">
            <text class="chat-head__name">{{ targetName }}</text>
            <text class="chat-head__status">{{ statusText }}</text>
          </view>
        </view>
        <button class="chat-head__more" @tap="openMore">更多</button>
      </view>

      <view class="banner">
        <text class="banner__title">当前状态</text>
        <text class="banner__desc">{{ bannerText }}</text>
      </view>

      <view v-if="loading" class="empty-box">
        <text class="empty-box__title">正在加载聊天</text>
      </view>

      <view v-else-if="loadError" class="empty-box">
        <text class="empty-box__title">当前会话不可用</text>
        <text class="empty-box__desc">{{ loadError }}</text>
        <button class="empty-box__button" @tap="goMessages">回到消息页</button>
      </view>

      <template v-else>
        <view v-if="!messages.length" class="empty-box">
          <text class="empty-box__title">还没有真正开始聊天</text>
          <text class="empty-box__desc">先说一句你为什么点开这份资料，会比单纯打招呼更有效。</text>
          <view v-if="canSendFirstMessage" class="suggestions">
            <button
              v-for="item in openerSuggestions"
              :key="item"
              class="suggestions__item"
              @tap="fillSuggestion(item)"
            >
              {{ item }}
            </button>
          </view>
        </view>

        <view v-else class="messages">
          <ChatBubble
            v-for="message in messages"
            :key="message.id"
            :message="message"
            :active-voice-url="currentVoiceUrl"
            @play-voice="playVoice"
          />
        </view>
      </template>

      <view class="composer">
        <view v-if="canSendMutualMessage" class="composer__tools">
          <button class="composer__tool" :disabled="mediaSubmitting" @tap="chooseAndSendImage">图片</button>
          <button class="composer__tool" :disabled="mediaSubmitting" @tap="chooseAndSendVoice">语音</button>
        </view>
        <textarea
          v-model="inputValue"
          class="composer__input"
          :placeholder="placeholder"
          :disabled="!canSend"
          maxlength="200"
        />
        <button class="composer__send" :disabled="!canSend || !inputValue.trim() || submitting" @tap="submitMessage">
          {{ submitting ? '发送中...' : '发送' }}
        </button>
      </view>
    </view>
  </AppShell>
</template>

<style lang="scss" scoped>
.chat-page {
  display: flex;
  min-height: calc(100vh - 200rpx);
  flex-direction: column;
  gap: 18rpx;
}

.chat-head,
.banner,
.empty-box,
.composer {
  padding: 22rpx;
  border-radius: 28rpx;
  background: var(--cm-surface);
  border: 1rpx solid var(--cm-border);
}

.chat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.chat-head__identity {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.chat-head__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  border-radius: 24rpx;
  background: var(--cm-accent);
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
}

.chat-head__copy {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.chat-head__name,
.banner__title,
.empty-box__title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--cm-text);
}

.chat-head__status,
.banner__desc,
.empty-box__desc {
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--cm-text-soft);
}

.chat-head__more,
.composer__tool {
  height: 64rpx;
  line-height: 64rpx;
  padding: 0 20rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.04);
  color: var(--cm-text);
  border: 1rpx solid var(--cm-border);
  font-size: 24rpx;
}

.empty-box__button {
  margin-top: 8rpx;
  height: 78rpx;
  line-height: 78rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.06);
  color: var(--cm-text);
  border: 1rpx solid var(--cm-border);
  font-size: 25rpx;
}

.chat-head__more::after,
.composer__tool::after,
.composer__send::after,
.suggestions__item::after,
.empty-box__button::after {
  border: none;
}

.messages,
.suggestions {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.messages {
  flex: 1;
}

.suggestions__item {
  height: auto;
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.04);
  color: var(--cm-text);
  text-align: left;
  font-size: 25rpx;
  line-height: 1.6;
  border: 1rpx solid var(--cm-border);
}

.composer {
  position: sticky;
  bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.composer__tools {
  display: flex;
  gap: 12rpx;
}

.composer__input {
  width: 100%;
  min-height: 150rpx;
  padding: 18rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.04);
  color: var(--cm-text);
  font-size: 26rpx;
  border: 1rpx solid var(--cm-border);
}

.composer__send {
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 22rpx;
  background: var(--cm-accent);
  color: #fff;
  font-size: 28rpx;
}

.composer__send[disabled],
.composer__tool[disabled] {
  opacity: 0.5;
}
</style>
