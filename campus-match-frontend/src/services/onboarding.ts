import { request, uploadFile } from './api'
import type { QuestionnaireQuestion, TagResult, TraitResult } from '@/types/onboarding'
type UploadSource = string | File | Blob

export const onboardingApi = {
  sendEmailCode(payload: { email: string; scene: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD' }) {
    return request<{ message: string; email: string; scene: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD'; expiresAt: string }>('/auth/email/send-code', {
      method: 'POST',
      data: payload,
    })
  },
  register(payload: {
    username: string
    email: string
    emailCode: string
    password: string
  }) {
    return request<{ accessToken: string; user: { id: number; uid: string; username: string; email: string; phone: string } }>(
      '/auth/register',
      {
        method: 'POST',
        data: payload,
      },
    )
  },
  loginByEmail(payload: { email: string; password: string }) {
    return request<{ accessToken: string; userId: number }>('/auth/login/email', {
      method: 'POST',
      data: payload,
    })
  },
  resetPassword(payload: { email: string; emailCode: string; password: string }) {
    return request<{ message: string }>('/auth/password/reset', {
      method: 'POST',
      data: payload,
    })
  },
  getCurrentUser() {
    return request<{
      id: number
      uid: string
      username: string
      email: string
      phone: string
      onboardingState: {
        registered: boolean
        profileCompleted: boolean
        questionnaireCompleted: boolean
        preferencesCompleted: boolean
      }
    }>('/auth/me')
  },
  getMyProfile() {
    return request<{
      uid: string
      nicknameEditable: boolean
      nicknameChangeCount: number
      profile: null | {
        nickname: string
        avatarUrl: string
        age: number
        gender: 'MALE' | 'FEMALE' | 'NON_BINARY'
        sexualOrientation: 'MALE' | 'FEMALE' | 'ALL'
        monthlySpending: number
        bio?: string
        nicknameChangeCount?: number
      }
    }>('/profile/me')
  },
  checkNickname(nickname: string) {
    return request<{ nickname: string; available: boolean }>(
      `/profile/nickname/check?nickname=${encodeURIComponent(nickname)}`,
    )
  },
  getSchoolRules() {
    return request<string[]>('/public/schools/current/email-rules')
  },
  updateProfile(payload: Record<string, unknown>) {
    return request('/profile/me', {
      method: 'PUT',
      data: payload,
    })
  },
  getActiveQuestionnaire() {
    return request<{ items: QuestionnaireQuestion[] }>('/questionnaires/active/questions')
  },
  submitQuestionnaire(payload: { questionnaireVersionId?: number; answers: Array<{ questionId: string; answerValue: string }> }) {
    return request<{ message: string; result: { answers: Record<string, string>; tags: TagResult[]; traits: TraitResult[]; profile?: {
      nickname: string
      avatarUrl: string
      age: number
      gender: 'MALE' | 'FEMALE' | 'NON_BINARY'
      sexualOrientation: 'MALE' | 'FEMALE' | 'ALL'
      monthlySpending: number
      bio?: string
      nicknameChangeCount?: number
    } } }>('/questionnaires/sessions/submit', {
      method: 'POST',
      data: payload,
    })
  },
  getQuestionnaireResult() {
    return request('/questionnaires/me/result')
  },
  updatePreferences(payload: Record<string, unknown>) {
    return request('/preferences/me', {
      method: 'PUT',
      data: payload,
    })
  },
  getPreferences() {
    return request('/preferences/me')
  },
  getRecommendations() {
    return request<{ items: Array<Record<string, unknown>> }>('/recommendations')
  },
  likeRecommendation(targetUserId: number) {
    return request<{ connectionId: number; state: string }>(`/recommendations/${targetUserId}/like`, {
      method: 'POST',
    })
  },
  passRecommendation(targetUserId: number) {
    return request<{ targetUserId: number }>(`/recommendations/${targetUserId}/pass`, {
      method: 'POST',
    })
  },
  getConnections() {
    return request<{ items: Array<Record<string, unknown>> }>('/connections')
  },
  getConnectionDetail(connectionId: number) {
    return request<Record<string, unknown>>(`/connections/${connectionId}`)
  },
  sendFirstMessage(connectionId: number, payload: { content: string }) {
    return request<{ connection: Record<string, unknown> }>(`/connections/${connectionId}/first-message`, {
      method: 'POST',
      data: payload,
    })
  },
  getConversationMessages(conversationId: number) {
    return request<{ items: Array<Record<string, unknown>> }>(`/conversations/${conversationId}/messages`)
  },
  sendTextMessage(conversationId: number, payload: { content: string }) {
    return request<{ items: Array<Record<string, unknown>> }>(`/conversations/${conversationId}/messages/text`, {
      method: 'POST',
      data: payload,
    })
  },
  sendImageMessage(conversationId: number, payload: { imageUrl: string }) {
    return request<{ items: Array<Record<string, unknown>> }>(`/conversations/${conversationId}/messages/image`, {
      method: 'POST',
      data: payload,
    })
  },
  sendVoiceMessage(conversationId: number, payload: { voiceUrl: string }) {
    return request<{ items: Array<Record<string, unknown>> }>(`/conversations/${conversationId}/messages/voice`, {
      method: 'POST',
      data: payload,
    })
  },
  uploadChatImage(filePath: UploadSource) {
    return uploadFile('/uploads/chat-image', filePath)
  },
  uploadChatVoice(filePath: UploadSource) {
    return uploadFile('/uploads/chat-voice', filePath)
  },
  uploadAvatar(filePath: UploadSource) {
    return uploadFile('/uploads/avatar', filePath)
  },
  createReport(payload: { targetUserId: number; category: string; description: string }) {
    return request<{ report: Record<string, unknown> }>('/reports', {
      method: 'POST',
      data: payload,
    })
  },
  getMyReports() {
    return request<{ items: Array<Record<string, unknown>> }>('/reports/me')
  },
  createBlock(payload: { blockedUserId: number }) {
    return request<{ items: Array<Record<string, unknown>> }>('/blocks', {
      method: 'POST',
      data: payload,
    })
  },
  getBlocks() {
    return request<{ items: Array<Record<string, unknown>> }>('/blocks')
  },
  removeBlock(blockedUserId: number) {
    return request<{ items: Array<Record<string, unknown>> }>(`/blocks/${blockedUserId}`, {
      method: 'DELETE',
    })
  },
}
