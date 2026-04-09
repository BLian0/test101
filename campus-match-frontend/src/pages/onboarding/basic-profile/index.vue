<script setup lang="ts">
import { computed, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

import AppShell from '@/components/AppShell.vue'
import { onboardingApi } from '@/services/onboarding'
import { useOnboardingStore } from '@/stores/onboarding'

const onboardingStore = useOnboardingStore()

const pageMode = reactive<{ value: 'onboarding' | 'edit' }>({ value: 'onboarding' })
const submitting = reactive({ value: false })
const uploadingAvatar = reactive({ value: false })
const nicknameState = reactive({
  checking: false,
  checked: false,
  available: true,
  message: '',
  lastCheckedValue: '',
  editable: true,
  changeCount: 0,
  uid: '',
})

const form = reactive({
  nickname: onboardingStore.profile.nickname,
  avatarUrl: onboardingStore.profile.avatarUrl,
  age: onboardingStore.profile.age ? String(onboardingStore.profile.age) : '',
  bio: onboardingStore.profile.bio,
})

let nicknameTimer: ReturnType<typeof setTimeout> | null = null

const editMode = computed(() => pageMode.value === 'edit')
const avatarPreview = computed(() => form.avatarUrl.trim())

onLoad(async options => {
  if (options?.mode === 'edit') {
    pageMode.value = 'edit'
  }
  await hydrateProfile()
})

const showError = (message: string) => {
  uni.showToast({ title: message, icon: 'none', duration: 2200 })
}

const hydrateProfile = async () => {
  try {
    const response = await onboardingApi.getMyProfile()
    nicknameState.uid = response.uid
    nicknameState.editable = response.nicknameEditable
    nicknameState.changeCount = response.nicknameChangeCount
    onboardingStore.userUid = response.uid

    if (response.profile) {
      form.nickname = response.profile.nickname
      form.avatarUrl = response.profile.avatarUrl
      form.age = String(response.profile.age)
      form.bio = response.profile.bio ?? ''

      onboardingStore.saveProfile({
        nickname: response.profile.nickname,
        avatarUrl: response.profile.avatarUrl,
        age: response.profile.age,
        gender: response.profile.gender,
        sexualOrientation: response.profile.sexualOrientation,
        monthlySpending: response.profile.monthlySpending,
        bio: response.profile.bio ?? '',
      })
    }

    nicknameState.checked = true
    nicknameState.available = true
    nicknameState.lastCheckedValue = form.nickname.trim()
    nicknameState.message = ''
  } catch {
    nicknameState.message = '资料读取失败，请稍后重试'
  }
}

const handleNicknameInput = (event: any) => {
  const nextValue = String(event?.detail?.value ?? '')
    .replace(/\s+/g, '')
    .slice(0, 20)

  if (!nicknameState.editable && form.nickname) {
    return
  }

  form.nickname = nextValue
  nicknameState.checked = false
  nicknameState.available = false
  nicknameState.message = nextValue ? '' : '请填写昵称'

  if (nicknameTimer) {
    clearTimeout(nicknameTimer)
  }

  nicknameTimer = setTimeout(() => {
    void checkNicknameAvailability(nextValue)
  }, 350)
}

const handleAgeInput = (event: any) => {
  form.age = String(event?.detail?.value ?? '')
    .replace(/\D/g, '')
    .slice(0, 2)
}

const handleBioInput = (event: any) => {
  form.bio = String(event?.detail?.value ?? '').slice(0, 140)
}

const chooseAvatar = async () => {
  if (uploadingAvatar.value) return

  try {
    const result = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
    })

    const filePath = result.tempFilePaths?.[0]
    if (!filePath) return

    uploadingAvatar.value = true
    const upload = await onboardingApi.uploadAvatar(filePath)
    form.avatarUrl = upload.file.url
  } catch (error) {
    if (error && typeof error === 'object' && 'errMsg' in error && String((error as any).errMsg).includes('cancel')) {
      return
    }
    showError(error instanceof Error && error.message ? error.message : '头像上传失败')
  } finally {
    uploadingAvatar.value = false
  }
}

const checkNicknameAvailability = async (value = form.nickname) => {
  const normalized = value.trim()
  if (!normalized) {
    nicknameState.checked = false
    nicknameState.available = false
    nicknameState.message = '请填写昵称'
    return
  }

  if (normalized.length < 2) {
    nicknameState.checked = false
    nicknameState.available = false
    nicknameState.message = '昵称至少需要 2 个字符'
    return
  }

  if (!nicknameState.editable && normalized === nicknameState.lastCheckedValue) {
    nicknameState.checked = true
    nicknameState.available = true
    nicknameState.message = ''
    return
  }

  nicknameState.checking = true
  try {
    const result = await onboardingApi.checkNickname(normalized)
    nicknameState.checked = true
    nicknameState.available = result.available
    nicknameState.lastCheckedValue = normalized
    nicknameState.message = result.available ? '' : '昵称已被占用'
  } catch (error) {
    nicknameState.checked = false
    nicknameState.available = false
    nicknameState.message = error instanceof Error && error.message ? error.message : '昵称检查失败'
  } finally {
    nicknameState.checking = false
  }
}

const validate = () => {
  if (!form.nickname.trim()) return '请填写昵称'
  if (form.nickname.trim().length < 2) return '昵称至少需要 2 个字符'
  if (!nicknameState.available) return nicknameState.message || '昵称已被占用'
  if (!form.avatarUrl.trim()) return '请先上传头像'
  if (!/^\d{2}$/.test(form.age) || Number(form.age) < 18 || Number(form.age) > 40) {
    return '请输入合理的年龄'
  }
  return ''
}

