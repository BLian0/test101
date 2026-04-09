import { Injectable, OnModuleDestroy, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool, type Pool, type RowDataPacket } from 'mysql2/promise';

import type { AppState } from './app-state.token';
import type {
  AdminOperationLog,
  AdminReportSummary,
  AdminUserSummary,
  AppUser,
  CandidateProfile,
  ConnectionSummary,
  ConversationMessage,
  UserBlockItem,
  UserReportItem,
} from './in-memory-app-state.service';
import { RequestContextService } from './request-context.service';

@Injectable()
export class MySqlAppStateService implements AppState, OnModuleDestroy {
  private pool: Pool | null = null;
  private schemaReady: Promise<void> | null = null;

  private readonly candidates: CandidateProfile[] = [
    {
      id: 1001,
      name: '???',
      age: 22,
      school: '??????',
      gender: 'FEMALE',
      sexualOrientation: 'MALE',
      monthlySpending: 2800,
      tags: ['??????', '?????', '?????'],
      traits: {
        relationship_commitment: 90,
        physical_intimacy: 56,
        social_energy: 72,
        consumption_style: 48,
        conflict_style: 30,
      },
      intro: '????????????????????????',
    },
    {
      id: 1002,
      name: '??',
      age: 24,
      school: '??????',
      gender: 'FEMALE',
      sexualOrientation: 'ALL',
      monthlySpending: 2200,
      tags: ['?????', '?????', '?????'],
      traits: {
        relationship_commitment: 84,
        physical_intimacy: 32,
        social_energy: 34,
        consumption_style: 24,
        conflict_style: 22,
      },
      intro: '?????????????????????????????',
    },
    {
      id: 1003,
      name: '??',
      age: 21,
      school: '??????',
      gender: 'FEMALE',
      sexualOrientation: 'MALE',
      monthlySpending: 2600,
      tags: ['?????', '????', '?????'],
      traits: {
        relationship_commitment: 65,
        physical_intimacy: 60,
        social_energy: 86,
        consumption_style: 58,
        conflict_style: 62,
      },
      intro: '????????????????????????',
    },
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly requestContext: RequestContextService,
  ) {}

  private get currentUserId() {
    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new UnauthorizedException('AUTH_UNAUTHORIZED');
    }

