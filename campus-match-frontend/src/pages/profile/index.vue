<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

import AppShell from '@/components/AppShell.vue'
import { onboardingApi } from '@/services/onboarding'
import { useAuthStore } from '@/stores/auth'
import { useOnboardingStore } from '@/stores/onboarding'

const authStore = useAuthStore()
const onboardingStore = useOnboardingStore()

const reports = ref<Array<{ id: number; category: string; status: string; createdAt: string }>>([])
const blocks = ref<Array<{ blockedUserId: number; blockedName: string; createdAt: string }>>([])

const profileSummary = computed(() => ({
  nickname: onboardingStore.profile.nickname || '还没有填写昵称',
  bio:
    onboardingStore.profile.bio ||
    '把这里整理得更像你本人，别人点开资料时才会更愿意认真看下去。',
  avatarUrl: onboardingStore.profile.avatarUrl,
  uid: onboardingStore.userUid || '26000000',
  email: onboardingStore.registerDraft.email || '未绑定',
}))

const visibleTags = computed(() => {
  const normalized = onboardingStore.tags
    .map(tag => String(tag.label ?? '').trim())
    .filter(Boolean)

  if (normalized.length) {
    return normalized.slice(0, 4)
  }

  return ['量表已完成', '资料已完善', '开始推荐']
})

const openSection = (type: 'profile' | 'questionnaire') => {
  const routeMap = {
    profile: '/pages/onboarding/basic-profile/index?mode=edit',
    questionnaire: '/pages/onboarding/questionnaire/index?mode=edit',
  }

  uni.navigateTo({ url: routeMap[type] })
}

