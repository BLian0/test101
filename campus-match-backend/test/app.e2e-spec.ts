import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';
import { parseAccessToken } from './../src/common/auth-token';
import { RequestContextService } from './../src/common/request-context.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let requestContext: RequestContextService;

  beforeEach(async () => {
    process.env.DB_DRIVER = 'sqlite';
    process.env.EMAIL_SMTP_ENABLED = 'false';
    process.env.EMAIL_EXPOSE_DEV_CODE = 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    requestContext = moduleFixture.get(RequestContextService);
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
      }),
    );
    app.use((req: Request, _res: Response, next: NextFunction) => {
      const authorization = req.headers.authorization;
      const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
      const userId = parseAccessToken(token);
      requestContext.run({ userId }, next);
    });
    await app.init();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            name: 'campus-match-backend',
            status: 'ok',
          }),
        );
      });
  });

  it('supports a real two-user connect and chat flow', async () => {
    const suffix = Date.now();
    const userA = await registerUser({
      email: `user-a-${suffix}@mail.dlut.edu.cn`,
      nickname: `A${suffix}`,
      age: 22,
      gender: 'MALE',
      sexualOrientation: 'FEMALE',
    });
    const userB = await registerUser({
      email: `user-b-${suffix}@mail.dlut.edu.cn`,
      nickname: `B${suffix}`,
      age: 21,
      gender: 'FEMALE',
      sexualOrientation: 'MALE',
    });

    await request(app.getHttpServer())
      .post(`/api/v1/recommendations/${userB.userId}/like`)
      .set('Authorization', `Bearer ${userA.token}`)
      .expect(201);

    const userAConnectionsBeforeFirstMessage = await request(app.getHttpServer())
      .get('/api/v1/connections')
      .set('Authorization', `Bearer ${userA.token}`)
      .expect(200);

    const userAConnection = userAConnectionsBeforeFirstMessage.body.items.find(
      (item: { targetUserId: number }) => item.targetUserId === userB.userId,
    );
    expect(userAConnection).toEqual(
      expect.objectContaining({
        state: 'WAITING_FIRST_MESSAGE',
      }),
    );

    const userBConnectionsBeforeFirstMessage = await request(app.getHttpServer())
      .get('/api/v1/connections')
      .set('Authorization', `Bearer ${userB.token}`)
      .expect(200);

    const userBConnectionBefore = userBConnectionsBeforeFirstMessage.body.items.find(
      (item: { targetUserId: number }) => item.targetUserId === userA.userId,
    );
    expect(userBConnectionBefore).toEqual(
      expect.objectContaining({
        state: 'WAITING_REPLY',
      }),
    );

    await request(app.getHttpServer())
      .post(`/api/v1/connections/${userAConnection.id}/first-message`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ content: '你好，想认真认识你。' })
      .expect(201);

    const userBConnectionsAfterFirstMessage = await request(app.getHttpServer())
      .get('/api/v1/connections')
      .set('Authorization', `Bearer ${userB.token}`)
      .expect(200);

    const userBConnection = userBConnectionsAfterFirstMessage.body.items.find(
      (item: { targetUserId: number }) => item.targetUserId === userA.userId,
    );
    expect(userBConnection).toEqual(
      expect.objectContaining({
        state: 'MUTUAL_CHAT',
      }),
    );

    const userBMessages = await request(app.getHttpServer())
      .get(`/api/v1/conversations/${userBConnection.conversationId}/messages`)
      .set('Authorization', `Bearer ${userB.token}`)
      .expect(200);

    expect(userBMessages.body.items).toEqual([
      expect.objectContaining({
        senderRole: 'TARGET',
        content: '你好，想认真认识你。',
      }),
    ]);

    await request(app.getHttpServer())
      .post(`/api/v1/conversations/${userBConnection.conversationId}/messages/text`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ content: '谢谢你的来信，我也愿意聊聊。' })
      .expect(201);

    const userAMessages = await request(app.getHttpServer())
      .get(`/api/v1/conversations/${userAConnection.conversationId}/messages`)
      .set('Authorization', `Bearer ${userA.token}`)
      .expect(200);

    expect(userAMessages.body.items).toEqual([
      expect.objectContaining({
        senderRole: 'SELF',
        content: '你好，想认真认识你。',
      }),
      expect.objectContaining({
        senderRole: 'TARGET',
        content: '谢谢你的来信，我也愿意聊聊。',
      }),
    ]);

    const userAConnectionsAfterReply = await request(app.getHttpServer())
      .get('/api/v1/connections')
      .set('Authorization', `Bearer ${userA.token}`)
      .expect(200);

    const userAConnectionAfterReply = userAConnectionsAfterReply.body.items.find(
      (item: { targetUserId: number }) => item.targetUserId === userB.userId,
    );
    expect(userAConnectionAfterReply).toEqual(
      expect.objectContaining({
        state: 'MUTUAL_CHAT',
      }),
    );
  });

  async function registerUser(payload: {
    username?: string;
    email: string;
    nickname: string;
    age: number;
    gender: 'MALE' | 'FEMALE';
    sexualOrientation: 'MALE' | 'FEMALE';
  }) {
    const emailCodeResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/email/send-code')
      .send({
        email: payload.email,
        scene: 'REGISTER',
      })
      .expect(201);

    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        username: payload.username ?? `u${payload.email.split('@')[0].replace(/[^A-Za-z0-9_]/g, '').slice(0, 20)}`,
        email: payload.email,
        emailCode: String(emailCodeResponse.body.devCode),
        password: 'abc12345',
      })
      .expect(201);

    const token = String(registerResponse.body.accessToken);
    const userId = Number(registerResponse.body.user.id);

    await request(app.getHttpServer())
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nickname: payload.nickname,
        avatarUrl: 'https://example.com/avatar.png',
        age: payload.age,
        gender: payload.gender,
        sexualOrientation: payload.sexualOrientation,
        bio: '认真认识同校的人。',
      })
      .expect(200);

    return { token, userId };
  }

  afterEach(async () => {
    await app.close();
  });
});
