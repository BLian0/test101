import { Inject, Injectable } from '@nestjs/common';

import { APP_STATE, type AppState } from '../../common/app-state.token';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(@Inject(APP_STATE) private readonly appState: AppState) {}

  async getMyProfile() {
    const currentUser = await this.appState.getCurrentUser();
    const profile = currentUser.profile;

    return {
      uid: currentUser.uid,
      profile: profile ?? null,
      nicknameEditable: !profile || Number(profile.nicknameChangeCount ?? 0) < 1,
      nicknameChangeCount: Number(profile?.nicknameChangeCount ?? 0),
    };
  }

  async checkNickname(nickname: string) {
    const normalized = nickname.trim();
    return {
      nickname: normalized,
      available: await this.appState.isNicknameAvailable(normalized),
    };
  }

  async updateMyProfile(payload: UpdateProfileDto) {
    const currentProfile = (await this.appState.getCurrentUser()).profile;
    const profile = await this.appState.saveProfile({
      nickname: payload.nickname,
      avatarUrl: payload.avatarUrl,
      age: payload.age,
      bio: payload.bio,
      gender: (payload.gender ?? currentProfile?.gender ?? 'MALE') as 'MALE' | 'FEMALE' | 'NON_BINARY',
      sexualOrientation: (payload.sexualOrientation ?? currentProfile?.sexualOrientation ?? 'ALL') as
        | 'MALE'
        | 'FEMALE'
        | 'ALL',
      monthlySpending: payload.monthlySpending ?? currentProfile?.monthlySpending ?? 500,
      nicknameChangeCount: currentProfile?.nicknameChangeCount,
    });

    return {
      message: 'profile updated',
      profile,
    };
  }
}
