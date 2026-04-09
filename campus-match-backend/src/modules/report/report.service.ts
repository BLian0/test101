import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { APP_STATE, type AppState } from '../../common/app-state.token';
@Injectable()
export class ReportService {
  constructor(@Inject(APP_STATE) private readonly appState: AppState) {}

  async create(payload: Record<string, unknown>) {
    const targetUserId = Number(payload.targetUserId);
    const category = String(payload.category ?? '').trim();
    const description = String(payload.description ?? '').trim();

    if (!targetUserId) {
      throw new BadRequestException('REPORT_TARGET_REQUIRED');
    }

    if (!category || !description) {
      throw new BadRequestException('REPORT_CONTENT_REQUIRED');
    }

    const candidate = await this.appState.findCandidateById(targetUserId);
    if (!candidate) {
      throw new NotFoundException('REPORT_TARGET_NOT_FOUND');
    }

    return {
      message: 'report created',
      report: await this.appState.createUserReport(targetUserId, category, description),
    };
  }

  async listMine() {
    return { items: await this.appState.getMyReports() };
  }
}
