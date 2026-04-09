import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

import { APP_STATE, type AppState } from '../../common/app-state.token';
import { buildAccessToken } from '../../common/auth-token';
import { SchoolService } from '../school/school.service';
import { LoginEmailDto } from './dto/login-email.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendEmailCodeDto } from './dto/send-email-code.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private transporter: Transporter | null = null;
  private readonly scrypt = promisify(scryptCallback);

  constructor(
    @Inject(APP_STATE) private readonly appState: AppState,
    private readonly schoolService: SchoolService,
    private readonly configService: ConfigService,
  ) {}

  private createVerificationCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizeUsername(username: string) {
    return username.trim().toLowerCase();
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await this.scrypt(password, salt, 64)) as Buffer;
    return `scrypt$${salt}$${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(input: string, stored: string) {
    if (!stored.startsWith('scrypt$')) {
      return {
        valid: stored === input,
        needsUpgrade: stored === input,
      };
    }

    const [, salt, expectedHash] = stored.split('$');
    if (!salt || !expectedHash) {
      return { valid: false, needsUpgrade: false };
    }

    const derivedKey = (await this.scrypt(input, salt, expectedHash.length / 2)) as Buffer;
    const expected = Buffer.from(expectedHash, 'hex');

    if (expected.length !== derivedKey.length) {
      return { valid: false, needsUpgrade: false };
    }

    return {
      valid: timingSafeEqual(expected, derivedKey),
      needsUpgrade: false,
    };
  }

  private async resolveLoginEmail(account: string) {
    const normalized = this.normalizeUsername(account);
    if (!normalized.includes('@')) {
      const userByUsername = await this.appState.findUserByUsername(normalized);
      if (userByUsername) {
        return userByUsername.email;
      }
    }

    const normalizedEmail = this.normalizeEmail(account);
    if (normalizedEmail.includes('@')) {
      return normalizedEmail;
    }

    const suffixes = await this.schoolService.getEmailRules();
    for (const suffix of suffixes) {
      const candidateEmail = `${normalizedEmail}@${suffix}`;
      const user = await this.appState.findUserByEmail(candidateEmail);
      if (user) {
        return candidateEmail;
      }
    }

    return normalizedEmail;
  }

  private isEmailSmtpEnabled() {
    return (this.configService.get<string>('EMAIL_SMTP_ENABLED') ?? 'false') === 'true';
  }

  private shouldExposeDevCode() {
    return (this.configService.get<string>('EMAIL_EXPOSE_DEV_CODE') ?? 'false') === 'true';
  }

  private getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('EMAIL_SMTP_HOST');
    const user = this.configService.get<string>('EMAIL_SMTP_USER');
    const pass = this.configService.get<string>('EMAIL_SMTP_PASS');

    if (!host || !user || !pass) {
      throw new InternalServerErrorException('AUTH_EMAIL_SMTP_CONFIG_MISSING');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(this.configService.get<string>('EMAIL_SMTP_PORT') ?? 465),
      secure: (this.configService.get<string>('EMAIL_SMTP_SECURE') ?? 'true') === 'true',
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }

  private async sendEmailVerificationMail(payload: { email: string; code: string; expiresAt: string }) {
    if (!this.isEmailSmtpEnabled()) {
      return;
    }

    const from = this.configService.get<string>('EMAIL_SMTP_FROM') ?? this.configService.get<string>('EMAIL_SMTP_USER');
    const appName = this.configService.get<string>('EMAIL_APP_NAME') ?? '校园匹配';
    const expireText = new Date(payload.expiresAt).toLocaleString('zh-CN', { hour12: false });

    try {
      await this.getTransporter().sendMail({
        from,
        to: payload.email,
        subject: `${appName} 邮箱验证码`,
        text: `你的验证码是 ${payload.code}，请在 5 分钟内完成验证。过期时间：${expireText}。`,
        html: `
          <div style="font-family: Microsoft YaHei, Arial, sans-serif; color: #1f2937; line-height: 1.7;">
            <h2 style="margin-bottom: 12px;">${appName} 邮箱验证码</h2>
            <p>你的验证码是：</p>
            <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${payload.code}</p>
            <p>请在 5 分钟内完成验证。</p>
            <p>过期时间：${expireText}</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(
        `SMTP send failed for ${payload.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('AUTH_EMAIL_SEND_FAILED');
    }
  }

  async sendEmailCode(payload: SendEmailCodeDto) {
    const email = this.normalizeEmail(payload.email);

    if (!(await this.schoolService.isAllowedSchoolEmail(email))) {
      throw new BadRequestException('AUTH_EMAIL_SUFFIX_INVALID');
    }

    if (payload.scene === 'RESET_PASSWORD') {
      const existingUser = await this.appState.findUserByEmail(email);
      if (!existingUser) {
        throw new BadRequestException('AUTH_EMAIL_NOT_FOUND');
      }
    }

    const rateLimit = await this.appState.getEmailVerificationRateLimit({
      email,
      scene: payload.scene as 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD',
    });

    if (rateLimit.lastSentAt && Date.now() - new Date(rateLimit.lastSentAt).getTime() < 60 * 1000) {
      throw new BadRequestException('AUTH_EMAIL_CODE_TOO_FREQUENT');
    }

    if (rateLimit.countLastHour >= 10) {
      throw new BadRequestException('AUTH_EMAIL_CODE_RATE_LIMITED');
    }

    const code = this.createVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await this.appState.issueEmailVerificationCode({
      email,
      scene: payload.scene as 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD',
      code,
      expiresAt,
    });

    await this.sendEmailVerificationMail({
      email,
      code,
      expiresAt,
    });

    return {
      message: 'email verification code issued',
      email,
      scene: payload.scene,
      expiresAt,
      ...(this.shouldExposeDevCode() ? { devCode: code } : {}),
    };
  }

  async register(payload: RegisterDto) {
    const email = this.normalizeEmail(payload.email);
    const username = this.normalizeUsername(payload.username);

    if (!(await this.schoolService.isAllowedSchoolEmail(email))) {
      throw new BadRequestException('AUTH_EMAIL_SUFFIX_INVALID');
    }

    const emailCodeValid = await this.appState.verifyEmailVerificationCode({
      email,
      scene: 'REGISTER',
      code: payload.emailCode.trim(),
    });

    if (!emailCodeValid) {
      throw new BadRequestException('AUTH_EMAIL_CODE_INVALID');
    }

    const existingEmail = await this.appState.findUserByEmail(email);
    if (existingEmail) {
      throw new BadRequestException('AUTH_EMAIL_ALREADY_EXISTS');
    }

    const existingUsername = await this.appState.findUserByUsername(username);
    if (existingUsername) {
      throw new BadRequestException('AUTH_USERNAME_ALREADY_EXISTS');
    }

    const hashedPassword = await this.hashPassword(payload.password.trim());

    const user = await this.appState.registerUser({
      username,
      email,
      password: hashedPassword,
    });

    await this.appState.consumeEmailVerificationCode({
      email,
      scene: 'REGISTER',
      code: payload.emailCode.trim(),
    });

    return {
      message: 'register success',
      accessToken: buildAccessToken(user.id),
      user: {
        id: user.id,
        uid: user.uid,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  async resetPassword(payload: ResetPasswordDto) {
    const email = this.normalizeEmail(payload.email);

    if (!(await this.schoolService.isAllowedSchoolEmail(email))) {
      throw new BadRequestException('AUTH_EMAIL_SUFFIX_INVALID');
    }

    const existingUser = await this.appState.findUserByEmail(email);
    if (!existingUser) {
      throw new BadRequestException('AUTH_EMAIL_NOT_FOUND');
    }

    const emailCodeValid = await this.appState.verifyEmailVerificationCode({
      email,
      scene: 'RESET_PASSWORD',
      code: payload.emailCode.trim(),
    });

    if (!emailCodeValid) {
      throw new BadRequestException('AUTH_EMAIL_CODE_INVALID');
    }

    const hashedPassword = await this.hashPassword(payload.password.trim());
    const updated = await this.appState.updateUserPassword(email, hashedPassword);
    if (!updated) {
      throw new InternalServerErrorException('AUTH_PASSWORD_RESET_FAILED');
    }

    await this.appState.consumeEmailVerificationCode({
      email,
      scene: 'RESET_PASSWORD',
      code: payload.emailCode.trim(),
    });

    return {
      message: 'password reset success',
    };
  }

  async loginByEmail(payload: LoginEmailDto) {
    const loginEmail = await this.resolveLoginEmail(payload.email);
    const user = await this.appState.findUserByEmail(loginEmail);
    if (!user) {
      throw new UnauthorizedException('AUTH_INVALID_CREDENTIALS');
    }

    const passwordCheck = await this.verifyPassword(payload.password, user.password);
    if (!passwordCheck.valid) {
      throw new UnauthorizedException('AUTH_INVALID_CREDENTIALS');
    }

    if (passwordCheck.needsUpgrade) {
      await this.appState.updateUserPassword(user.email, await this.hashPassword(payload.password));
    }

    return {
      message: 'email login success',
      accessToken: buildAccessToken(user.id),
      userId: user.id,
    };
  }

  async getCurrentUser() {
    const current = await this.appState.getCurrentUser();

    return {
      id: current.id,
      uid: current.uid,
      username: current.username,
      email: current.email,
      phone: current.phone,
      onboardingState: {
        registered: Boolean(current.email && current.phone),
        profileCompleted: Boolean(current.profile),
        questionnaireCompleted: Boolean(current.questionnaire),
        preferencesCompleted: true,
      },
    };
  }
}