const formatTime = (value: string) => {
  const date = new Date(value)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}-${day}`
}

const formatCategory = (value: string) => {
  const map: Record<string, string> = {
    HARASSMENT: '骚扰',
    FAKE_IDENTITY: '虚假身份',
    EXPLICIT_CONTENT: '低俗内容',
    SPAM: '广告引流',
    ABUSE: '辱骂',
  }

  return map[value] ?? value
}

const formatStatus = (value: string) => {
  const map: Record<string, string> = {
    PENDING: '待处理',
    RESOLVED: '已处理',
    REJECTED: '已驳回',
  }

  return map[value] ?? value
}

const loadSafetyData = async () => {
  try {
    const [profileResponse, reportResponse, blockResponse] = await Promise.all([
      onboardingApi.getMyProfile(),
      onboardingApi.getMyReports(),
      onboardingApi.getBlocks(),
    ])

    onboardingStore.userUid = profileResponse.uid

    reports.value = reportResponse.items.map(item => ({
      id: Number(item.id),
      category: String(item.category),
      status: String(item.status),
      createdAt: String(item.createdAt ?? item.created_at),
    }))

    blocks.value = blockResponse.items.map(item => ({
      blockedUserId: Number(item.blockedUserId ?? item.blocked_user_id),
      blockedName: String(item.blockedName ?? '已拉黑用户'),
      createdAt: String(item.createdAt ?? item.created_at),
    }))
  } catch {
    uni.showToast({ title: '资料页加载失败', icon: 'none' })
  }
}

const removeBlock = async (blockedUserId: number) => {
  try {
    const response = await onboardingApi.removeBlock(blockedUserId)
    blocks.value = response.items.map(item => ({
      blockedUserId: Number(item.blockedUserId ?? item.blocked_user_id),
      blockedName: String(item.blockedName ?? '已拉黑用户'),
      createdAt: String(item.createdAt ?? item.created_at),
    }))
    uni.showToast({ title: '已取消拉黑', icon: 'success' })
  } catch {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

onShow(async () => {
  await loadSafetyData()
})
</script>

<template>
  <AppShell
    eyebrow="Me"
    title="我的资料"
    subtitle="这里展示的是 UID、昵称和邮箱。问卷完成后会直接进入推荐，不再单独填写偏好。"
    compact
  >
    <view class="hero">
      <view class="hero__top">
        <view class="hero__avatar">
          <image
            v-if="profileSummary.avatarUrl"
            class="hero__avatar-image"
            :src="profileSummary.avatarUrl"
            mode="aspectFill"
          />
          <text v-else>{{ profileSummary.nickname.slice(0, 1) }}</text>
        </view>

        <view class="hero__copy">
          <text class="hero__name">{{ profileSummary.nickname }}</text>
          <text class="hero__meta">UID {{ profileSummary.uid }}</text>
          <text class="hero__meta">{{ profileSummary.email }}</text>
          <text class="hero__bio">{{ profileSummary.bio }}</text>
        </view>
      </view>

      <view class="hero__tags">
        <text v-for="tag in visibleTags" :key="tag" class="hero__tag">{{ tag }}</text>
      </view>
    </view>

    <view class="menu">
      <view class="menu__item" @tap="openSection('profile')">
        <view class="menu__copy">
          <text class="menu__title">编辑个人资料</text>
          <text class="menu__desc">调整头像、昵称、年龄和自我介绍。</text>
        </view>
        <text class="menu__arrow">›</text>
      </view>

      <view class="menu__item" @tap="openSection('questionnaire')">
        <view class="menu__copy">
          <text class="menu__title">查看问卷结果</text>
          <text class="menu__desc">回看你的量表结果和当前标签。</text>
        </view>
        <text class="menu__arrow">›</text>
      </view>
    </view>

    <view class="section">
      <text class="section__title">举报记录</text>
      <view v-if="reports.length" class="rows">
        <view v-for="report in reports" :key="report.id" class="row">
          <view class="row__copy">
            <text class="row__title">#{{ report.id }} · {{ formatCategory(report.category) }}</text>
            <text class="row__meta">{{ formatTime(report.createdAt) }}</text>
          </view>
          <text class="row__status">{{ formatStatus(report.status) }}</text>
        </view>
      </view>
      <text v-else class="section__empty">你还没有提交过举报。</text>
    </view>

    <view class="section">
      <text class="section__title">拉黑名单</text>
      <view v-if="blocks.length" class="rows">
        <view v-for="item in blocks" :key="item.blockedUserId" class="row row--action">
          <view class="row__copy">
            <text class="row__title">{{ item.blockedName }}</text>
            <text class="row__meta">{{ formatTime(item.createdAt) }}</text>
          </view>
          <button class="row__button" @tap="removeBlock(item.blockedUserId)">取消拉黑</button>
        </view>
      </view>
      <text v-else class="section__empty">还没有拉黑任何人。</text>
    </view>

    <button class="logout" @tap="authStore.signOut">退出登录</button>
  </AppShell>
</template>

<style lang="scss" scoped>
.hero,
.menu,
.section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: 30rpx;
  background: var(--cm-surface);
  border: 1rpx solid var(--cm-border);
  box-shadow: var(--cm-shadow);
}

.hero__top {
  display: flex;
  gap: 18rpx;
}

.hero__avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 112rpx;
  height: 136rpx;
  border-radius: 28rpx;
  background: linear-gradient(145deg, var(--cm-accent), #b84f63);
  color: #fff;
  font-size: 44rpx;
  font-weight: 700;
}

.hero__avatar-image {
  width: 112rpx;
  height: 136rpx;
  border-radius: 28rpx;
}

.hero__copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 8rpx;
}

.hero__name,
.menu__title,
.section__title,
.row__title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--cm-text);
}

.hero__meta,
.hero__bio,
.menu__desc,
.row__meta,
.section__empty,
.row__status {
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--cm-text-soft);
}

.hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.hero__tag {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(232, 93, 117, 0.12);
  color: #ffd0d8;
  font-size: 22rpx;
}

.menu__item,
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 20rpx 0;
}

.menu__item + .menu__item,
.row + .row {
  border-top: 1rpx solid var(--cm-border);
}

.menu__copy,
.row__copy,
.rows {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6rpx;
}

.menu__arrow {
  color: var(--cm-text-soft);
  font-size: 34rpx;
}

.row--action {
  align-items: center;
}

.row__button,
.logout {
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.06);
  color: var(--cm-text);
  font-size: 24rpx;
}

.row__button::after,
.logout::after {
  border: none;
}

.logout {
  background: var(--cm-accent);
  color: #fff;
  font-size: 28rpx;
}
</style>
