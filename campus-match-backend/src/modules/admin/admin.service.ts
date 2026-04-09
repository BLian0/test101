import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { APP_STATE, type AppState } from '../../common/app-state.token';

@Injectable()
export class AdminService {
  constructor(@Inject(APP_STATE) private readonly appState: AppState) {}

  login(payload: Record<string, unknown>) {
    const username = String(payload.username ?? '');
    const password = String(payload.password ?? '');

    if (username !== 'admin' || password !== 'admin123') {
      throw new UnauthorizedException('ADMIN_INVALID_CREDENTIALS');
    }

    return {
      message: 'admin login success',
      accessToken: 'admin-dev-token',
      profile: {
        username: 'admin',
        role: 'SUPER_ADMIN',
      },
    };
  }

  async getUsers() {
    return { items: await this.appState.getAdminUsers() };
  }

  async getUserDetail(userId: string) {
    const user = (await this.appState.getAdminUsers()).find(item => item.id === Number(userId));
    if (!user) {
      throw new NotFoundException('ADMIN_USER_NOT_FOUND');
    }

    return {
      ...user,
      latestLogs: (await this.appState.getAdminOperationLogs())
        .filter(log => log.targetType === 'USER' && log.targetId === user.id)
        .slice(0, 10),
    };
  }

  async banUser(userId: string, payload: Record<string, unknown>) {
    const reason = String(payload.reason ?? '').trim() || null;
    const isBanned = payload.isBanned === false ? false : true;
    const user = await this.appState.setAdminUserBanStatus(Number(userId), isBanned, reason);
    if (!user) {
      throw new NotFoundException('ADMIN_USER_NOT_FOUND');
    }

    return {
      message: isBanned ? 'user banned' : 'user unbanned',
      user,
    };
  }

  async getReports() {
    return {
      items: await this.appState.getAdminReports(),
    };
  }

  async getReportDetail(reportId: string) {
    const report = (await this.appState.getAdminReports()).find(item => item.id === Number(reportId));
    if (!report) {
      throw new NotFoundException('ADMIN_REPORT_NOT_FOUND');
    }

    return {
      ...report,
      latestLogs: (await this.appState.getAdminOperationLogs())
        .filter(log => log.targetType === 'REPORT' && log.targetId === report.id)
        .slice(0, 10),
    };
  }

  async resolveReport(reportId: string, payload: Record<string, unknown>) {
    const report = await this.appState.resolveAdminReport(
      Number(reportId),
      String(payload.resolutionNote ?? '').trim() || null,
    );
    if (!report) {
      throw new NotFoundException('ADMIN_REPORT_NOT_FOUND');
    }

    return {
      message: 'report resolved',
      report,
    };
  }

  async getEmailRules(schoolId: string) {
    return {
      schoolId: Number(schoolId),
      items: (await this.appState.getAdminEmailRules(Number(schoolId))).map(rule => ({
        id: rule.id,
        emailSuffix: rule.emailSuffix,
        isActive: Boolean(rule.isActive),
      })),
    };
  }

  async createEmailRule(schoolId: string, payload: Record<string, unknown>) {
    const emailSuffix = String(payload.emailSuffix ?? '').trim().toLowerCase();
    if (!emailSuffix || emailSuffix.includes('@')) {
      throw new BadRequestException('ADMIN_EMAIL_SUFFIX_INVALID');
    }

    return {
      schoolId: Number(schoolId),
      items: (await this.appState.createAdminEmailRule(Number(schoolId), emailSuffix)).map(rule => ({
        id: rule.id,
        emailSuffix: rule.emailSuffix,
        isActive: Boolean(rule.isActive),
      })),
    };
  }

  async updateEmailRule(ruleId: string, payload: Record<string, unknown>) {
    const isActive = Boolean(payload.isActive);
    const rule = await this.appState.updateAdminEmailRule(Number(ruleId), isActive);
    if (!rule) {
      throw new NotFoundException('ADMIN_EMAIL_RULE_NOT_FOUND');
    }

    return {
      message: 'email rule updated',
      rule: {
        id: rule.id,
        emailSuffix: rule.emailSuffix,
        isActive: Boolean(rule.isActive),
      },
    };
  }

  getQuestionnaires() {
    return {
      items: [
        {
          id: 1,
          versionCode: 'v0.1',
          status: 'ACTIVE',
          title: '匹配问卷基础版',
          sections: ['MBTI 风格', '恋爱观', '性态度'],
        },
      ],
    };
  }

  async getOperationLogs() {
    return {
      items: await this.appState.getAdminOperationLogs(),
    };
  }
}
