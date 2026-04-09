import { defineStore } from 'pinia'

import type {
  BasicProfile,
  PreferenceForm,
  RegisterDraft,
  TagResult,
  TraitResult,
} from '@/types/onboarding'
import { buildQuestionnaireResult, questionnaireBank } from '@/utils/question-bank'

const STORAGE_KEY = 'campus-match-onboarding'

const emptyRegisterDraft: RegisterDraft = {
  username: '',
  email: '',
  emailCode: '',
  password: '',
  confirmPassword: '',
}

const emptyProfile: BasicProfile = {
  nickname: '',
  avatarUrl: '',
  age: null,
  gender: '',
  sexualOrientation: '',
  monthlySpending: null,
  bio: '',
}

const emptyPreferences: PreferenceForm = {
  preferredGenders: [],
  ageMin: 18,
  ageMax: 35,
  relationshipGoal: 'SERIOUS',
  intimacyPreference: 'BALANCED',
  valuePriority: 'STABILITY',
  emotionalStyle: 'WARM',
}

interface OnboardingState {
  userUid: string
  registerDraft: RegisterDraft
  profile: BasicProfile
  questionnaireAnswers: Record<string, string>
  traits: TraitResult[]
  tags: TagResult[]
  preferences: PreferenceForm
  registered: boolean
  profileCompleted: boolean
  questionnaireCompleted: boolean
  preferencesCompleted: boolean
}

export const useOnboardingStore = defineStore('onboarding', {
  state: (): OnboardingState => ({
    registerDraft: { ...emptyRegisterDraft },
    userUid: '',
    profile: { ...emptyProfile },
    questionnaireAnswers: {},
    traits: [],
    tags: [],
    preferences: { ...emptyPreferences },
    registered: false,
    profileCompleted: false,
    questionnaireCompleted: false,
    preferencesCompleted: false,
  }),
  getters: {
    questionnaire: () => questionnaireBank,
    isFullyReady: state =>
      state.registered &&
      state.profileCompleted &&
      state.questionnaireCompleted,
  },
  actions: {
    bootstrap() {
      const saved = uni.getStorageSync(STORAGE_KEY)
      if (saved && typeof saved === 'object') {
        Object.assign(this, saved)
      }
    },
    persist() {
      uni.setStorageSync(STORAGE_KEY, {
        registerDraft: this.registerDraft,
        userUid: this.userUid,
        profile: this.profile,
        questionnaireAnswers: this.questionnaireAnswers,
        traits: this.traits,
        tags: this.tags,
        preferences: this.preferences,
        registered: this.registered,
        profileCompleted: this.profileCompleted,
        questionnaireCompleted: this.questionnaireCompleted,
        preferencesCompleted: this.preferencesCompleted,
      })
    },
    reset() {
      this.registerDraft = { ...emptyRegisterDraft }
      this.userUid = ''
      this.profile = { ...emptyProfile }
      this.questionnaireAnswers = {}
      this.traits = []
      this.tags = []
      this.preferences = { ...emptyPreferences }
      this.registered = false
      this.profileCompleted = false
      this.questionnaireCompleted = false
      this.preferencesCompleted = false
      uni.removeStorageSync(STORAGE_KEY)
    },
    saveRegisterDraft(payload: RegisterDraft) {
      this.registerDraft = payload
      this.registered = true
      this.persist()
    },
    syncFromCurrentUser(payload: {
      uid?: string
      username?: string
      email: string
      phone: string
      onboardingState: {
        registered: boolean
        profileCompleted: boolean
        questionnaireCompleted: boolean
        preferencesCompleted: boolean
      }
    }) {
      this.registerDraft = {
        ...this.registerDraft,
        username: payload.username ?? this.registerDraft.username,
        email: payload.email ?? this.registerDraft.email,
      }
      this.userUid = payload.uid ?? this.userUid
      this.registered = Boolean(payload.onboardingState.registered)
      this.profileCompleted = Boolean(payload.onboardingState.profileCompleted)
      this.questionnaireCompleted = Boolean(payload.onboardingState.questionnaireCompleted)
      this.preferencesCompleted = Boolean(payload.onboardingState.preferencesCompleted)
      this.persist()
    },
    saveProfile(payload: BasicProfile) {
      this.profile = payload
      this.profileCompleted = true
      this.persist()
    },
    saveQuestionnaire(answers: Record<string, string>) {
      this.questionnaireAnswers = answers
      const result = buildQuestionnaireResult(answers)
      this.traits = result.traits
      this.tags = result.tags
      this.questionnaireCompleted = true
      this.preferencesCompleted = true
      this.persist()
    },
    savePreferences(payload: PreferenceForm) {
      this.preferences = payload
      this.preferencesCompleted = true
      this.persist()
    },
    applyQuestionnaireResult(result: { answers?: Record<string, string>; tags?: Array<string | TagResult>; traits?: TraitResult[] }) {
      this.questionnaireAnswers = result.answers ?? this.questionnaireAnswers
      this.tags = (result.tags ?? []).map(item =>
        typeof item === 'string' ? { group: 'derived', label: item } : item,
      )
      this.traits = result.traits ?? this.traits
      this.questionnaireCompleted = true
      this.preferencesCompleted = true
      this.persist()
    },
    applyPreferences(payload: PreferenceForm) {
      this.preferences = payload
      this.preferencesCompleted = true
      this.persist()
    },
    getNextRoute() {
      if (!this.registered) return '/pages/onboarding/register/index'
      if (!this.profileCompleted) return '/pages/onboarding/basic-profile/index'
      if (!this.questionnaireCompleted) return '/pages/onboarding/questionnaire/index'
      return '/pages/home/index'
    },
  },
})
