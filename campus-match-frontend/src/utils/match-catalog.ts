import type { ConnectionState, MatchProfile, MatchReason, MessagePreview, PromptBlock } from '@/types/models'

type HeroTone = MatchProfile['heroTone']

interface CatalogEntry {
  gradeLabel: string
  identityLabel: string
  relationshipIntent: string
  heroTone: HeroTone
  prompts: PromptBlock[]
  campusMoments: string[]
  personalityTags: string[]
}

const catalog: Record<number, CatalogEntry> = {
  1001: {
    gradeLabel: '研一 · 软件学院',
    identityLabel: '同校认真了解中',
    relationshipIntent: '更偏长期关系',
    heroTone: 'coral',
    prompts: [
      {
        id: 'p1',
        question: '最近最想认真投入的一件事',
        answer: '把生活过得更稳一点，也想认识一个愿意认真沟通的人。',
      },
      {
        id: 'p2',
        question: '理想中的一次校园见面',
        answer: '傍晚在西山慢慢走，聊彼此最近在意的事情，最后去喝一杯热饮。',
      },
      {
        id: 'p3',
        question: '我会被什么样的人吸引',
        answer: '有边界感，但不会把真诚藏起来的人。',
      },
    ],
    campusMoments: ['常去伯川图书馆', '晚上更适合散步聊天', '周末愿意留给固定的人'],
    personalityTags: ['认真投入', '边界清晰', '慢热但稳定'],
  },
  1002: {
    gradeLabel: '大四 · 经管学院',
    identityLabel: '偏慢热的内容型选手',
    relationshipIntent: '先建立信任，再推进关系',
    heroTone: 'sage',
    prompts: [
      {
        id: 'p1',
        question: '朋友会怎么形容我',
        answer: '不是场子里最热闹的那个，但熟起来以后会很有陪伴感。',
      },
      {
        id: 'p2',
        question: '我理想中的相处节奏',
        answer: '不需要每天都轰轰烈烈，但希望彼此都认真回应。',
      },
      {
        id: 'p3',
        question: '如果周末突然空下来',
        answer: '我会在校园里走一圈，买杯咖啡，然后找个安静的地方待着。',
      },
    ],
    campusMoments: ['常出没经管楼附近', '喜欢安静咖啡馆', '对稳定规划很上心'],
    personalityTags: ['慢热', '规划感强', '稳定型'],
  },
  1003: {
    gradeLabel: '大三 · 建筑与艺术学院',
    identityLabel: '愿意自然推进关系',
    relationshipIntent: '先从真实相处开始',
    heroTone: 'ink',
    prompts: [
      {
        id: 'p1',
        question: '和我聊天最容易聊到什么',
        answer: '最近看到的好天气、校园里好吃的东西，还有一些不太重要但很可爱的细节。',
      },
      {
        id: 'p2',
        question: '我在关系里最重视',
        answer: '不是完美契合，而是双方都愿意把话说明白。',
      },
      {
        id: 'p3',
        question: '适合和我见面的方式',
        answer: '先在学校里见一面，不用刻意安排太满，留一点自然发生的空间。',
      },
    ],
    campusMoments: ['周末会去校外看展', '喜欢校园里的傍晚光线', '对聊天氛围很敏感'],
    personalityTags: ['自然推进', '有情绪感', '真诚表达'],
  },
}

const toneMap: Record<HeroTone, string> = {
  coral: '#e06d82',
  sage: '#6f8379',
  ink: '#51657e',
}

const buildCompatibilityLabel = (score: number) => {
  if (score >= 95) return '高匹配'
  if (score >= 88) return '值得认真看看'
  return '有继续了解的空间'
}

const buildReasonBlocks = (reasons: string[], entry: CatalogEntry): MatchReason[] => {
  const base = reasons.slice(0, 3).map(reason => ({
    title: reason,
    detail: '这不是表面标签相似，而是你们在节奏、边界和关系期待上更容易对得上。',
  }))

  if (base.length >= 3) {
    return base
  }

  return [
    ...base,
    {
      title: '都更偏认真回应的人',
      detail: `从资料和问卷看，对方属于“${entry.relationshipIntent}”这一类，不会把连接只停留在一句打招呼。`,
    },
  ].slice(0, 3)
}

