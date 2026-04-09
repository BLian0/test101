import { Inject, Injectable } from '@nestjs/common';

import { APP_STATE, type AppState } from '../../common/app-state.token';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@Injectable()
export class PreferenceService {
  constructor(@Inject(APP_STATE) private readonly appState: AppState) {}

  async getMyPreference() {
    return (await this.appState.getCurrentUser()).preferences ?? null;
  }

  async updateMyPreference(payload: UpdatePreferenceDto) {
    const preferences = await this.appState.savePreferences({
      ...payload,
      preferredGenders: payload.preferredGenders as Array<'MALE' | 'FEMALE' | 'ALL'>,
      relationshipGoal: payload.relationshipGoal as 'SERIOUS' | 'EXPLORE' | 'BOTH',
      intimacyPreference: payload.intimacyPreference as 'CONSERVATIVE' | 'BALANCED' | 'OPEN',
      valuePriority: payload.valuePriority as 'STABILITY' | 'GROWTH' | 'FREEDOM',
      emotionalStyle: payload.emotionalStyle as 'CALM' | 'DIRECT' | 'WARM',
    });

    return {
      message: 'preferences updated',
      preferences,
    };
  }
}
