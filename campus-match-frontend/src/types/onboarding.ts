export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY'
export type Orientation = 'MALE' | 'FEMALE' | 'ALL'

export interface RegisterDraft {
  username: string
  email: string
  emailCode: string
  password: string
  confirmPassword: string
}

export interface BasicProfile {
  nickname: string
  avatarUrl: string
  age: number | null
  gender: Gender | ''
  sexualOrientation: Orientation | ''
  monthlySpending: number | null
  bio: string
}

export interface QuestionnaireOption {
  value: string
  label: string
}

export interface QuestionnaireQuestion {
  id: string
  section: string
  title: string
  description: string
  type: 'slider' | 'single'
  leftLabel?: string
  middleLabel?: string
  rightLabel?: string
  options?: QuestionnaireOption[]
}

export interface PreferenceForm {
  preferredGenders: Orientation[]
  ageMin: number
  ageMax: number
  relationshipGoal: 'SERIOUS' | 'EXPLORE' | 'BOTH'
  intimacyPreference: 'CONSERVATIVE' | 'BALANCED' | 'OPEN'
  valuePriority: 'STABILITY' | 'GROWTH' | 'FREEDOM'
  emotionalStyle: 'CALM' | 'DIRECT' | 'WARM'
}

export interface TraitResult {
  code: string
  label: string
  value: number
}

export interface TagResult {
  group: string
  label: string
}
