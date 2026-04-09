import type { BasicProfile, QuestionnaireQuestion, TagResult, TraitResult } from '@/types/onboarding'

export const questionnaireBank: QuestionnaireQuestion[] = [
  {
    id: 'P01',
    section: '基础信息',
    type: 'single',
    title: '你的性别是？',
    description: '这会直接参与推荐筛选，不再在资料页重复填写。',
    options: [
      { value: 'MALE', label: '男生' },
      { value: 'FEMALE', label: '女生' },
      { value: 'NON_BINARY', label: '其他 / 非二元' },
    ],
  },
  {
    id: 'P02',
    section: '基础信息',
    type: 'single',
    title: '你的性取向更接近哪一种？',
    description: '这会直接参与推荐筛选，不再在资料页重复填写。',
    options: [
      { value: 'MALE', label: '喜欢男生' },
      { value: 'FEMALE', label: '喜欢女生' },
      { value: 'ALL', label: '男女都可以' },
    ],
  },
  {
    id: 'P03',
    section: '基础信息',
    type: 'single',
    title: '你目前每月平均开支大概在哪个区间？',
    description: '这里只记录大致区间，用来辅助理解生活方式和消费节奏。',
    options: [
      { value: 'LT1500', label: '1500 以下' },
      { value: '1500_2500', label: '1500 - 2500' },
      { value: '2500_4000', label: '2500 - 4000' },
      { value: 'GE4000', label: '4000 以上' },
    ],
  },
  {
    id: 'Q01',
    section: '依恋与亲密',
    type: 'slider',
    title: '在关系里，你对“亲密和靠近”的舒适度更接近哪边？',
    description: '衡量你对亲密推进速度的接受程度。',
    leftLabel: '很快就能靠近',
    middleLabel: '看关系自然推进',
    rightLabel: '需要更久建立信任',
  },
  {
    id: 'Q02',
    section: '依恋与亲密',
    type: 'slider',
    title: '即使在亲密关系里，你对个人空间的需求更接近哪边？',
    description: '衡量你对陪伴和空间的平衡偏好。',
    leftLabel: '更偏高频陪伴',
    middleLabel: '陪伴和空间都要',
    rightLabel: '个人空间非常重要',
  },
  {
    id: 'Q03',
    section: '依恋与亲密',
    type: 'slider',
    title: '当关系出现不确定时，你受情绪影响的程度更接近哪边？',
    description: '衡量你在关系中的敏感度。',
    leftLabel: '基本不太受影响',
    middleLabel: '会在意但能调整',
    rightLabel: '会明显影响情绪',
  },
  {
    id: 'Q04',
    section: '依恋与亲密',
    type: 'slider',
    title: '你愿意让别人看到自己脆弱一面的程度更接近哪边？',
    description: '衡量情感开放和暴露边界。',
    leftLabel: '比较容易敞开',
    middleLabel: '要慢慢建立',
    rightLabel: '很难主动暴露脆弱',
  },
  {
    id: 'Q05',
    section: '关系投入',
    type: 'slider',
    title: '在决定开始一段关系前，你会有多谨慎？',
    description: '衡量开启关系前的审慎程度。',
    leftLabel: '感觉对了就可以开始',
    middleLabel: '会边了解边判断',
    rightLabel: '会反复确认后才开始',
  },
  {
    id: 'Q06',
    section: '关系投入',
    type: 'slider',
    title: '一旦进入关系，你对“稳定承诺”的重视程度更接近哪边？',
    description: '衡量长期承诺倾向。',
    leftLabel: '不用太快谈稳定',
    middleLabel: '顺其自然形成稳定',
    rightLabel: '希望关系尽量明确稳定',
  },
  {
    id: 'Q07',
    section: '关系投入',
    type: 'single',
    title: '你对“长期模糊但彼此默认”的关系状态更接近哪种态度？',
    description: '这是立场题，不适合强行用滑杆表示。',
    options: [
      { value: 'LOOSE', label: '能接受，只要相处舒服' },
      { value: 'SHORT_TERM', label: '短期可以，长期不太行' },
      { value: 'CLEAR', label: '不接受，关系应该尽量明确' },
    ],
  },
  {
    id: 'Q08',
    section: '关系投入',
    type: 'slider',
    title: '当关系遇到困难时，你愿意继续修复和投入的程度更接近哪边？',
    description: '衡量修复意愿和投入韧性。',
    leftLabel: '不合适就及时退出',
    middleLabel: '看问题大小决定',
    rightLabel: '只要值得就愿意认真修复',
  },
  {
    id: 'Q09',
    section: '权力与边界',
    type: 'slider',
    title: '在多数关系问题上，你理想中的决策方式更接近哪边？',
    description: '衡量平等协商和主导结构。',
    leftLabel: '完全平等协商',
    middleLabel: '大体平等，必要时分工',
    rightLabel: '更接受一方主导拍板',
  },
  {
    id: 'Q10',
    section: '权力与边界',
    type: 'slider',
    title: '你希望伴侣参与自己人生决策的程度更接近哪边？',
    description: '衡量关系介入深度。',
    leftLabel: '尽量各自独立决定',
    middleLabel: '重大问题可以讨论',
    rightLabel: '希望彼此深度参与决定',
  },
  {
    id: 'Q11',
    section: '权力与边界',
    type: 'slider',
    title: '在关系里，你对“排他性边界”的要求更接近哪边？',
    description: '衡量潜在竞争对象的边界意识。',
    leftLabel: '相对宽松，彼此信任即可',
    middleLabel: '有边界，但不必太严格',
    rightLabel: '希望排他性边界非常清晰',
  },
  {
    id: 'Q12',
    section: '权力与边界',
    type: 'slider',
    title: '你对关系中的“行程和信息透明度”的需求更接近哪边？',
    description: '衡量透明需求。',
    leftLabel: '不用频繁说明日常',
    middleLabel: '关键事情要说清楚',
    rightLabel: '希望很多细节都比较透明',
  },
  {
    id: 'Q13',
    section: '价值观坐标',
    type: 'slider',
    title: '在很多关系问题上，你更接近哪边？',
    description: '自由表达 vs 规则秩序。',
    leftLabel: '自由表达更重要',
    middleLabel: '两者都需要',
    rightLabel: '规则和秩序更重要',
  },
  {
    id: 'Q14',
    section: '价值观坐标',
    type: 'slider',
    title: '在人生选择里，你更接近哪边？',
    description: '个人理想 vs 共同体责任。',
    leftLabel: '个人理想优先',
    middleLabel: '尽量平衡',
    rightLabel: '家庭 / 共同体责任更优先',
  },
  {
    id: 'Q15',
    section: '价值观坐标',
    type: 'slider',
    title: '面对生活变化，你更接近哪边？',
    description: '变化探索 vs 稳定确定。',
    leftLabel: '变化和可能性更吸引我',
    middleLabel: '稳定和变化都可以',
    rightLabel: '稳定和确定更重要',
  },
  {
    id: 'Q16',
    section: '价值观坐标',
    type: 'single',
    title: '你对关系中的分工和角色更接近哪种看法？',
    description: '这是立场题，不适合用滑杆。',
    options: [
      { value: 'EQUAL', label: '越平等越好，角色不应预设' },
      { value: 'FLEXIBLE', label: '可以分工，但不必固定' },
      { value: 'TRADITIONAL', label: '更接受相对传统的角色分配' },
    ],
  },
  {
    id: 'Q17',
    section: '价值观坐标',
    type: 'slider',
    title: '在你心里，关系更应该建立在什么之上？',
    description: '情感共鸣 vs 现实支撑。',
    leftLabel: '更重要的是情感和理解',
    middleLabel: '情感与现实都要',
    rightLabel: '更重要的是稳定和现实支撑',
  },
  {
    id: 'Q18',
    section: '价值观坐标',
    type: 'slider',
    title: '消费和生活方式上，你更接近哪边？',
    description: '体验享受 vs 节制规划。',
    leftLabel: '体验和当下感更重要',
    middleLabel: '该花花该省省',
    rightLabel: '节制规划更重要',
  },
  {
    id: 'Q19',
    section: '价值观坐标',
    type: 'single',
    title: '你对关系中的性观念更接近哪种态度？',
    description: '这是离散态度题。',
    options: [
      { value: 'OPEN', label: '比较开放，觉得可以坦然讨论' },
      { value: 'BALANCED', label: '理性沟通，看双方边界' },
      { value: 'CONSERVATIVE', label: '相对保守，需要更强安全感' },
    ],
  },
  {
    id: 'Q20',
    section: '人格与生活风格',
    type: 'slider',
    title: '你的情绪表达风格更接近哪边？',
    description: '衡量表达强度。',
    leftLabel: '很直接、情绪明显',
    middleLabel: '适度表达',
    rightLabel: '比较克制和收着',
  },
  {
    id: 'Q21',
    section: '人格与生活风格',
    type: 'single',
    title: '发生冲突时，你第一反应更接近哪种？',
    description: '离散处理风格。',
    options: [
      { value: 'DIRECT', label: '先直接说开' },
      { value: 'ADAPTIVE', label: '先观察情境再处理' },
      { value: 'CALM', label: '先冷静，晚一点再谈' },
    ],
  },
  {
    id: 'Q22',
    section: '人格与生活风格',
    type: 'single',
    title: '你理想中的校园恋爱氛围更接近哪种？',
    description: '唯一保留的校园场景题。',
    options: [
      { value: 'STEADY', label: '低调、稳定、慢慢相处' },
      { value: 'BALANCED', label: '自然平衡，动静都可以' },
      { value: 'INTENSE', label: '热度更高，参与彼此生活更多' },
    ],
  },
  {
    id: 'Q23',
    section: '人格与生活风格',
    type: 'slider',
    title: '你的社交活跃度更接近哪边？',
    description: '外向活跃 vs 安静低社交。',
    leftLabel: '很爱热闹和活动',
    middleLabel: '看场合和心情',
    rightLabel: '更喜欢安静低社交',
  },
  {
    id: 'Q24',
    section: '人格与生活风格',
    type: 'slider',
    title: '你的生活节奏更接近哪边？',
    description: '随性流动 vs 条理计划。',
    leftLabel: '更随性，边走边看',
    middleLabel: '基本稳定',
    rightLabel: '很有计划和秩序',
  },
  {
    id: 'Q25',
    section: '人格与生活风格',
    type: 'slider',
    title: '面对压力和任务时，你更接近哪边？',
    description: '慢热消化 vs 直接推进。',
    leftLabel: '更容易拖着慢慢消化',
    middleLabel: '看情况',
    rightLabel: '倾向立刻处理和推进',
  },
]

