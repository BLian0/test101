export type ConnectionState = 'WAITING_FIRST_MESSAGE' | 'WAITING_REPLY' | 'MUTUAL_CHAT'

export interface MatchReason {
  title: string
  detail: string
}

export interface PromptBlock {
  id: string
  question: string
  answer: string
}

export interface MatchProfile {
  id: number
  name: string
  age: number
  school: string
  gradeLabel: string
  identityLabel: string
  compatibility: number
  compatibilityLabel: string
  heroTone: 'coral' | 'sage' | 'ink'
  intro: string
  tags: string[]
  personalityTags: string[]
  relationshipIntent: string
  reasons: MatchReason[]
  promptPreview: PromptBlock
  prompts: PromptBlock[]
  campusMoments: string[]
  connectionState: ConnectionState | null
  actionState: 'LIKE' | 'PASS' | null
  connectionId: number | null
  conversationId: number | null
  canSendFirstMessage: boolean
  canMutualChat: boolean
}

export interface MessagePreview {
  id: number
  targetUserId: number
  name: string
  school: string
  gradeLabel: string
  snippet: string
  updatedAt: string
  unread: number
  accent: 'coral' | 'sage' | 'ink'
  state: ConnectionState
  stateLabel: string
  stateHint: string
  conversationId: number | null
  canSendFirstMessage: boolean
  canMutualChat: boolean
}

export interface ChatMessage {
  id: number
  conversationId: number
  senderRole: 'SELF' | 'TARGET'
  type: 'TEXT' | 'IMAGE' | 'VOICE'
  content: string
  createdAt: string
}
