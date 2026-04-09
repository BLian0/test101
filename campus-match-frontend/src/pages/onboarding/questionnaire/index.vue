<script setup lang="ts">
import { reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

import AppShell from '@/components/AppShell.vue'
import { onboardingApi } from '@/services/onboarding'
import { useOnboardingStore } from '@/stores/onboarding'
import type { QuestionnaireQuestion } from '@/types/onboarding'
import { getProfilePatchFromAnswers, getQuestionnaireSeedAnswers, questionnaireBank } from '@/utils/question-bank'

const onboardingStore = useOnboardingStore()

const pageMode = reactive<{ value: 'onboarding' | 'edit' }>({ value: 'onboarding' })
const submitting = reactive({ value: false })
const loading = reactive({ value: true })

const questions = ref<QuestionnaireQuestion[]>(questionnaireBank)
const answers = reactive<Record<string, string>>({
  ...onboardingStore.questionnaireAnswers,
})

const showError = (message: string) => {
  uni.showToast({ title: message, icon: 'none', duration: 2200 })
}

onLoad(async options => {
  if (options?.mode === 'edit') {
    pageMode.value = 'edit'
  }

  await hydrateQuestionnaire()
})

const hydrateQuestionnaire = async () => {
  loading.value = true
  try {
    const [questionResponse, resultResponse, profileResponse] = await Promise.all([
      onboardingApi.getActiveQuestionnaire().catch(() => ({ items: questionnaireBank })),
      onboardingApi.getQuestionnaireResult().catch(() => null),
      onboardingApi.getMyProfile().catch(() => null),
    ])

    questions.value = questionResponse.items.length ? questionResponse.items : questionnaireBank

    const remoteAnswers =
      resultResponse && typeof resultResponse === 'object' && 'answers' in resultResponse
        ? ((resultResponse as any).answers ?? {})
        : {}

    Object.entries(remoteAnswers).forEach(([questionId, answerValue]) => {
      answers[questionId] = String(answerValue)
    })

    const profileSeed = getQuestionnaireSeedAnswers(
      profileResponse?.profile
        ? {
            nickname: profileResponse.profile.nickname,
            avatarUrl: profileResponse.profile.avatarUrl,
            age: profileResponse.profile.age,
            gender: profileResponse.profile.gender,
            sexualOrientation: profileResponse.profile.sexualOrientation,
            monthlySpending: profileResponse.profile.monthlySpending,
            bio: profileResponse.profile.bio ?? '',
          }
        : null,
    )

    Object.entries(profileSeed).forEach(([questionId, answerValue]) => {
      if (!answers[questionId]) {
        answers[questionId] = String(answerValue)
      }
    })
  } finally {
    loading.value = false
  }
}

const setSliderAnswer = (questionId: string, value: number) => {
  answers[questionId] = String(value)
}

const setSingleAnswer = (questionId: string, value: string) => {
  answers[questionId] = value
}

const validate = () => {
  const missing = questions.value.find(item => !answers[item.id])
  if (missing) {
    return `请先完成 ${missing.id}`
  }
  return ''
}

const submit = async () => {
  const message = validate()
  if (message) {
    showError(message)
    return
  }

  submitting.value = true
  try {
    const result = await onboardingApi.submitQuestionnaire({
      questionnaireVersionId: 2,
      answers: questions.value.map(item => ({
        questionId: item.id,
        answerValue: String(answers[item.id]),
      })),
    })
    onboardingStore.applyQuestionnaireResult(result.result)

    const nextProfile = result.result.profile
      ? {
          nickname: result.result.profile.nickname,
          avatarUrl: result.result.profile.avatarUrl,
          age: result.result.profile.age,
          gender: result.result.profile.gender,
          sexualOrientation: result.result.profile.sexualOrientation,
          monthlySpending: result.result.profile.monthlySpending,
          bio: result.result.profile.bio ?? '',
        }
      : {
          ...onboardingStore.profile,
          ...getProfilePatchFromAnswers(answers, onboardingStore.profile),
        }

    onboardingStore.saveProfile(nextProfile)

    if (pageMode.value === 'edit') {
      uni.showToast({ title: '问卷已更新', icon: 'success' })
      setTimeout(() => {
        const pages = getCurrentPages()
        if (pages.length > 1) {
          uni.navigateBack()
          return
        }
        uni.switchTab({ url: '/pages/profile/index' })
      }, 300)
      return
    }

    uni.switchTab({ url: '/pages/home/index' })
  } catch (error) {
    showError(error instanceof Error && error.message ? error.message : '问卷提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppShell
    :eyebrow="pageMode.value === 'edit' ? 'Questionnaire' : 'Step 3'"
    :title="pageMode.value === 'edit' ? '修改匹配问卷' : '填写匹配问卷'"
    :subtitle="
      pageMode.value === 'edit'
        ? '保存后会直接回到个人资料页。'
        : '基础筛选字段和量表会一起提交，完成后直接进入推荐。'
    "
  >
    <view v-if="loading.value" class="loading-card">
      <text class="loading-card__text">正在加载题目...</text>
    </view>

    <template v-else>
      <view v-for="question in questions" :key="question.id" class="question">
        <view class="question__head">
          <text class="question__id">{{ question.id }} · {{ question.section }}</text>
          <text class="question__type">{{ question.type === 'slider' ? '1-9 量表题' : '单选题' }}</text>
        </view>

        <text class="question__title">{{ question.title }}</text>
        <text class="question__desc">{{ question.description }}</text>

        <view v-if="question.type === 'slider'" class="slider-card">
          <text class="slider-card__value">当前：{{ answers[question.id] || '5' }} / 9</text>
          <slider
            class="slider-card__slider"
            min="1"
            max="9"
            step="1"
            activeColor="var(--cm-accent)"
            backgroundColor="rgba(255,255,255,0.12)"
            block-color="#f8728b"
            :value="Number(answers[question.id] || 5)"
            @change="setSliderAnswer(question.id, Number($event.detail.value))"
          />
          <view class="slider-card__labels">
            <text>{{ question.leftLabel }}</text>
            <text>{{ question.middleLabel }}</text>
            <text>{{ question.rightLabel }}</text>
          </view>
        </view>

        <view v-else class="question__options">
          <view
            v-for="option in question.options"
            :key="option.value"
            class="question__option"
            :class="{ 'question__option--active': answers[question.id] === option.value }"
            @tap="setSingleAnswer(question.id, option.value)"
          >
            <text>{{ option.label }}</text>
          </view>
        </view>
      </view>

      <button class="submit" :disabled="submitting.value" @tap="submit">
        {{ submitting.value ? '保存中...' : pageMode.value === 'edit' ? '保存问卷结果' : '完成并进入推荐' }}
      </button>
    </template>
  </AppShell>
</template>

<style lang="scss" scoped>
.loading-card,
.question {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: var(--cm-surface);
  border: 1rpx solid var(--cm-border);
}

.loading-card__text,
.question__desc,
.question__id,
.slider-card__labels {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--cm-text-soft);
}

.question__head {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
  align-items: center;
}

.question__type {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(232, 93, 117, 0.1);
  color: #ffb9c4;
  font-size: 22rpx;
}

.question__title {
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.45;
  color: var(--cm-text);
}

.slider-card,
.question__option {
  padding: 22rpx 24rpx;
  border-radius: 22rpx;
  border: 1rpx solid var(--cm-border);
  background: rgba(255, 255, 255, 0.03);
}

.slider-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.slider-card__value {
  font-size: 26rpx;
  color: #ffd0d8;
}

.slider-card__labels {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12rpx;
}

.slider-card__labels text:nth-child(2) {
  text-align: center;
}

.slider-card__labels text:nth-child(3) {
  text-align: right;
}

.question__options {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.question__option {
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--cm-text);
}

.question__option--active {
  border-color: rgba(232, 93, 117, 0.45);
  background: rgba(232, 93, 117, 0.12);
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
