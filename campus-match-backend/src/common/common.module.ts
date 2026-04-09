import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { APP_STATE } from './app-state.token';
import { InMemoryAppStateService } from './in-memory-app-state.service';
import { MySqlAppStateService } from './mysql-app-state.service';
import { RequestContextService } from './request-context.service';

@Global()
@Module({
  providers: [
    RequestContextService,
    InMemoryAppStateService,
    MySqlAppStateService,
    {
      provide: APP_STATE,
      inject: [ConfigService, InMemoryAppStateService, MySqlAppStateService],
      useFactory: (
        configService: ConfigService,
        sqliteAppState: InMemoryAppStateService,
        mysqlAppState: MySqlAppStateService,
      ) => {
        const driver = configService.get<string>('DB_DRIVER') ?? 'sqlite';

        if (driver === 'mysql') {
          return mysqlAppState;
        }

        return sqliteAppState;
      },
    },
  ],
  exports: [APP_STATE, InMemoryAppStateService, RequestContextService],
})
export class CommonModule {}
