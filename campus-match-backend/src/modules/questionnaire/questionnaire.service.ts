import { Inject, Injectable } from '@nestjs/common';

import { APP_STATE, type AppState } from '../../common/app-state.token';
import { SaveQuestionnaireDraftDto } from './dto/save-questionnaire-draft.dto';
import { SubmitQuestionnaireDto } from './dto/submit-questionnaire.dto';

type TraitResult = { code: string; label: string; value: number };
type Orientation = 'MALE' | 'FEMALE' | 'ALL';
type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY';

const sliderScore = (answers: Record<string, string>, ids: string[]) => {
  const values = ids
    .map(id => Number(answers[id] ?? 5))
    .filter(value => Number.isFinite(value));

  if (!values.length) {
    return 50;
  }

  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(((avg - 1) / 8) * 100);
};

const pickSingleScore = (answer: string | undefined, map: Record<string, number>, fallback = 50) =>
  map[answer ?? ''] ?? fallback;

const spendingValueMap: Record<string, number> = {
  LT1500: 1200,
  '1500_2500': 2000,
  '2500_4000': 3200,
  GE4000: 4500,
};

const buildQuestionnaireResult = (answers: Record<string, string>) => {
  const relationshipCommitment = Math.round(
    (sliderScore(answers, ['Q05', 'Q06', 'Q08']) + pickSingleScore(answers.Q07, { LOOSE: 20, SHORT_TERM: 58, CLEAR: 90 })) /
      2,
  );
  const physicalIntimacy = Math.round(
    (sliderScore(answers, ['Q01', 'Q02', 'Q04']) +
      pickSingleScore(answers.Q19, { OPEN: 82, BALANCED: 56, CONSERVATIVE: 28 })) /
      2,
  );
  const socialEnergy = sliderScore(answers, ['Q23']);
  const consumptionStyle = Math.round((sliderScore(answers, ['Q17']) + sliderScore(answers, ['Q18'])) / 2);
  const conflictStyle = Math.round(
    (sliderScore(answers, ['Q20', 'Q24', 'Q25']) + pickSingleScore(answers.Q21, { DIRECT: 76, ADAPTIVE: 58, CALM: 34 })) /
      2,
  );

  const traits: TraitResult[] = [
    { code: 'relationship_commitment', label: 'Relationship commitment', value: relationshipCommitment },
    { code: 'physical_intimacy', label: 'Physical intimacy', value: physicalIntimacy },
    { code: 'social_energy', label: 'Social energy', value: socialEnergy },
    { code: 'consumption_style', label: 'Consumption style', value: consumptionStyle },
    { code: 'conflict_style', label: 'Conflict style', value: conflictStyle },
  ];

  const tags = [
    Number(answers.Q01 ?? 5) >= 7 ? 'slow-burn closeness' : 'natural closeness',
    relationshipCommitment >= 75 ? 'high commitment' : 'observe then invest',
    Number(answers.Q18 ?? 5) >= 6 ? 'planned spending' : 'experience driven',
    Number(answers.Q11 ?? 5) >= 6 ? 'clear boundaries' : 'looser boundaries',
    socialEnergy >= 60 ? 'socially active' : 'quiet slow chat',
  ];

  return {
    answers,
    tags,
    traits,
  };
};

@Injectable()
export class QuestionnaireService {
  constructor(@Inject(APP_STATE) private readonly appState: AppState) {}

  getActiveVersion() {
    return {
      id: 2,
      versionCode: 'v2',
      status: 'ACTIVE',
    };
  }

  getActiveQuestions() {
    return {
      items: [],
    };
  }

  saveDraft(payload: SaveQuestionnaireDraftDto) {
    return { message: 'questionnaire draft saved', draftCount: payload.answers.length };
  }

  async submit(payload: SubmitQuestionnaireDto) {
    const answers = Object.fromEntries(payload.answers.map(item => [item.questionId, item.answerValue]));
    const questionnaire = buildQuestionnaireResult(answers);
    const currentUser = await this.appState.getCurrentUser();
    const currentProfile = currentUser.profile;

    let profile = currentProfile ?? null;

    if (currentProfile) {
      profile = (await this.appState.saveProfile({
        ...currentProfile,
        gender: (answers.P01 ?? currentProfile.gender) as Gender,
        sexualOrientation: (answers.P02 ?? currentProfile.sexualOrientation) as Orientation,
        monthlySpending: spendingValueMap[answers.P03] ?? currentProfile.monthlySpending,
      })) ?? null;
    }

    await this.appState.saveQuestionnaire(questionnaire);

    return {
      message: 'questionnaire submitted',
      result: {
        ...questionnaire,
        ...(profile ? { profile } : {}),
      },
    };
  }

  async getMyResult() {
    return (await this.appState.getCurrentUser()).questionnaire ?? null;
  }
}
