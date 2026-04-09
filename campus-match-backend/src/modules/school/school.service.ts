import { Inject, Injectable } from '@nestjs/common';

import { APP_STATE, type AppState } from '../../common/app-state.token';

@Injectable()
export class SchoolService {
  constructor(@Inject(APP_STATE) private readonly appState: AppState) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async getCurrentSchool() {
    const school = await this.appState.getSchool();

    return {
      id: school.id,
      name: school.name,
      code: school.code,
    };
  }

  async getEmailRules() {
    return (await this.appState.getSchool()).emailRules;
  }

  async isAllowedSchoolEmail(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    return (await this.getEmailRules()).some(suffix => normalizedEmail.endsWith(`@${suffix}`));
  }
}