export function getToneColor(tone: HeroTone) {
  return toneMap[tone]
}

export function buildMatchProfile(raw: Record<string, unknown>): MatchProfile {
  const id = Number(raw.userId)
  const entry = catalog[id] ?? catalog[1001]
  const tags = Array.isArray(raw.tags) ? raw.tags.map(tag => String(tag)) : []
  const reasons = Array.isArray(raw.reasons) ? raw.reasons.map(reason => String(reason)) : []

  return {
    id,
    name: String(raw.name),
    age: Number(raw.age),
    school: String(raw.school),
    gradeLabel: entry.gradeLabel,
    identityLabel: entry.identityLabel,
    compatibility: Number(raw.matchScore),
    compatibilityLabel: buildCompatibilityLabel(Number(raw.matchScore)),
    heroTone: entry.heroTone,
    intro: String(raw.intro ?? ''),
    tags,
    personalityTags: entry.personalityTags,
    relationshipIntent: entry.relationshipIntent,
    reasons: buildReasonBlocks(reasons, entry),
    promptPreview: entry.prompts[0],
    prompts: entry.prompts,
    campusMoments: entry.campusMoments,
    connectionState: null,
    actionState: raw.actionState === 'LIKE' || raw.actionState === 'PASS' ? raw.actionState : null,
    connectionId: null,
    conversationId: null,
    canSendFirstMessage: false,
    canMutualChat: false,
  }
}

export function attachConnectionState(
  profile: MatchProfile,
  payload: {
    state: ConnectionState
    connectionId: number
    conversationId: number | null
    canSendFirstMessage: boolean
    canMutualChat: boolean
  },
) {
  return {
    ...profile,
    actionState: 'LIKE' as const,
    connectionState: payload.state,
    connectionId: payload.connectionId,
    conversationId: payload.conversationId,
    canSendFirstMessage: payload.canSendFirstMessage,
    canMutualChat: payload.canMutualChat,
  }
}

export function buildMessagePreview(raw: Record<string, unknown>): MessagePreview {
  const targetUserId = Number(raw.targetUserId)
  const entry = catalog[targetUserId] ?? catalog[1001]
  const state = String(raw.state) as ConnectionState
  const stateMap: Record<ConnectionState, { label: string; hint: string }> = {
    WAITING_FIRST_MESSAGE: {
      label: '等你发起第一条消息',
      hint: '这次连接还没开始，先说一句真正想了解对方的话。',
    },
    WAITING_REPLY: {
      label: '等待对方回复后开放双向聊天',
      hint: '你已经发出首条消息，现在更适合给对方一点回应时间。',
    },
    MUTUAL_CHAT: {
      label: '已经进入正常聊天',
      hint: '可以继续聊下去，也可以点开资料再看看为什么匹配。',
    },
  }

  return {
    id: Number(raw.id),
    targetUserId,
    name: String(raw.targetName),
    school: String(raw.targetSchool),
    gradeLabel: entry.gradeLabel,
    snippet: String(raw.lastMessageSnippet ?? ''),
    updatedAt: String(raw.lastMessageAt),
    unread: Number(raw.unreadCount ?? 0),
    accent: entry.heroTone,
    state,
    stateLabel: stateMap[state].label,
    stateHint: stateMap[state].hint,
    conversationId: raw.conversationId == null ? null : Number(raw.conversationId),
    canSendFirstMessage: Boolean(raw.canSendFirstMessage),
    canMutualChat: Boolean(raw.canMutualChat),
  }
}

export function getCatalogProfileById(id: number) {
  const entry = catalog[id]
  if (!entry) return null

  return {
    heroTone: entry.heroTone,
    prompts: entry.prompts,
    campusMoments: entry.campusMoments,
    personalityTags: entry.personalityTags,
    gradeLabel: entry.gradeLabel,
    identityLabel: entry.identityLabel,
    relationshipIntent: entry.relationshipIntent,
  }
}