const submit = async () => {
  const validationMessage = validate()
  if (validationMessage) {
    showError(validationMessage)
    return
  }

  submitting.value = true

  const payload = {
    nickname: form.nickname.trim(),
    avatarUrl: form.avatarUrl.trim(),
    age: Number(form.age),
    bio: form.bio.trim(),
  }

  try {
    await onboardingApi.updateProfile(payload)
    onboardingStore.saveProfile({
      nickname: payload.nickname,
      avatarUrl: payload.avatarUrl,
      age: payload.age,
      gender: onboardingStore.profile.gender,
      sexualOrientation: onboardingStore.profile.sexualOrientation,
      monthlySpending: onboardingStore.profile.monthlySpending,
      bio: payload.bio,
    })

    if (editMode.value) {
      uni.showToast({ title: '资料已保存', icon: 'success' })
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

    uni.navigateTo({ url: '/pages/onboarding/questionnaire/index' })
  } catch (error) {
    showError(error instanceof Error && error.message ? error.message : '资料保存失败')
    if (payload.nickname) {
      await checkNicknameAvailability(payload.nickname)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppShell
    :eyebrow="editMode ? 'Profile' : 'Step 2'"
    :title="editMode ? '编辑个人资料' : '完善基础资料'"
    :subtitle="
      editMode
        ? '这里单独维护你的展示资料。保存后会直接回到我的资料，不会跳转问卷。'
        : '先把展示资料补完整，再继续填写匹配问卷。性别、性取向和月均开支会在量表中完成。'
    "
  >
    <view class="profile-meta">
      <text class="profile-meta__item">UID: {{ nicknameState.uid || onboardingStore.userUid || '生成中' }}</text>
      <text class="profile-meta__item">昵称修改次数: {{ nicknameState.changeCount }}/1</text>
    </view>

    <view class="form-card">
      <view class="field">
        <text class="field__label">昵称</text>
        <input
          :value="form.nickname"
          class="field__input"
          maxlength="20"
          :disabled="!nicknameState.editable && Boolean(form.nickname)"
          placeholder="别人会先看到的名字"
          @input="handleNicknameInput"
          @blur="checkNicknameAvailability()"
        />
        <text class="field__hint">昵称仅可修改一次</text>
        <text v-if="nicknameState.message" class="field__hint field__hint--error">
          {{ nicknameState.message }}
        </text>
      </view>

      <view class="field">
        <text class="field__label">头像</text>
        <view class="avatar-panel">
          <image v-if="avatarPreview" class="avatar-panel__image" :src="avatarPreview" mode="aspectFill" />
          <view v-else class="avatar-panel__placeholder">
            <text>{{ form.nickname.slice(0, 1) || '上传' }}</text>
          </view>

          <button class="avatar-panel__action" :disabled="uploadingAvatar.value" @tap="chooseAvatar">
            {{ uploadingAvatar.value ? '上传中...' : avatarPreview ? '更换头像' : '上传头像' }}
          </button>
        </view>
      </view>

      <view class="grid">
        <view class="field">
          <text class="field__label">年龄</text>
          <input
            :value="form.age"
            class="field__input"
            maxlength="2"
            type="number"
            placeholder="20"
            @input="handleAgeInput"
          />
        </view>
      </view>

      <view class="field">
        <text class="field__label">自我介绍</text>
        <textarea
          :value="form.bio"
          class="field__textarea"
          maxlength="140"
          placeholder="一句话介绍你的相处感觉、校园日常，或者你想认真认识什么样的人。"
          @input="handleBioInput"
        />
      </view>
    </view>

    <button class="submit" :disabled="submitting.value" @tap="submit">
      {{ submitting.value ? '保存中...' : editMode ? '保存资料' : '继续填写匹配问卷' }}
    </button>
  </AppShell>
</template>

<style lang="scss" scoped>
.profile-meta,
.form-card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: var(--cm-surface);
  border: 1rpx solid var(--cm-border);
}

.profile-meta__item,
.field__label,
.field__hint {
  font-size: 24rpx;
  color: var(--cm-text-soft);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18rpx;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.field__input,
.field__textarea {
  width: 100%;
  min-height: 92rpx;
  padding: 24rpx;
  border-radius: 22rpx;
  border: 1rpx solid var(--cm-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--cm-text);
  font-size: 28rpx;
}

.field__textarea {
  min-height: 220rpx;
  line-height: 1.7;
}

.avatar-panel {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: 22rpx;
  border: 1rpx solid var(--cm-border);
  background: rgba(255, 255, 255, 0.04);
}

.avatar-panel__image,
.avatar-panel__placeholder {
  width: 132rpx;
  height: 132rpx;
  border-radius: 32rpx;
  flex-shrink: 0;
}

.avatar-panel__image {
  background: rgba(255, 255, 255, 0.08);
}

.avatar-panel__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(232, 93, 117, 0.28), rgba(255, 255, 255, 0.08));
  color: #fff;
  font-size: 40rpx;
  font-weight: 700;
}

.avatar-panel__action {
  min-width: 180rpx;
  height: 92rpx;
  padding: 0 28rpx;
  border-radius: 22rpx;
  background: rgba(232, 93, 117, 0.14);
  border: 1rpx solid rgba(232, 93, 117, 0.35);
  color: var(--cm-text);
  font-size: 26rpx;
}

.field__hint--error {
  color: #ffb1be;
}

.avatar-panel__action::after,
.submit::after {
  border: none;
}

.submit {
  border-radius: 24rpx;
  background: var(--cm-accent);
  font-size: 28rpx;
  color: #fff;
}
</style>