    return userId;
  }

  private getPool() {
    if (!this.pool) {
      this.pool = createPool({
        host: this.configService.get<string>('DB_HOST') ?? '127.0.0.1',
        port: Number(this.configService.get<string>('DB_PORT') ?? 3306),
        database: this.configService.get<string>('DB_NAME') ?? 'campus_match',
        user: this.configService.get<string>('DB_USER') ?? 'campus_match',
        password: this.configService.get<string>('DB_PASSWORD') ?? 'campus_match_dev',
        charset: 'utf8mb4',
        connectionLimit: 10,
      });
    }

    return this.pool;
  }

  async onModuleDestroy() {
    if (this.pool) {
      try {
        await this.pool.end();
      } catch {
        // Pool may already be closed during app shutdown in tests.
      }
      this.pool = null;
      this.schemaReady = null;
    }
  }

  private async ensureSchema() {
    if (!this.schemaReady) {
      this.schemaReady = (async () => {
          await this.getPool().execute(
            `CREATE TABLE IF NOT EXISTS email_verification_codes (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              email VARCHAR(255) NOT NULL,
              scene VARCHAR(16) NOT NULL,
            code VARCHAR(16) NOT NULL,
            expires_at DATETIME(3) NOT NULL,
            used_at DATETIME(3) NULL,
              created_at DATETIME(3) NOT NULL
            )`,
          );

          await this.getPool().execute(
            `CREATE TABLE IF NOT EXISTS phone_verification_codes (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              phone VARCHAR(32) NOT NULL,
              scene VARCHAR(16) NOT NULL,
              code VARCHAR(16) NOT NULL,
              expires_at DATETIME(3) NOT NULL,
              used_at DATETIME(3) NULL,
              created_at DATETIME(3) NOT NULL
            )`,
          );

          await this.getPool().execute(
            `CREATE TABLE IF NOT EXISTS conversation_reads (
              user_id BIGINT NOT NULL,
              conversation_id BIGINT NOT NULL,
              last_read_message_id BIGINT NOT NULL DEFAULT 0,
              last_read_at DATETIME(3) NOT NULL,
              PRIMARY KEY (user_id, conversation_id)
            )`,
          );

          const [rows] = await this.getPool().query<RowDataPacket[]>(
            `SELECT COUNT(*) AS count
             FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = 'messages'
             AND COLUMN_NAME = 'sender_user_id'`,
        );

        if (Number(rows[0].count) === 0) {
          await this.getPool().execute(
            `ALTER TABLE messages
             ADD COLUMN sender_user_id BIGINT NULL AFTER conversation_id`,
          );
        }

        const [usernameColumnRows] = await this.getPool().query<RowDataPacket[]>(
          `SELECT COUNT(*) AS count
           FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = 'users'
             AND COLUMN_NAME = 'username'`,
        );

        if (Number(usernameColumnRows[0].count) === 0) {
          await this.getPool().execute(
            `ALTER TABLE users
             ADD COLUMN username VARCHAR(24) NULL AFTER school_id`,
          );
        }

        const [uidColumnRows] = await this.getPool().query<RowDataPacket[]>(
          `SELECT COUNT(*) AS count
           FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = 'users'
             AND COLUMN_NAME = 'uid'`,
        );

        if (Number(uidColumnRows[0].count) === 0) {
          await this.getPool().execute(
            `ALTER TABLE users
             ADD COLUMN uid VARCHAR(16) NULL AFTER id`,
          );
        }

        const [nicknameChangeColumnRows] = await this.getPool().query<RowDataPacket[]>(
          `SELECT COUNT(*) AS count
           FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = 'user_profiles'
             AND COLUMN_NAME = 'nickname_change_count'`,
        );

        if (Number(nicknameChangeColumnRows[0].count) === 0) {
          await this.getPool().execute(
            `ALTER TABLE user_profiles
             ADD COLUMN nickname_change_count INT NOT NULL DEFAULT 0 AFTER bio`,
          );
        }

        const [monthlySpendingColumnRows] = await this.getPool().query<RowDataPacket[]>(
          `SELECT COUNT(*) AS count
           FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = 'user_profiles'
             AND COLUMN_NAME = 'monthly_spending'`,
        );

        if (Number(monthlySpendingColumnRows[0].count) === 0) {
          await this.getPool().execute(
            `ALTER TABLE user_profiles
             ADD COLUMN monthly_spending INT NOT NULL DEFAULT 0 AFTER sexual_orientation`,
          );
        }

        await this.getPool().execute(
          `UPDATE users
           SET username = LOWER(SUBSTRING_INDEX(email, '@', 1))
           WHERE username IS NULL OR TRIM(username) = ''`,
        );

        await this.getPool().execute(
          `UPDATE users
           SET uid = CONCAT('26', LPAD(id, 6, '0'))`,
        );

        await this.getPool().execute(
          `ALTER TABLE users
           MODIFY COLUMN username VARCHAR(24) NOT NULL`,
        );

        await this.getPool().execute(
          `ALTER TABLE users
           MODIFY COLUMN uid VARCHAR(8) NOT NULL`,
        );

        await this.getPool().execute(
          `CREATE UNIQUE INDEX idx_users_username ON users(username)`,
        ).catch(() => undefined);

        await this.getPool().execute(
          `CREATE UNIQUE INDEX idx_users_uid ON users(uid)`,
        ).catch(() => undefined);

        await this.getPool().execute(
          `CREATE UNIQUE INDEX idx_user_profiles_nickname ON user_profiles(nickname)`,
        ).catch(() => undefined);
      })();
    }

    await this.schemaReady;
  }

  private async query<T extends RowDataPacket[]>(sql: string, params: unknown[] = []) {
    await this.ensureSchema();
    const [rows] = await this.getPool().query<T>(sql, params);
    return rows;
  }

  private async execute(sql: string, params: unknown[] = []) {
    await this.ensureSchema();
    await this.getPool().execute(sql, params as never[]);
  }

  private async getNextConversationId() {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT COALESCE(MAX(conversation_id), 20000) + 1 AS next_conversation_id
       FROM connections
       WHERE conversation_id IS NOT NULL`,
    );

    return Number(rows[0].next_conversation_id);
  }

  private async getUnreadCount(conversationId: number) {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS unread_count
       FROM messages m
       LEFT JOIN conversation_reads cr
         ON cr.user_id = ? AND cr.conversation_id = m.conversation_id
       WHERE m.conversation_id = ?
         AND (
           (m.sender_user_id IS NOT NULL AND m.sender_user_id <> ?)
           OR (m.sender_user_id IS NULL AND m.sender_role = 'TARGET')
         )
         AND m.id > COALESCE(cr.last_read_message_id, 0)`,
      [this.currentUserId, conversationId, this.currentUserId],
    );

    return Number(rows[0]?.unread_count ?? 0);
  }

  private parseJsonField<T>(value: unknown, fallback: T): T {
    if (value == null) {
      return fallback;
    }

    if (typeof value === 'string') {
      return JSON.parse(value) as T;
    }

    if (Buffer.isBuffer(value)) {
      return JSON.parse(value.toString('utf8')) as T;
    }

    if (typeof value === 'object') {
      return value as T;
    }

    return fallback;
  }

  private async fetchCurrentUserRow() {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, uid, school_id, username, email, phone, password, registered_at FROM users WHERE id = ?`,
      [this.currentUserId],
    );

    return rows[0];
  }

  private extractTraitValue(
    traits: Array<{ code?: string; value?: number }> | null | undefined,
    code: string,
    fallback: number,
  ) {
    const match = (traits ?? []).find(item => item.code === code);
    return typeof match?.value === 'number' ? match.value : fallback;
  }

  private async loadUserCandidate(userId: number) {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT
         u.id,
         s.name AS school_name,
         p.nickname,
         p.age,
         p.gender,
         p.sexual_orientation,
         p.monthly_spending,
         p.bio,
         q.tags_json,
         q.traits_json
       FROM users u
       JOIN schools s ON s.id = u.school_id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       LEFT JOIN questionnaire_submissions q ON q.user_id = u.id
       WHERE u.id = ?`,
      [userId],
    );

    const row = rows[0];
    if (!row || row.nickname == null || row.age == null || row.gender == null) {
      return undefined;
    }

    const tags = this.parseJsonField<string[]>(row.tags_json, []);
    const traits = this.parseJsonField<Array<{ code?: string; value?: number }>>(row.traits_json, []);

    return {
      id: Number(row.id),
      name: String(row.nickname),
      age: Number(row.age),
      school: String(row.school_name),
      gender: String(row.gender) as CandidateProfile['gender'],
      sexualOrientation: String(row.sexual_orientation ?? 'ALL') as CandidateProfile['sexualOrientation'],
      monthlySpending: Number(row.monthly_spending ?? 0),
      tags,
      traits: {
        relationship_commitment: this.extractTraitValue(traits, 'relationship_commitment', 60),
        physical_intimacy: this.extractTraitValue(traits, 'physical_intimacy', 50),
        social_energy: this.extractTraitValue(traits, 'social_energy', 50),
        consumption_style: this.extractTraitValue(traits, 'consumption_style', 50),
        conflict_style: this.extractTraitValue(traits, 'conflict_style', 50),
      },
      intro: row.bio == null ? 'Profile complete. Open to learn more.' : String(row.bio),
    } satisfies CandidateProfile;
  }

  getStorageInfo() {
    return {
      driver: 'mysql',
      sqlitePath: null,
    };
  }

  async getSchool() {
    const schoolRows = await this.query<RowDataPacket[]>(`SELECT id, name, code FROM schools WHERE id = 1`);
    const emailRows = await this.query<RowDataPacket[]>(
      `SELECT email_suffix FROM school_email_rules WHERE school_id = 1 AND is_active = 1 ORDER BY id`,
    );

    return {
      id: Number(schoolRows[0].id),
      name: String(schoolRows[0].name),
      code: String(schoolRows[0].code),
      emailRules: emailRows.map(item => String(item.email_suffix)),
    };
  }

  async getCurrentUser(): Promise<AppUser> {
    const user = await this.fetchCurrentUserRow();
    const profileRows = await this.query<RowDataPacket[]>(
      `SELECT nickname, avatar_url, age, gender, sexual_orientation, monthly_spending, bio, nickname_change_count FROM user_profiles WHERE user_id = ?`,
      [this.currentUserId],
    );
    const questionnaireRows = await this.query<RowDataPacket[]>(
      `SELECT answers_json, tags_json, traits_json FROM questionnaire_submissions WHERE user_id = ?`,
      [this.currentUserId],
    );
    const preferenceRows = await this.query<RowDataPacket[]>(
      `SELECT preferred_genders_json, age_min, age_max, relationship_goal, intimacy_preference, value_priority, emotional_style
       FROM user_preferences WHERE user_id = ?`,
      [this.currentUserId],
    );

    const profile = profileRows[0];
    const questionnaire = questionnaireRows[0];
    const preference = preferenceRows[0];

    return {
      id: Number(user.id),
      uid: String(user.uid),
      schoolId: Number(user.school_id),
      username: String(user.username),
      email: String(user.email),
      phone: String(user.phone),
      password: String(user.password),
      registeredAt: new Date(user.registered_at).toISOString(),
      profile: profile
        ? {
            nickname: String(profile.nickname),
            avatarUrl: String(profile.avatar_url),
            age: Number(profile.age),
            gender: profile.gender,
            sexualOrientation: profile.sexual_orientation,
            monthlySpending: Number(profile.monthly_spending ?? 0),
            bio: profile.bio == null ? undefined : String(profile.bio),
            nicknameChangeCount: Number(profile.nickname_change_count ?? 0),
          }
        : undefined,
      questionnaire: questionnaire
        ? {
            answers: this.parseJsonField(questionnaire.answers_json, {}),
            tags: this.parseJsonField(questionnaire.tags_json, []),
            traits: this.parseJsonField(questionnaire.traits_json, []),
          }
        : undefined,
      preferences: preference
        ? {
            preferredGenders: this.parseJsonField(preference.preferred_genders_json, []),
            ageMin: Number(preference.age_min),
            ageMax: Number(preference.age_max),
            relationshipGoal: preference.relationship_goal,
            intimacyPreference: preference.intimacy_preference,
            valuePriority: preference.value_priority,
            emotionalStyle: preference.emotional_style,
          }
        : undefined,
    };
  }

  async findUserByEmail(email: string) {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, username, email, phone, password FROM users WHERE email = ?`,
      [email],
    );
    const user = rows[0];
    if (!user) return undefined;
    return {
      id: Number(user.id),
      username: String(user.username),
      email: String(user.email),
      phone: String(user.phone),
      password: String(user.password),
    };
  }

  async findUserByUsername(username: string) {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, username, email, phone, password FROM users WHERE username = ?`,
      [username],
    );
    const user = rows[0];
    if (!user) return undefined;
    return {
      id: Number(user.id),
      username: String(user.username),
      email: String(user.email),
      phone: String(user.phone),
      password: String(user.password),
    };
  }

  async isNicknameAvailable(nickname: string) {
    const normalized = nickname.trim();
    if (!normalized) {
      return false;
    }

    const rows = await this.query<RowDataPacket[]>(
      `SELECT user_id
       FROM user_profiles
       WHERE nickname = ?
       LIMIT 1`,
      [normalized],
    );

    if (!rows[0]) {
      return true;
    }

    return Number(rows[0].user_id) === this.currentUserId;
  }

  async findUserByPhone(phone: string) {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, username, email, phone, password FROM users WHERE phone = ?`,
      [phone],
    );
    const user = rows[0];
    if (!user) return undefined;
    return {
      id: Number(user.id),
      username: String(user.username),
      email: String(user.email),
      phone: String(user.phone),
      password: String(user.password),
    };
  }

  async updateUserPassword(email: string, password: string) {
    await this.execute(`UPDATE users SET password = ? WHERE email = ?`, [password, email]);
    return true;
  }

  async issueEmailVerificationCode(payload: {
    email: string;
    scene: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD';
    code: string;
    expiresAt: string;
  }) {
    await this.execute(
      `UPDATE email_verification_codes
       SET used_at = ?
       WHERE email = ? AND scene = ? AND used_at IS NULL`,
      [new Date(), payload.email, payload.scene],
    );

    await this.execute(
        `INSERT INTO email_verification_codes (email, scene, code, expires_at, used_at, created_at)
         VALUES (?, ?, ?, ?, NULL, ?)`,
        [payload.email, payload.scene, payload.code, new Date(payload.expiresAt), new Date()],
      );
    }

  async getEmailVerificationRateLimit(payload: {
    email: string;
    scene: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD';
  }) {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT
         MAX(created_at) AS last_sent_at,
         SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS count_last_hour
       FROM email_verification_codes
       WHERE email = ? AND scene = ?`,
      [new Date(Date.now() - 60 * 60 * 1000), payload.email, payload.scene],
    );
    const row = rows[0];
    return {
      lastSentAt: row?.last_sent_at ? new Date(row.last_sent_at).toISOString() : null,
      countLastHour: Number(row?.count_last_hour ?? 0),
    };
  }

  async issuePhoneVerificationCode(payload: {
    phone: string;
    scene: 'REGISTER' | 'LOGIN';
    code: string;
    expiresAt: string;
  }) {
    await this.execute(
      `UPDATE phone_verification_codes
       SET used_at = ?
       WHERE phone = ? AND scene = ? AND used_at IS NULL`,
      [new Date(), payload.phone, payload.scene],
    );

    await this.execute(
      `INSERT INTO phone_verification_codes (phone, scene, code, expires_at, used_at, created_at)
       VALUES (?, ?, ?, ?, NULL, ?)`,
      [payload.phone, payload.scene, payload.code, new Date(payload.expiresAt), new Date()],
    );
  }

  async verifyEmailVerificationCode(payload: {
    email: string;
    scene: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD';
    code: string;
  }) {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, expires_at
       FROM email_verification_codes
       WHERE email = ? AND scene = ? AND code = ? AND used_at IS NULL
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [payload.email, payload.scene, payload.code],
    );
    const record = rows[0];
    if (!record || new Date(record.expires_at).getTime() < Date.now()) {
      return false;
    }

    return true;
  }

  async verifyPhoneVerificationCode(payload: { phone: string; scene: 'REGISTER' | 'LOGIN'; code: string }) {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, expires_at
       FROM phone_verification_codes
       WHERE phone = ? AND scene = ? AND code = ? AND used_at IS NULL
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [payload.phone, payload.scene, payload.code],
    );
    const record = rows[0];
    if (!record || new Date(record.expires_at).getTime() < Date.now()) {
      return false;
    }

    return true;
  }

  async consumeEmailVerificationCode(payload: {
    email: string;
    scene: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD';
    code: string;
  }) {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, expires_at
       FROM email_verification_codes
       WHERE email = ? AND scene = ? AND code = ? AND used_at IS NULL
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [payload.email, payload.scene, payload.code],
    );
    const record = rows[0];
    if (!record || new Date(record.expires_at).getTime() < Date.now()) {
      return;
    }

    await this.execute(`UPDATE email_verification_codes SET used_at = ? WHERE id = ?`, [
      new Date(),
      Number(record.id),
    ]);
  }

  async consumePhoneVerificationCode(payload: { phone: string; scene: 'REGISTER' | 'LOGIN'; code: string }) {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, expires_at
       FROM phone_verification_codes
       WHERE phone = ? AND scene = ? AND code = ? AND used_at IS NULL
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [payload.phone, payload.scene, payload.code],
    );
    const record = rows[0];
    if (!record || new Date(record.expires_at).getTime() < Date.now()) {
      return;
    }

    await this.execute(`UPDATE phone_verification_codes SET used_at = ? WHERE id = ?`, [
      new Date(),
      Number(record.id),
    ]);
  }

  async registerUser(payload: { username: string; email: string; phone?: string; password: string }) {
    const idRows = await this.query<RowDataPacket[]>(`SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM users`);
    const nextUserId = Number(idRows[0].next_id);
    const uid = `26${String(nextUserId).padStart(6, '0')}`;
    const phone = payload.phone?.trim() || `virtual${String(nextUserId).padStart(8, '0')}`;

    await this.execute(
      `INSERT INTO users (id, uid, school_id, username, email, phone, password, registered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nextUserId, uid, 1, payload.username, payload.email, phone, payload.password, new Date()],
    );
    const created = await this.findUserByEmail(payload.email);
    if (!created) {
      throw new UnauthorizedException('AUTH_REGISTER_FAILED');
    }

    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, uid, school_id, username, email, phone, password, registered_at FROM users WHERE id = ?`,
      [created.id],
    );
    const user = rows[0];
    return {
      id: Number(user.id),
      uid: String(user.uid),
      schoolId: Number(user.school_id),
      username: String(user.username),
      email: String(user.email),
      phone: String(user.phone),
      password: String(user.password),
      registeredAt: new Date(user.registered_at).toISOString(),
    } satisfies AppUser;
  }

  async saveProfile(profile: AppUser['profile']) {
    const nextNickname = String(profile?.nickname ?? '').trim();
    const currentRows = await this.query<RowDataPacket[]>(
      `SELECT nickname, nickname_change_count
       FROM user_profiles
       WHERE user_id = ?`,
      [this.currentUserId],
    );
    const currentProfile = currentRows[0];
    const currentNickname = currentProfile?.nickname == null ? '' : String(currentProfile.nickname);
    const nicknameChangeCount = Number(currentProfile?.nickname_change_count ?? 0);

    if (currentNickname && currentNickname !== nextNickname && nicknameChangeCount >= 1) {
      throw new UnauthorizedException('PROFILE_NICKNAME_CHANGE_LIMIT');
    }

    const available = await this.isNicknameAvailable(nextNickname);
    if (!available) {
      throw new UnauthorizedException('PROFILE_NICKNAME_ALREADY_EXISTS');
    }

    const nextNicknameChangeCount =
      currentNickname && currentNickname !== nextNickname ? nicknameChangeCount + 1 : nicknameChangeCount;

    await this.execute(
      `INSERT INTO user_profiles (user_id, nickname, avatar_url, age, gender, sexual_orientation, monthly_spending, bio, nickname_change_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nickname = VALUES(nickname),
         avatar_url = VALUES(avatar_url),
         age = VALUES(age),
         gender = VALUES(gender),
         sexual_orientation = VALUES(sexual_orientation),
         monthly_spending = VALUES(monthly_spending),
         bio = VALUES(bio),
         nickname_change_count = VALUES(nickname_change_count)`,
      [
        this.currentUserId,
        nextNickname,
        profile?.avatarUrl ?? '',
        profile?.age ?? 18,
        profile?.gender ?? 'MALE',
        profile?.sexualOrientation ?? 'ALL',
        profile?.monthlySpending ?? 0,
        profile?.bio ?? null,
        nextNicknameChangeCount,
      ],
    );
    return (await this.getCurrentUser()).profile;
  }

  async saveQuestionnaire(questionnaire: AppUser['questionnaire']) {
    await this.execute(
      `INSERT INTO questionnaire_submissions (user_id, answers_json, tags_json, traits_json)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         answers_json = VALUES(answers_json),
         tags_json = VALUES(tags_json),
         traits_json = VALUES(traits_json)`,
      [
        this.currentUserId,
        JSON.stringify(questionnaire?.answers ?? {}),
        JSON.stringify(questionnaire?.tags ?? []),
        JSON.stringify(questionnaire?.traits ?? []),
      ],
    );
    return (await this.getCurrentUser()).questionnaire;
  }

  async savePreferences(preferences: AppUser['preferences']) {
    await this.execute(
      `INSERT INTO user_preferences (
         user_id, preferred_genders_json, age_min, age_max, relationship_goal, intimacy_preference, value_priority, emotional_style
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         preferred_genders_json = VALUES(preferred_genders_json),
         age_min = VALUES(age_min),
         age_max = VALUES(age_max),
         relationship_goal = VALUES(relationship_goal),
         intimacy_preference = VALUES(intimacy_preference),
         value_priority = VALUES(value_priority),
         emotional_style = VALUES(emotional_style)`,
      [
        this.currentUserId,
        JSON.stringify(preferences?.preferredGenders ?? []),
        preferences?.ageMin ?? 18,
        preferences?.ageMax ?? 30,
        preferences?.relationshipGoal ?? 'SERIOUS',
        preferences?.intimacyPreference ?? 'BALANCED',
        preferences?.valuePriority ?? 'STABILITY',
        preferences?.emotionalStyle ?? 'WARM',
      ],
    );
    return (await this.getCurrentUser()).preferences;
  }

  async getCandidates() {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT u.id
       FROM users u
       JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id <> ?
       ORDER BY u.registered_at DESC, u.id DESC`,
      [this.currentUserId],
    );

    const candidates = await Promise.all(rows.map(row => this.loadUserCandidate(Number(row.id))));
    return candidates.filter((item): item is CandidateProfile => Boolean(item));
  }

  async findCandidateById(targetUserId: number) {
    if (targetUserId === this.currentUserId) {
      return undefined;
    }

    return this.loadUserCandidate(targetUserId);
  }

  async getAdminUsers() {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT
         u.id,
         u.uid,
         u.username,
         u.email,
         u.phone,
         s.name AS school_name,
         u.registered_at,
         p.nickname,
         q.user_id AS questionnaire_user_id,
         pref.user_id AS preference_user_id,
         ub.user_id AS banned_user_id,
         ub.reason AS ban_reason
       FROM users u
       JOIN schools s ON s.id = u.school_id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       LEFT JOIN questionnaire_submissions q ON q.user_id = u.id
       LEFT JOIN user_preferences pref ON pref.user_id = u.id
       LEFT JOIN user_bans ub ON ub.user_id = u.id
       ORDER BY u.registered_at DESC, u.id DESC`,
    );
    return rows.map(
      row =>
          ({
          id: Number(row.id),
          uid: String(row.uid),
          username: String(row.username),
          email: String(row.email),
          phone: String(row.phone),
          schoolName: String(row.school_name),
          registeredAt: new Date(row.registered_at).toISOString(),
          profileCompleted: row.nickname != null,
          questionnaireCompleted: row.questionnaire_user_id != null,
          preferencesCompleted: row.preference_user_id != null,
          nickname: row.nickname == null ? null : String(row.nickname),
          isBanned: row.banned_user_id != null,
          banReason: row.ban_reason == null ? null : String(row.ban_reason),
        }) satisfies AdminUserSummary,
    );
  }

  async getAdminReports() {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT
         r.id,
         r.reporter_user_id,
         r.target_user_id,
         r.category,
         r.description,
         r.status,
         r.created_at,
         rr.resolution_note,
         rr.resolved_at
       FROM reports r
       LEFT JOIN report_resolutions rr ON rr.report_id = r.id
       ORDER BY r.created_at DESC, r.id DESC`,
    );
    return rows.map(
      row =>
        ({
          id: Number(row.id),
          reporterUserId: Number(row.reporter_user_id),
          targetUserId: Number(row.target_user_id),
          category: String(row.category),
          description: String(row.description),
          status: String(row.status) as 'PENDING' | 'RESOLVED',
          createdAt: new Date(row.created_at).toISOString(),
          resolutionNote: row.resolution_note == null ? null : String(row.resolution_note),
          resolvedAt: row.resolved_at == null ? null : new Date(row.resolved_at).toISOString(),
        }) satisfies AdminReportSummary,
    );
  }

  async resolveAdminReport(reportId: number, resolutionNote: string | null) {
    await this.execute(`UPDATE reports SET status = 'RESOLVED' WHERE id = ?`, [reportId]);
    await this.execute(
      `INSERT INTO report_resolutions (report_id, resolution_note, resolved_at)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         resolution_note = VALUES(resolution_note),
         resolved_at = VALUES(resolved_at)`,
      [reportId, resolutionNote, new Date()],
    );
    await this.appendAdminOperationLog(
      'RESOLVE_REPORT',
      'REPORT',
      reportId,
      resolutionNote ?? `Resolved report ${reportId}`,
    );
    return (await this.getAdminReports()).find(item => item.id === reportId);
  }

  async getAdminEmailRules(schoolId: number) {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, email_suffix, is_active FROM school_email_rules WHERE school_id = ? ORDER BY id ASC`,
      [schoolId],
    );
    return rows.map(row => ({
      id: Number(row.id),
      emailSuffix: String(row.email_suffix),
      isActive: Number(row.is_active),
    }));
  }

  async getAdminOperationLogs() {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, action_type, target_type, target_id, detail, created_at
       FROM admin_operation_logs
       ORDER BY created_at DESC, id DESC
       LIMIT 30`,
    );
    return rows.map(
      row =>
        ({
          id: Number(row.id),
          actionType: String(row.action_type),
          targetType: String(row.target_type),
          targetId: Number(row.target_id),
          detail: String(row.detail),
          createdAt: new Date(row.created_at).toISOString(),
        }) satisfies AdminOperationLog,
    );
  }

  async appendAdminOperationLog(actionType: string, targetType: string, targetId: number, detail: string) {
    await this.execute(
      `INSERT INTO admin_operation_logs (action_type, target_type, target_id, detail, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [actionType, targetType, targetId, detail, new Date()],
    );
  }

  async createAdminEmailRule(schoolId: number, emailSuffix: string) {
    await this.execute(
      `INSERT INTO school_email_rules (school_id, email_suffix, is_active)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE is_active = 1`,
      [schoolId, emailSuffix],
    );
    const rules = await this.getAdminEmailRules(schoolId);
    const rule = rules.find(item => item.emailSuffix === emailSuffix);
    if (rule) {
      await this.appendAdminOperationLog(
        'CREATE_EMAIL_RULE',
        'EMAIL_RULE',
        rule.id,
        `Created email rule ${emailSuffix}`,
      );
    }
    return rules;
  }

  async updateAdminEmailRule(ruleId: number, isActive: boolean) {
    await this.execute(`UPDATE school_email_rules SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, ruleId]);
    await this.appendAdminOperationLog(
      'UPDATE_EMAIL_RULE',
      'EMAIL_RULE',
      ruleId,
      `${isActive ? 'Enabled' : 'Disabled'} email rule ${ruleId}`,
    );
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, email_suffix, is_active FROM school_email_rules WHERE id = ?`,
      [ruleId],
    );
    const row = rows[0];
    return row
      ? {
          id: Number(row.id),
          emailSuffix: String(row.email_suffix),
          isActive: Number(row.is_active),
        }
      : undefined;
  }

  async setAdminUserBanStatus(userId: number, isBanned: boolean, reason: string | null) {
    if (isBanned) {
      await this.execute(
        `INSERT INTO user_bans (user_id, reason, banned_at)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE reason = VALUES(reason), banned_at = VALUES(banned_at)`,
        [userId, reason, new Date()],
      );
      await this.appendAdminOperationLog('BAN_USER', 'USER', userId, reason ?? `Banned user ${userId}`);
    } else {
      await this.execute(`DELETE FROM user_bans WHERE user_id = ?`, [userId]);
      await this.appendAdminOperationLog('UNBAN_USER', 'USER', userId, `Unbanned user ${userId}`);
    }
    return (await this.getAdminUsers()).find(item => item.id === userId);
  }

  async createUserReport(targetUserId: number, category: string, description: string) {
    await this.execute(
      `INSERT INTO reports (reporter_user_id, target_user_id, category, description, status, created_at)
       VALUES (?, ?, ?, ?, 'PENDING', ?)`,
      [this.currentUserId, targetUserId, category, description, new Date()],
    );
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, target_user_id, category, description, status, created_at
       FROM reports WHERE reporter_user_id = ? ORDER BY id DESC LIMIT 1`,
      [this.currentUserId],
    );
    const row = rows[0];
    await this.appendAdminOperationLog(
      'CREATE_REPORT',
      'REPORT',
      Number(row.id),
      `User ${this.currentUserId} reported user ${targetUserId}`,
    );
    return {
      id: Number(row.id),
      targetUserId: Number(row.target_user_id),
      category: String(row.category),
      description: String(row.description),
      status: String(row.status) as 'PENDING' | 'RESOLVED',
      createdAt: new Date(row.created_at).toISOString(),
    } satisfies UserReportItem;
  }

  async getMyReports() {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, target_user_id, category, description, status, created_at
       FROM reports WHERE reporter_user_id = ? ORDER BY created_at DESC, id DESC`,
      [this.currentUserId],
    );
    return rows.map(
      row =>
        ({
          id: Number(row.id),
          targetUserId: Number(row.target_user_id),
          category: String(row.category),
          description: String(row.description),
          status: String(row.status) as 'PENDING' | 'RESOLVED',
          createdAt: new Date(row.created_at).toISOString(),
        }) satisfies UserReportItem,
    );
  }

  async createBlock(blockedUserId: number) {
    await this.execute(
      `INSERT IGNORE INTO user_blocks (user_id, blocked_user_id, created_at) VALUES (?, ?, ?)`,
      [this.currentUserId, blockedUserId, new Date()],
    );
    await this.appendAdminOperationLog(
      'BLOCK_USER',
      'USER',
      blockedUserId,
      `User ${this.currentUserId} blocked user ${blockedUserId}`,
    );
    return this.getBlocks();
  }

  async getBlocks() {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT blocked_user_id, created_at FROM user_blocks WHERE user_id = ? ORDER BY created_at DESC, blocked_user_id DESC`,
      [this.currentUserId],
    );
    return Promise.all(rows.map(async row => {
      const candidate = await this.findCandidateById(Number(row.blocked_user_id));
      return {
        blockedUserId: Number(row.blocked_user_id),
        blockedName: candidate?.name ?? `User ${row.blocked_user_id}`,
        createdAt: new Date(row.created_at).toISOString(),
      } satisfies UserBlockItem;
    }));
  }

  async removeBlock(blockedUserId: number) {
    await this.execute(`DELETE FROM user_blocks WHERE user_id = ? AND blocked_user_id = ?`, [
      this.currentUserId,
      blockedUserId,
    ]);
    await this.appendAdminOperationLog(
      'UNBLOCK_USER',
      'USER',
      blockedUserId,
      `User ${this.currentUserId} unblocked user ${blockedUserId}`,
    );
    return this.getBlocks();
  }

  async saveRecommendationAction(targetUserId: number, action: 'LIKE' | 'PASS') {
    await this.execute(
      `INSERT INTO recommendation_actions (user_id, target_user_id, action, created_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE action = VALUES(action), created_at = VALUES(created_at)`,
      [this.currentUserId, targetUserId, action, new Date()],
    );
  }

  async getRecommendationAction(targetUserId: number) {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT action FROM recommendation_actions WHERE user_id = ? AND target_user_id = ?`,
      [this.currentUserId, targetUserId],
    );
    return rows[0] ? { action: String(rows[0].action) as 'LIKE' | 'PASS' } : undefined;
  }

  async createOrActivateConnection(targetUserId: number) {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, state, conversation_id FROM connections WHERE user_id = ? AND target_user_id = ?`,
      [this.currentUserId, targetUserId],
    );
    if (rows[0]) {
      return { id: Number(rows[0].id), state: String(rows[0].state) };
    }

    const reverseRows = await this.query<RowDataPacket[]>(
      `SELECT id, state, conversation_id FROM connections WHERE user_id = ? AND target_user_id = ?`,
      [targetUserId, this.currentUserId],
    );
    const reverse = reverseRows[0];
    const conversationId =
      reverse?.conversation_id == null ? await this.getNextConversationId() : Number(reverse.conversation_id);
    const now = new Date();

    await this.execute(
      `INSERT INTO connections (user_id, target_user_id, state, conversation_id, created_at, updated_at)
       VALUES (?, ?, 'WAITING_FIRST_MESSAGE', ?, ?, ?)`,
      [this.currentUserId, targetUserId, conversationId, now, now],
    );

    if (!reverse) {
      await this.execute(
        `INSERT INTO connections (user_id, target_user_id, state, conversation_id, created_at, updated_at)
         VALUES (?, ?, 'WAITING_REPLY', ?, ?, ?)`,
        [targetUserId, this.currentUserId, conversationId, now, now],
      );
    } else if (reverse.conversation_id == null) {
      await this.execute(`UPDATE connections SET conversation_id = ?, updated_at = ? WHERE id = ?`, [
        conversationId,
        now,
        Number(reverse.id),
      ]);
    }

    const created = await this.query<RowDataPacket[]>(
      `SELECT id, state FROM connections WHERE user_id = ? AND target_user_id = ?`,
      [this.currentUserId, targetUserId],
    );
    return { id: Number(created[0].id), state: String(created[0].state) };
  }

  async getConnections() {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, target_user_id, state, conversation_id, updated_at
       FROM connections WHERE user_id = ? ORDER BY updated_at DESC, id DESC`,
      [this.currentUserId],
    );

    const result: ConnectionSummary[] = [];
    for (const row of rows) {
      const candidate = await this.findCandidateById(Number(row.target_user_id));
      if (!candidate) continue;
      const lastRows =
        row.conversation_id == null
          ? []
          : await this.query<RowDataPacket[]>(
              `SELECT sender_user_id, sender_role, content, created_at
               FROM messages WHERE conversation_id = ?
               ORDER BY created_at DESC, id DESC LIMIT 1`,
              [row.conversation_id],
            );
      const last = lastRows[0];
      result.push({
        id: Number(row.id),
        targetUserId: candidate.id,
        targetName: candidate.name,
        targetAge: candidate.age,
        targetSchool: candidate.school,
        state: row.state,
        canSendFirstMessage: row.state === 'WAITING_FIRST_MESSAGE',
        canMutualChat: row.state === 'MUTUAL_CHAT',
        conversationId: row.conversation_id == null ? null : Number(row.conversation_id),
        lastMessageSnippet: last ? String(last.content) : 'Connection created. Waiting for your first message.',
        lastMessageAt: last ? new Date(last.created_at).toISOString() : new Date(row.updated_at).toISOString(),
        unreadCount: row.conversation_id == null ? 0 : await this.getUnreadCount(Number(row.conversation_id)),
      });
    }
    return result;
  }

  async getConnectionDetail(connectionId: number) {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, target_user_id, state, conversation_id FROM connections WHERE id = ? AND user_id = ?`,
      [connectionId, this.currentUserId],
    );
    const row = rows[0];
    if (!row) return null;
    const candidate = await this.findCandidateById(Number(row.target_user_id));
    if (!candidate) return null;
    return {
      connectionId: Number(row.id),
      targetUserId: candidate.id,
      targetName: candidate.name,
      state: String(row.state),
      canSendFirstMessage: row.state === 'WAITING_FIRST_MESSAGE',
      canMutualChat: row.state === 'MUTUAL_CHAT',
      conversationId: row.conversation_id == null ? null : Number(row.conversation_id),
    };
  }

  async sendFirstMessage(connectionId: number, content: string) {
    const detail = await this.getConnectionDetail(connectionId);
    if (!detail || !detail.canSendFirstMessage || !detail.conversationId) return null;
    const now = new Date();
    await this.execute(
      `INSERT INTO messages (conversation_id, sender_user_id, sender_role, message_type, content, created_at)
       VALUES (?, ?, 'SELF', 'TEXT', ?, ?)`,
      [detail.conversationId, this.currentUserId, content, now],
    );
    await this.execute(
      `UPDATE connections SET state = 'WAITING_REPLY', first_message_sent_at = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
      [now, now, connectionId, this.currentUserId],
    );
    await this.execute(
      `UPDATE connections
       SET state = 'MUTUAL_CHAT', updated_at = ?
       WHERE conversation_id = ? AND user_id = ? AND target_user_id = ?`,
      [now, detail.conversationId, detail.targetUserId, this.currentUserId],
    );
    return this.getConnectionDetail(connectionId);
  }

  async getMessages(conversationId: number) {
    const connectionRows = await this.query<RowDataPacket[]>(
      `SELECT id FROM connections WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, this.currentUserId],
    );
    if (!connectionRows[0]) {
      return [];
    }

    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, conversation_id, sender_user_id, sender_role, message_type, content, created_at
       FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC`,
      [conversationId],
    );
    return rows.map(
      row =>
        ({
          id: Number(row.id),
          conversationId: Number(row.conversation_id),
          senderRole:
            row.sender_user_id == null
              ? row.sender_role
              : Number(row.sender_user_id) === this.currentUserId
                ? 'SELF'
                : 'TARGET',
          type: row.message_type,
          content: String(row.content),
          createdAt: new Date(row.created_at).toISOString(),
        }) satisfies ConversationMessage,
    );
  }

  async markConversationRead(conversationId: number) {
    const connectionRows = await this.query<RowDataPacket[]>(
      `SELECT id FROM connections WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, this.currentUserId],
    );
    if (!connectionRows[0]) {
      return;
    }

    const rows = await this.query<RowDataPacket[]>(
      `SELECT MAX(id) AS last_read_message_id
       FROM messages
       WHERE conversation_id = ?
         AND (
           (sender_user_id IS NOT NULL AND sender_user_id <> ?)
           OR (sender_user_id IS NULL AND sender_role = 'TARGET')
         )`,
      [conversationId, this.currentUserId],
    );
    const lastReadMessageId = Number(rows[0]?.last_read_message_id ?? 0);

    await this.execute(
      `INSERT INTO conversation_reads (user_id, conversation_id, last_read_message_id, last_read_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         last_read_message_id = VALUES(last_read_message_id),
         last_read_at = VALUES(last_read_at)`,
      [this.currentUserId, conversationId, lastReadMessageId, new Date()],
    );
  }

  async sendConversationMessage(conversationId: number, type: 'TEXT' | 'IMAGE' | 'VOICE', content: string) {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, state, target_user_id FROM connections WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, this.currentUserId],
    );
    const connection = rows[0];
    if (!connection || (connection.state !== 'MUTUAL_CHAT' && connection.state !== 'WAITING_REPLY')) return null;
    const now = new Date();
    await this.execute(
      `INSERT INTO messages (conversation_id, sender_user_id, sender_role, message_type, content, created_at)
       VALUES (?, ?, 'SELF', ?, ?, ?)`,
      [conversationId, this.currentUserId, type, content, now],
    );
    await this.execute(`UPDATE connections SET state = 'MUTUAL_CHAT', updated_at = ? WHERE id = ?`, [now, connection.id]);
    await this.execute(
      `UPDATE connections
       SET state = 'MUTUAL_CHAT', target_replied_at = COALESCE(target_replied_at, ?), updated_at = ?
       WHERE conversation_id = ? AND user_id = ? AND target_user_id = ?`,
      [now, now, conversationId, Number(connection.target_user_id), this.currentUserId],
    );
    return this.getMessages(conversationId);
  }
}



