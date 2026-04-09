import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { APP_STATE, type AppState } from '../../common/app-state.token';
import type { CandidateProfile, Gender, Orientation } from '../../common/in-memory-app-state.service';

const orientationAcceptsGender = (orientation: Orientation, gender: Gender) => {
  if (orientation === 'ALL') return true;
  if (gender === 'NON_BINARY') return false;
  return orientation === gender;
};

const currentUserCanSeeCandidate = (
  currentGender: Gender,
  currentOrientation: Orientation,
  candidate: CandidateProfile,
) => {
  if (currentOrientation !== 'ALL' && candidate.gender !== currentOrientation) {
    return false;
  }

  if (currentGender === 'NON_BINARY') {
    return candidate.sexualOrientation === 'ALL';
  }

  return orientationAcceptsGender(candidate.sexualOrientation, currentGender);
};

@Injectable()
export class MatchService {
  constructor(@Inject(APP_STATE) private readonly appState: AppState) {}

  async getRecommendations(query: Record<string, unknown>) {
    const currentUser = await this.appState.getCurrentUser();
    const profile = currentUser.profile;
    const questionnaire = currentUser.questionnaire;
    const preferences = currentUser.preferences;
    const blockedIds = new Set((await this.appState.getBlocks()).map(item => item.blockedUserId));

    const candidates = (await this.appState.getCandidates()).filter(candidate => {
      if (blockedIds.has(candidate.id)) {
        return false;
      }

      if (profile) {
        if (!currentUserCanSeeCandidate(profile.gender, profile.sexualOrientation, candidate)) {
          return false;
        }
      }

      if (preferences && (candidate.age < preferences.ageMin || candidate.age > preferences.ageMax)) {
        return false;
      }

      return true;
    });

    const items = await Promise.all(
      candidates.map(async candidate => {
        const scoreParts = [
          questionnaire?.traits.find(item => item.code === 'relationship_commitment')?.value ?? 50,
          questionnaire?.traits.find(item => item.code === 'physical_intimacy')?.value ?? 50,
          questionnaire?.traits.find(item => item.code === 'social_energy')?.value ?? 50,
        ];

        const candidateParts = [
          candidate.traits.relationship_commitment,
          candidate.traits.physical_intimacy,
          candidate.traits.social_energy,
        ];

        const distance =
          Math.abs(scoreParts[0] - candidateParts[0]) +
          Math.abs(scoreParts[1] - candidateParts[1]) +
          Math.abs(scoreParts[2] - candidateParts[2]);

        const candidateGenderPreference =
          candidate.gender === 'FEMALE' || candidate.gender === 'MALE' ? candidate.gender : 'ALL';

        const preferenceBoost =
          preferences &&
          (preferences.preferredGenders.includes(candidateGenderPreference) || preferences.preferredGenders.includes('ALL'))
            ? 8
            : 0;

        const score = Math.max(60, Math.min(98, 100 - Math.round(distance / 6) + preferenceBoost));

        return {
          userId: candidate.id,
          name: candidate.name,
          age: candidate.age,
          school: candidate.school,
          matchScore: score,
          tags: candidate.tags,
          intro: candidate.intro,
          actionState: (await this.appState.getRecommendationAction(candidate.id))?.action ?? null,
          reasons: ['关系目标接近', '亲密边界节奏相似', '沟通风格有兼容空间'],
        };
      }),
    );

    return {
      query,
      items: items.sort((a, b) => b.matchScore - a.matchScore),
    };
  }

  async like(targetUserId: string) {
    const targetId = Number(targetUserId);
    const candidate = await this.appState.findCandidateById(targetId);
    if (!candidate) {
      throw new NotFoundException('MATCH_TARGET_NOT_FOUND');
    }

    await this.appState.saveRecommendationAction(targetId, 'LIKE');
    const connection = await this.appState.createOrActivateConnection(targetId);

    return {
      message: 'like recorded',
      targetUserId: targetId,
      connectionId: connection.id,
      state: connection.state,
    };
  }

  async pass(targetUserId: string) {
    const targetId = Number(targetUserId);
    const candidate = await this.appState.findCandidateById(targetId);
    if (!candidate) {
      throw new NotFoundException('MATCH_TARGET_NOT_FOUND');
    }

    await this.appState.saveRecommendationAction(targetId, 'PASS');

    return { message: 'pass recorded', targetUserId: targetId };
  }

  getInsight(targetUserId: string) {
    return {
      targetUserId,
      reasons: ['你们都偏长期关系', '消费观落点接近', '关系边界冲突较低'],
    };
  }
}
