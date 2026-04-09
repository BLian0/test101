import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_STATE } from './common/app-state.token';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: () => 'sqlite',
          },
        },
        {
          provide: APP_STATE,
          useValue: {
            getStorageInfo: () => ({
              driver: 'sqlite',
              sqlitePath: 'data/campus-match.sqlite',
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return backend health metadata', async () => {
      await expect(appController.getHealth()).resolves.toEqual(
        expect.objectContaining({
          name: 'campus-match-backend',
          status: 'ok',
        }),
      );
    });
  });
});
