import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { APP_STATE, type AppState } from './common/app-state.token';
import { Inject } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(APP_STATE) private readonly appState: AppState,
  ) {}

  async getHealth() {
    const configuredDriver = this.configService.get<string>('DB_DRIVER') ?? 'sqlite';
    const storageInfo = await this.appState.getStorageInfo();

    return {
      name: 'campus-match-backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
      storage: {
        configuredDriver,
        activeDriver: storageInfo.driver,
        sqlitePath: storageInfo.sqlitePath,
      },
    };
  }
}