const sliderScore = (answers: Record<string, string>, ids: string[]) => {
  const values = ids
    .map(id => Number(answers[id] ?? 5))
    .filter(value => Number.isFinite(value))

  if (!values.length) {
    return 50
  }

  const avg = values.reduce((sum, value) => sum + value, 0) / values.length
  return Math.round(((avg - 1) / 8) * 100)
}

const pickSingleScore = (answer: string | undefined, map: Record<string, number>, fallback = 50) =>
  map[answer ?? ''] ?? fallback

const spendingValueMap: Record<string, number> = {
  LT1500: 1200,
  '1500_2500': 2000,
  '2500_4000': 3200,
  GE4000: 4500,
}

export const buildQuestionnaireResult = (answers: Record<string, string>) => {
  const relationshipCommitment = Math.round(
    (sliderScore(answers, ['Q05', 'Q06', 'Q08']) + pickSingleScore(answers.Q07, { LOOSE: 20, SHORT_TERM: 58, CLEAR: 90 })) /
      2,
  )
  const physicalIntimacy = Math.round(
    (sliderScore(answers, ['Q01', 'Q02', 'Q04']) + pickSingleScore(answers.Q19, { OPEN: 82, BALANCED: 56, CONSERVATIVE: 28 })) /
      2,
  )
  const socialEnergy = sliderScore(answers, ['Q23'])
  const consumptionStyle = Math.round((sliderScore(answers, ['Q18']) + sliderScore(answers, ['Q17'])) / 2)
  const conflictStyle = Math.round(
    (sliderScore(answers, ['Q20', 'Q24', 'Q25']) + pickSingleScore(answers.Q21, { DIRECT: 76, ADAPTIVE: 58, CALM: 34 })) / 2,
  )

  const traits: TraitResult[] = [
    { code: 'relationship_commitment', label: '关系投入', value: relationshipCommitment },
    { code: 'physical_intimacy', label: '亲密边界', value: physicalIntimacy },
    { code: 'social_energy', label: '社交活跃度', value: socialEnergy },
    { code: 'consumption_style', label: '消费风格', value: consumptionStyle },
    { code: 'conflict_style', label: '冲突处理风格', value: conflictStyle },
  ]

  const tags: TagResult[] = [
    { group: 'attachment', label: Number(answers.Q01 ?? 5) >= 7 ? '慢热靠近型' : '自然靠近型' },
    { group: 'commitment', label: relationshipCommitment >= 75 ? '关系投入度高' : '先观察再投入' },
    { group: 'values', label: Number(answers.Q18 ?? 5) >= 6 ? '消费规划型' : '体验驱动型' },
    { group: 'boundary', label: Number(answers.Q11 ?? 5) >= 6 ? '边界清晰型' : '边界宽松型' },
    { group: 'style', label: socialEnergy >= 60 ? '社交活跃型' : '安静慢聊型' },
  ]

  return {
    answers,
    tags,
    traits,
  }
}

export const getProfilePatchFromAnswers = (answers: Record<string, string>, currentProfile: BasicProfile): Partial<BasicProfile> => ({
  gender: (answers.P01 as BasicProfile['gender']) || currentProfile.gender,
  sexualOrientation: (answers.P02 as BasicProfile['sexualOrientation']) || currentProfile.sexualOrientation,
  monthlySpending: spendingValueMap[answers.P03] ?? currentProfile.monthlySpending,
})

export const getQuestionnaireSeedAnswers = (profile: BasicProfile | null | undefined) => {
  if (!profile) return {}

  const spendingEntry =
    Object.entries(spendingValueMap).find(([, value]) => value === profile.monthlySpending)?.[0] ??
    (profile.monthlySpending == null
      ? ''
      : profile.monthlySpending < 1500
        ? 'LT1500'
        : profile.monthlySpending < 2500
          ? '1500_2500'
          : profile.monthlySpending < 4000
            ? '2500_4000'
            : 'GE4000')

  return {
    ...(profile.gender ? { P01: profile.gender } : {}),
    ...(profile.sexualOrientation ? { P02: profile.sexualOrientation } : {}),
    ...(spendingEntry ? { P03: spendingEntry } : {}),
  }
}
