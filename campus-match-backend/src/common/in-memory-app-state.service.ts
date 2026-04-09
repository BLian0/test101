import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { RequestContextService } from './request-context.service';

export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY';
export type Orientation = 'MALE' | 'FEMALE' | 'ALL';

export interface AppUser {
  id: number;
  schoolId: number;
  uid: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  registeredAt: string;
  profile?: {
    nickname: string;
    avatarUrl: string;
    age: number;
    gender: Gender;
    sexualOrientation: Orientation;
    monthlySpending: number;
    bio?: string;
    nicknameChangeCount?: number;
  };
  questionnaire?: {
    answers: Record<string, string>;
    tags: string[];
    traits: Array<{ code: string; label: string; value: number }>;
  };
  preferences?: {
    preferredGenders: Orientation[];
    ageMin: number;
    ageMax: number;
    relationshipGoal: 'SERIOUS' | 'EXPLORE' | 'BOTH';
    intimacyPreference: 'CONSERVATIVE' | 'BALANCED' | 'OPEN';
    valuePriority: 'STABILITY' | 'GROWTH' | 'FREEDOM';
    emotionalStyle: 'CALM' | 'DIRECT' | 'WARM';
  };
}

export type ConnectionState = 'WAITING_FIRST_MESSAGE' | 'WAITING_REPLY' | 'MUTUAL_CHAT';
export type MessageType = 'TEXT' | 'IMAGE' | 'VOICE';

export interface CandidateProfile {
  id: number;
  name: string;
  age: number;
  school: string;
  gender: Gender;
  sexualOrientation: Orientation;
  monthlySpending: number;
  tags: string[];
  traits: {
    relationship_commitment: number;
    physical_intimacy: number;
    social_energy: number;
    consumption_style: number;
    conflict_style: number;
  };
  intro: string;
}

export interface ConnectionSummary {
  id: number;
  targetUserId: number;
  targetName: string;
  targetAge: number;
  targetSchool: string;
  state: ConnectionState;
  canSendFirstMessage: boolean;
  canMutualChat: boolean;
  conversationId: number | null;
  lastMessageSnippet: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ConversationMessage {
  id: number;
  conversationId: number;
  senderRole: 'SELF' | 'TARGET';
  type: MessageType;
  content: string;
  createdAt: string;
 }

export interface AdminUserSummary {
  id: number;
  uid: string;
  username: string;
  email: string;
  phone: string;
  schoolName: string;
  registeredAt: string;
  profileCompleted: boolean;
  questionnaireCompleted: boolean;
  preferencesCompleted: boolean;
  nickname: string | null;
  isBanned: boolean;
  banReason: string | null;
}

export interface AdminReportSummary {
  id: number;
  reporterUserId: number;
  targetUserId: number;
  category: string;
  description: string;
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
  resolutionNote: string | null;
  resolvedAt: string | null;
}

export interface AdminOperationLog {
  id: number;
  actionType: string;
  targetType: string;
  targetId: number;
  detail: string;
  createdAt: string;
}

export interface UserReportItem {
  id: number;
  targetUserId: number;
  category: string;
  description: string;
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
}

export interface UserBlockItem {
  blockedUserId: number;
  blockedName: string;
  createdAt: string;
}

@Injectable()
export class InMemoryAppStateService implements OnModuleInit {
  private readonly seedUserId = 1;
  private readonly dbPath = resolve(process.cwd(), 'data', 'campus-match.sqlite');
  private db!: DatabaseSync;

  constructor(private readonly requestContext: RequestContextService) {}

  private get currentUserId() {
    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new UnauthorizedException('AUTH_UNAUTHORIZED');
    }

    return userId;
  }

  private readonly candidates: CandidateProfile[] = [
    {
      id: 1001,
      name: '林知夏',
      age: 22,
      school: '大连理工大学',
      gender: 'FEMALE' as Gender,
      sexualOrientation: 'MALE' as Orientation,
      monthlySpending: 2800,
      tags: ['认真进入关系', '边界清晰型', '安静慢聊型'],
      traits: {
        relationship_commitment: 90,
        physical_intimacy: 56,
        social_energy: 72,
        consumption_style: 48,
        conflict_style: 30,
      },
      intro: '看重长期关系里的稳定感，也希望对方愿意认真沟通。',
    },
    {
      id: 1002,
      name: '顾言',
      age: 24,
      school: '大连理工大学',
      gender: 'FEMALE' as Gender,
      sexualOrientation: 'ALL' as Orientation,
      monthlySpending: 2200,
      tags: ['稳定规划型', '慢热靠近型', '边界清晰型'],
      traits: {
        relationship_commitment: 84,
        physical_intimacy: 32,
        social_energy: 34,
        consumption_style: 24,
        conflict_style: 22,
      },
      intro: '慢热但稳定，不太喜欢高强度拉扯，希望关系有边界也有安全感。',
    },
    {
      id: 1003,
      name: '周棠',
      age: 21,
      school: '大连理工大学',
      gender: 'FEMALE' as Gender,
      sexualOrientation: 'MALE' as Orientation,
      monthlySpending: 2600,
      tags: ['体验平衡型', '自然推进', '社交活跃型'],
      traits: {
        relationship_commitment: 65,
        physical_intimacy: 60,
        social_energy: 86,
        consumption_style: 58,
        conflict_style: 62,
      },
      intro: '希望关系里有真诚和趣味，也接受在相处中慢慢靠近。',
    },
  ];

  onModuleInit() {
    mkdirSync(dirname(this.dbPath), { recursive: true });
    this.db = new DatabaseSync(this.dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schools (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS school_email_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id INTEGER NOT NULL,
        email_suffix TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        UNIQUE(school_id, email_suffix)
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        uid TEXT,
        school_id INTEGER NOT NULL,
        username TEXT,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        registered_at TEXT NOT NULL
      );

        CREATE TABLE IF NOT EXISTS email_verification_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          scene TEXT NOT NULL,
          code TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used_at TEXT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS phone_verification_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone TEXT NOT NULL,
          scene TEXT NOT NULL,
          code TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          used_at TEXT NULL,
          created_at TEXT NOT NULL
        );

      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id INTEGER PRIMARY KEY,
        nickname TEXT NOT NULL,
        avatar_url TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        sexual_orientation TEXT NOT NULL,
        monthly_spending INTEGER NOT NULL DEFAULT 0,
        bio TEXT,
        nickname_change_count INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS questionnaire_submissions (
        user_id INTEGER PRIMARY KEY,
        answers_json TEXT NOT NULL,
        tags_json TEXT NOT NULL,
        traits_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INTEGER PRIMARY KEY,
        preferred_genders_json TEXT NOT NULL,
        age_min INTEGER NOT NULL,
        age_max INTEGER NOT NULL,
        relationship_goal TEXT NOT NULL,
        intimacy_preference TEXT NOT NULL,
        value_priority TEXT NOT NULL,
        emotional_style TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recommendation_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        target_user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(user_id, target_user_id)
      );

      CREATE TABLE IF NOT EXISTS connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        target_user_id INTEGER NOT NULL,
        state TEXT NOT NULL,
        conversation_id INTEGER,
        first_message_sent_at TEXT,
        target_replied_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(user_id, target_user_id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        sender_user_id INTEGER,
        sender_role TEXT NOT NULL,
        message_type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversation_reads (
        user_id INTEGER NOT NULL,
        conversation_id INTEGER NOT NULL,
        last_read_message_id INTEGER NOT NULL DEFAULT 0,
        last_read_at TEXT NOT NULL,
        PRIMARY KEY (user_id, conversation_id)
      );

      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporter_user_id INTEGER NOT NULL,
        target_user_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_bans (
        user_id INTEGER PRIMARY KEY,
        reason TEXT,
        banned_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS report_resolutions (
        report_id INTEGER PRIMARY KEY,
        resolution_note TEXT,
        resolved_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admin_operation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_type TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        detail TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_blocks (
        user_id INTEGER NOT NULL,
        blocked_user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (user_id, blocked_user_id)
      );
    `);

    const messageColumns = this.db.prepare(`PRAGMA table_info(messages)`).all() as Array<{ name: string }>;
    if (!messageColumns.some(column => column.name === 'sender_user_id')) {
      this.db.exec(`ALTER TABLE messages ADD COLUMN sender_user_id INTEGER`);
    }

    const userColumns = this.db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>;
    if (!userColumns.some(column => column.name === 'username')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN username TEXT`);
    }
    this.db
      .prepare(
        `UPDATE users
         SET username = lower(substr(email, 1, instr(email, '@') - 1))
         WHERE username IS NULL OR trim(username) = ''`,
      )
      .run();
    this.db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
    if (!userColumns.some(column => column.name === 'uid')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN uid TEXT`);
    }
    this.db
      .prepare(
        `UPDATE users
         SET uid = '26' || printf('%06d', id)`,
      )
      .run();
    this.db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uid ON users(uid)`);

    const profileColumns = this.db.prepare(`PRAGMA table_info(user_profiles)`).all() as Array<{ name: string }>;
    if (!profileColumns.some(column => column.name === 'monthly_spending')) {
      this.db.exec(`ALTER TABLE user_profiles ADD COLUMN monthly_spending INTEGER NOT NULL DEFAULT 0`);
    }
    if (!profileColumns.some(column => column.name === 'nickname_change_count')) {
      this.db.exec(`ALTER TABLE user_profiles ADD COLUMN nickname_change_count INTEGER NOT NULL DEFAULT 0`);
    }
    this.db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_nickname ON user_profiles(nickname)`);

    this.seed();
  }

  private seed() {
    this.db
      .prepare(`INSERT OR IGNORE INTO schools (id, name, code) VALUES (1, '澶ц繛鐞嗗伐澶у', 'DLUT')`)
      .run();

    for (const suffix of ['mail.dlut.edu.cn', 'dlut.edu.cn']) {
      this.db
        .prepare(
          `INSERT OR IGNORE INTO school_email_rules (school_id, email_suffix, is_active) VALUES (1, ?, 1)`,
        )
        .run(suffix);
    }

    this.db
      .prepare(
        `INSERT OR IGNORE INTO users (id, uid, school_id, username, email, phone, password, registered_at)
         VALUES (1, '26000001', 1, 'demo', 'demo@mail.dlut.edu.cn', '13800000000', 'abc123', ?)`,
      )
      .run(new Date().toISOString());

    this.seedConnections();
  }

  private seedConnections() {
    const mutualConversationId = 10011;
    const waitingConversationId = 10021;

    this.db
      .prepare(
        `INSERT OR IGNORE INTO connections (
           id, user_id, target_user_id, state, conversation_id, first_message_sent_at, target_replied_at, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        1,
        this.seedUserId,
        1001,
        'MUTUAL_CHAT',
        mutualConversationId,
        '2026-04-02T11:40:00.000Z',
        '2026-04-02T12:00:00.000Z',
        '2026-04-02T11:30:00.000Z',
        '2026-04-02T12:00:00.000Z',
      );

    this.db
      .prepare(
        `INSERT OR IGNORE INTO connections (
           id, user_id, target_user_id, state, conversation_id, first_message_sent_at, target_replied_at, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        2,
        this.seedUserId,
        1002,
        'WAITING_REPLY',
        waitingConversationId,
        '2026-04-02T12:10:00.000Z',
        null,
        '2026-04-02T12:05:00.000Z',
        '2026-04-02T12:10:00.000Z',
      );

    this.db
      .prepare(
        `INSERT OR IGNORE INTO messages (conversation_id, sender_user_id, sender_role, message_type, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        mutualConversationId,
        this.seedUserId,
        'SELF',
        'TEXT',
        '我比较看重关系里的稳定感，这点我们挺像的。',
        '2026-04-02T11:40:00.000Z',
      );

    this.db
      .prepare(
        `INSERT OR IGNORE INTO messages (conversation_id, sender_user_id, sender_role, message_type, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        mutualConversationId,
        1001,
        'TARGET',
        'TEXT',
        '我也是，慢一点推进没关系，但希望彼此都认真。',
        '2026-04-02T12:00:00.000Z',
      );

    this.db
      .prepare(
        `INSERT OR IGNORE INTO messages (conversation_id, sender_user_id, sender_role, message_type, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        waitingConversationId,
        this.seedUserId,
        'SELF',
        'TEXT',
        '你好，我看到你也挺看重边界感，想先认识一下。',
        '2026-04-02T12:10:00.000Z',
      );

    this.db
      .prepare(
        `INSERT OR IGNORE INTO reports (id, reporter_user_id, target_user_id, category, description, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        1,
        this.seedUserId,
        1003,
        'HARASSMENT',
        '对方在试探性聊天里多次越过我设定的边界，想先提交给管理员查看。',
        'PENDING',
        '2026-04-02T13:20:00.000Z',
      );

    this.db
      .prepare(
        `INSERT OR IGNORE INTO user_bans (user_id, reason, banned_at)
         VALUES (?, ?, ?)`,
      )
      .run(1, '开发态示例封禁原因：重复触发风控测试。', '2026-04-02T13:40:00.000Z');

    this.db
      .prepare(
        `INSERT OR IGNORE INTO admin_operation_logs (id, action_type, target_type, target_id, detail, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(1, 'BAN_USER', 'USER', 1, '初始化示例操作：封禁用户 1。', '2026-04-02T13:40:00.000Z');
  }

  getSchool() {
    const school = this.db.prepare(`SELECT id, name, code FROM schools WHERE id = 1`).get() as {
      id: number;
      name: string;
      code: string;
    };
    const emailRules = this.db
      .prepare(`SELECT email_suffix FROM school_email_rules WHERE school_id = 1 AND is_active = 1 ORDER BY id`)
      .all() as Array<{ email_suffix: string }>;

    return {
      ...school,
      emailRules: emailRules.map(item => item.email_suffix),
    };
  }

  getCurrentUser(): AppUser {
    const user = this.db
      .prepare(`SELECT id, uid, school_id, username, email, phone, password, registered_at FROM users WHERE id = ?`)
      .get(this.currentUserId) as {
      id: number;
      uid: string;
      school_id: number;
      username: string;
      email: string;
      phone: string;
      password: string;
      registered_at: string;
    };

    const profile = this.db
      .prepare(
        `SELECT nickname, avatar_url, age, gender, sexual_orientation, monthly_spending, bio, nickname_change_count FROM user_profiles WHERE user_id = ?`,
      )
      .get(this.currentUserId) as
      | {
          nickname: string;
          avatar_url: string;
          age: number;
          gender: Gender;
          sexual_orientation: Orientation;
          monthly_spending: number;
          bio: string | null;
          nickname_change_count: number;
        }
      | undefined;

    const questionnaire = this.db
      .prepare(
        `SELECT answers_json, tags_json, traits_json FROM questionnaire_submissions WHERE user_id = ?`,
      )
      .get(this.currentUserId) as
      | {
          answers_json: string;
          tags_json: string;
          traits_json: string;
        }
      | undefined;

    const preference = this.db
      .prepare(
        `SELECT preferred_genders_json, age_min, age_max, relationship_goal, intimacy_preference, value_priority, emotional_style
         FROM user_preferences WHERE user_id = ?`,
      )
      .get(this.currentUserId) as
      | {
          preferred_genders_json: string;
          age_min: number;
          age_max: number;
          relationship_goal: 'SERIOUS' | 'EXPLORE' | 'BOTH';
          intimacy_preference: 'CONSERVATIVE' | 'BALANCED' | 'OPEN';
          value_priority: 'STABILITY' | 'GROWTH' | 'FREEDOM';
          emotional_style: 'CALM' | 'DIRECT' | 'WARM';
        }
      | undefined;

    return {
      id: user.id,
      uid: user.uid,
      schoolId: user.school_id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      password: user.password,
      registeredAt: user.registered_at,
      profile: profile
        ? {
            nickname: profile.nickname,
            avatarUrl: profile.avatar_url,
            age: profile.age,
            gender: profile.gender,
            sexualOrientation: profile.sexual_orientation,
            monthlySpending: Number(profile.monthly_spending ?? 0),
            bio: profile.bio ?? undefined,
            nicknameChangeCount: Number(profile.nickname_change_count ?? 0),
          }
        : undefined,
      questionnaire: questionnaire
        ? {
            answers: JSON.parse(questionnaire.answers_json),
            tags: JSON.parse(questionnaire.tags_json),
            traits: JSON.parse(questionnaire.traits_json),
          }
        : undefined,
      preferences: preference
        ? {
            preferredGenders: JSON.parse(preference.preferred_genders_json),
            ageMin: preference.age_min,
            ageMax: preference.age_max,
            relationshipGoal: preference.relationship_goal,
            intimacyPreference: preference.intimacy_preference,
            valuePriority: preference.value_priority,
            emotionalStyle: preference.emotional_style,
          }
        : undefined,
    };
  }

  findUserByEmail(email: string) {
    return this.db.prepare(`SELECT id, username, email, phone, password FROM users WHERE email = ?`).get(email) as
      | { id: number; username: string; email: string; phone: string; password: string }
      | undefined;
  }

  findUserByUsername(username: string) {
    return this.db.prepare(`SELECT id, username, email, phone, password FROM users WHERE username = ?`).get(username) as
      | { id: number; username: string; email: string; phone: string; password: string }
      | undefined;
  }

  isNicknameAvailable(nickname: string) {
    const normalized = nickname.trim();
    if (!normalized) {
      return false;
    }

    const row = this.db
      .prepare(`SELECT user_id FROM user_profiles WHERE nickname = ? LIMIT 1`)
      .get(normalized) as { user_id: number } | undefined;

    if (!row) {
      return true;
    }

    return Number(row.user_id) === this.currentUserId;
  }

  findUserByPhone(phone: string) {
    return this.db.prepare(`SELECT id, username, email, phone, password FROM users WHERE phone = ?`).get(phone) as
      | { id: number; username: string; email: string; phone: string; password: string }
      | undefined;
  }

  updateUserPassword(email: string, password: string) {
    const result = this.db.prepare(`UPDATE users SET password = ? WHERE email = ?`).run(password, email);
    return result.changes > 0;
  }

  issueEmailVerificationCode(payload: {
    email: string;
    scene: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD';
    code: string;
    expiresAt: string;
  }) {
    this.db
      .prepare(`UPDATE email_verification_codes SET used_at = ? WHERE email = ? AND scene = ? AND used_at IS NULL`)
      .run(new Date().toISOString(), payload.email, payload.scene);

    this.db
      .prepare(
        `INSERT INTO email_verification_codes (email, scene, code, expires_at, used_at, created_at)
         VALUES (?, ?, ?, ?, NULL, ?)`,
      )
      .run(payload.email, payload.scene, payload.code, payload.expiresAt, new Date().toISOString());
    }

  getEmailVerificationRateLimit(payload: {
    email: string;
    scene: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD';
  }) {
    const row = this.db
      .prepare(
        `SELECT
           MAX(created_at) AS last_sent_at,
           SUM(CASE WHEN datetime(created_at) >= datetime(?) THEN 1 ELSE 0 END) AS count_last_hour
         FROM email_verification_codes
         WHERE email = ? AND scene = ?`,
      )
      .get(new Date(Date.now() - 60 * 60 * 1000).toISOString(), payload.email, payload.scene) as {
      last_sent_at: string | null;
      count_last_hour: number | null;
    };

    return {
      lastSentAt: row?.last_sent_at ? String(row.last_sent_at) : null,
      countLastHour: Number(row?.count_last_hour ?? 0),
    };
  }

  issuePhoneVerificationCode(payload: {
    phone: string;
    scene: 'REGISTER' | 'LOGIN';
    code: string;
    expiresAt: string;
  }) {
    this.db
      .prepare(`UPDATE phone_verification_codes SET used_at = ? WHERE phone = ? AND scene = ? AND used_at IS NULL`)
      .run(new Date().toISOString(), payload.phone, payload.scene);

    this.db
      .prepare(
        `INSERT INTO phone_verification_codes (phone, scene, code, expires_at, used_at, created_at)
         VALUES (?, ?, ?, ?, NULL, ?)`,
      )
      .run(payload.phone, payload.scene, payload.code, payload.expiresAt, new Date().toISOString());
  }

  verifyEmailVerificationCode(payload: {
    email: string;
    scene: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD';
    code: string;
  }) {
    const row = this.db
      .prepare(
        `SELECT id, expires_at
         FROM email_verification_codes
         WHERE email = ? AND scene = ? AND code = ? AND used_at IS NULL
         ORDER BY datetime(created_at) DESC, id DESC
         LIMIT 1`,
      )
      .get(payload.email, payload.scene, payload.code) as { id: number; expires_at: string } | undefined;

    if (!row || new Date(row.expires_at).getTime() < Date.now()) {
      return false;
    }

    return true;
  }

  verifyPhoneVerificationCode(payload: { phone: string; scene: 'REGISTER' | 'LOGIN'; code: string }) {
    const row = this.db
      .prepare(
        `SELECT id, expires_at
         FROM phone_verification_codes
         WHERE phone = ? AND scene = ? AND code = ? AND used_at IS NULL
         ORDER BY datetime(created_at) DESC, id DESC
         LIMIT 1`,
      )
      .get(payload.phone, payload.scene, payload.code) as { id: number; expires_at: string } | undefined;

    if (!row || new Date(row.expires_at).getTime() < Date.now()) {
      return false;
    }

    return true;
  }

  consumeEmailVerificationCode(payload: {
    email: string;
    scene: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD';
    code: string;
  }) {
    const row = this.db
      .prepare(
        `SELECT id, expires_at
         FROM email_verification_codes
         WHERE email = ? AND scene = ? AND code = ? AND used_at IS NULL
         ORDER BY datetime(created_at) DESC, id DESC
         LIMIT 1`,
      )
      .get(payload.email, payload.scene, payload.code) as { id: number; expires_at: string } | undefined;

    if (!row || new Date(row.expires_at).getTime() < Date.now()) {
      return;
    }

    this.db
      .prepare(`UPDATE email_verification_codes SET used_at = ? WHERE id = ?`)
      .run(new Date().toISOString(), row.id);
  }

  consumePhoneVerificationCode(payload: { phone: string; scene: 'REGISTER' | 'LOGIN'; code: string }) {
    const row = this.db
      .prepare(
        `SELECT id, expires_at
         FROM phone_verification_codes
         WHERE phone = ? AND scene = ? AND code = ? AND used_at IS NULL
         ORDER BY datetime(created_at) DESC, id DESC
         LIMIT 1`,
      )
      .get(payload.phone, payload.scene, payload.code) as { id: number; expires_at: string } | undefined;

    if (!row || new Date(row.expires_at).getTime() < Date.now()) {
      return;
    }

    this.db
      .prepare(`UPDATE phone_verification_codes SET used_at = ? WHERE id = ?`)
      .run(new Date().toISOString(), row.id);
  }

  registerUser(payload: { username: string; email: string; phone?: string; password: string }) {
    const userCountRow = this.db.prepare(`SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM users`).get() as {
      next_id: number;
    };
    const uid = `26${String(userCountRow.next_id).padStart(6, '0')}`;
    const phone = payload.phone?.trim() || `virtual${String(userCountRow.next_id).padStart(8, '0')}`;
    this.db
      .prepare(
        `INSERT INTO users (uid, school_id, username, email, phone, password, registered_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(uid, 1, payload.username, payload.email, phone, payload.password, new Date().toISOString());

    const user = this.db
      .prepare(`SELECT id, uid, school_id, username, email, phone, password, registered_at FROM users WHERE email = ?`)
      .get(payload.email) as {
      id: number;
      uid: string;
      school_id: number;
      username: string;
      email: string;
      phone: string;
      password: string;
      registered_at: string;
    };

    return {
      id: user.id,
      uid: user.uid,
      schoolId: user.school_id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      password: user.password,
      registeredAt: user.registered_at,
    } satisfies AppUser;
  }

  saveProfile(profile: AppUser['profile']) {
    const nextNickname = String(profile?.nickname ?? '').trim();
    const currentProfile = this.db
      .prepare(`SELECT nickname, nickname_change_count FROM user_profiles WHERE user_id = ?`)
      .get(this.currentUserId) as { nickname: string; nickname_change_count: number } | undefined;
    const currentNickname = currentProfile?.nickname ?? '';
    const nicknameChangeCount = Number(currentProfile?.nickname_change_count ?? 0);

    if (currentNickname && currentNickname !== nextNickname && nicknameChangeCount >= 1) {
      throw new UnauthorizedException('PROFILE_NICKNAME_CHANGE_LIMIT');
    }

    const available = this.isNicknameAvailable(nextNickname);
    if (!available) {
      throw new UnauthorizedException('PROFILE_NICKNAME_ALREADY_EXISTS');
    }

    const nextNicknameChangeCount =
      currentNickname && currentNickname !== nextNickname ? nicknameChangeCount + 1 : nicknameChangeCount;

    this.db
      .prepare(
        `INSERT INTO user_profiles (user_id, nickname, avatar_url, age, gender, sexual_orientation, monthly_spending, bio, nickname_change_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           nickname = excluded.nickname,
           avatar_url = excluded.avatar_url,
           age = excluded.age,
           gender = excluded.gender,
           sexual_orientation = excluded.sexual_orientation,
           monthly_spending = excluded.monthly_spending,
           bio = excluded.bio,
           nickname_change_count = excluded.nickname_change_count`,
      )
      .run(
        this.currentUserId,
        nextNickname,
        profile?.avatarUrl ?? '',
        profile?.age ?? 18,
        profile?.gender ?? 'MALE',
        profile?.sexualOrientation ?? 'ALL',
        profile?.monthlySpending ?? 0,
        profile?.bio ?? null,
        nextNicknameChangeCount,
      );

    return this.getCurrentUser().profile;
  }

  saveQuestionnaire(questionnaire: AppUser['questionnaire']) {
    this.db
      .prepare(
        `INSERT INTO questionnaire_submissions (user_id, answers_json, tags_json, traits_json)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           answers_json = excluded.answers_json,
           tags_json = excluded.tags_json,
           traits_json = excluded.traits_json`,
      )
      .run(
        this.currentUserId,
        JSON.stringify(questionnaire?.answers ?? {}),
        JSON.stringify(questionnaire?.tags ?? []),
        JSON.stringify(questionnaire?.traits ?? []),
      );

    return this.getCurrentUser().questionnaire;
  }

  savePreferences(preferences: AppUser['preferences']) {
    this.db
      .prepare(
        `INSERT INTO user_preferences (
           user_id, preferred_genders_json, age_min, age_max, relationship_goal, intimacy_preference, value_priority, emotional_style
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           preferred_genders_json = excluded.preferred_genders_json,
           age_min = excluded.age_min,
           age_max = excluded.age_max,
           relationship_goal = excluded.relationship_goal,
           intimacy_preference = excluded.intimacy_preference,
           value_priority = excluded.value_priority,
           emotional_style = excluded.emotional_style`,
      )
      .run(
        this.currentUserId,
        JSON.stringify(preferences?.preferredGenders ?? []),
        preferences?.ageMin ?? 18,
        preferences?.ageMax ?? 30,
        preferences?.relationshipGoal ?? 'SERIOUS',
        preferences?.intimacyPreference ?? 'BALANCED',
        preferences?.valuePriority ?? 'STABILITY',
        preferences?.emotionalStyle ?? 'WARM',
      );

    return this.getCurrentUser().preferences;
  }

  private loadUserCandidate(userId: number) {
    const row = this.db
      .prepare(
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
      )
      .get(userId) as
      | {
          id: number;
          school_name: string;
          nickname: string | null;
          age: number | null;
          gender: Gender | null;
          sexual_orientation: Orientation | null;
          monthly_spending: number | null;
          bio: string | null;
          tags_json: string | null;
          traits_json: string | null;
        }
      | undefined;

    if (!row || row.nickname == null || row.age == null || row.gender == null) {
      return undefined;
    }

    const tags = row.tags_json ? (JSON.parse(row.tags_json) as string[]) : [];
    const traits = row.traits_json
      ? (JSON.parse(row.traits_json) as Array<{ code?: string; value?: number }>)
      : [];

    const pick = (code: string, fallback: number) =>
      typeof traits.find(item => item.code === code)?.value === 'number'
        ? Number(traits.find(item => item.code === code)?.value)
        : fallback;

    return {
      id: Number(row.id),
      name: String(row.nickname),
      age: Number(row.age),
      school: String(row.school_name),
      gender: row.gender,
      sexualOrientation: row.sexual_orientation ?? 'ALL',
      monthlySpending: Number(row.monthly_spending ?? 0),
      tags,
      traits: {
        relationship_commitment: pick('relationship_commitment', 60),
        physical_intimacy: pick('physical_intimacy', 50),
        social_energy: pick('social_energy', 50),
        consumption_style: pick('consumption_style', 50),
        conflict_style: pick('conflict_style', 50),
      },
      intro: row.bio ?? '资料已完善，等你进一步了解。',
    } satisfies CandidateProfile;
  }

  getCandidates() {
    const userCandidates = this.db
      .prepare(
        `SELECT u.id
         FROM users u
         JOIN user_profiles p ON p.user_id = u.id
         WHERE u.id <> ?
         ORDER BY datetime(u.registered_at) DESC, u.id DESC`,
      )
      .all(this.currentUserId)
      .map(row => this.loadUserCandidate(Number(row.id)))
      .filter((item): item is CandidateProfile => Boolean(item));

    return [...userCandidates, ...this.candidates];
  }

  getStorageInfo() {
    return {
      driver: 'sqlite',
      sqlitePath: this.dbPath,
    };
  }

  getAdminUsers(): AdminUserSummary[] {
    return this.db
      .prepare(
      `SELECT
         u.id,
         u.uid,
         u.username,
         u.email,
         u.phone,
           s.name AS school_name,
           u.registered_at AS registeredAt,
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
         ORDER BY datetime(u.registered_at) DESC, u.id DESC`,
      )
      .all()
      .map(
        row =>
          ({
            id: Number(row.id),
            uid: String(row.uid),
            username: String(row.username),
            email: String(row.email),
            phone: String(row.phone),
            schoolName: String(row.school_name),
            registeredAt: String(row.registeredAt),
            nickname: row.nickname == null ? null : String(row.nickname),
            profileCompleted: row.nickname != null,
            questionnaireCompleted: row.questionnaire_user_id != null,
            preferencesCompleted: row.preference_user_id != null,
            isBanned: row.banned_user_id != null,
            banReason: row.ban_reason == null ? null : String(row.ban_reason),
          }) satisfies AdminUserSummary,
      );
  }

  getAdminReports(): AdminReportSummary[] {
    return this.db
      .prepare(
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
         ORDER BY datetime(created_at) DESC, id DESC`,
      )
      .all()
      .map(
        row =>
          ({
            id: Number(row.id),
            reporterUserId: Number(row.reporter_user_id),
            targetUserId: Number(row.target_user_id),
            category: String(row.category),
            description: String(row.description),
            status: String(row.status) as 'PENDING' | 'RESOLVED',
            createdAt: String(row.created_at),
            resolutionNote: row.resolution_note == null ? null : String(row.resolution_note),
            resolvedAt: row.resolved_at == null ? null : String(row.resolved_at),
          }) satisfies AdminReportSummary,
      );
  }

  resolveAdminReport(reportId: number, resolutionNote: string | null) {
    this.db
      .prepare(`UPDATE reports SET status = ? WHERE id = ?`)
      .run('RESOLVED', reportId);

    this.db
      .prepare(
        `INSERT INTO report_resolutions (report_id, resolution_note, resolved_at)
         VALUES (?, ?, ?)
         ON CONFLICT(report_id) DO UPDATE SET
           resolution_note = excluded.resolution_note,
           resolved_at = excluded.resolved_at`,
      )
      .run(reportId, resolutionNote, new Date().toISOString());

    this.appendAdminOperationLog(
      'RESOLVE_REPORT',
      'REPORT',
      reportId,
      resolutionNote ?? `澶勭悊涓炬姤 ${reportId}`,
    );

    return this.getAdminReports().find(report => report.id === reportId);
  }

  getAdminEmailRules(schoolId: number) {
    return this.db
      .prepare(
        `SELECT id, email_suffix AS emailSuffix, is_active AS isActive
         FROM school_email_rules
         WHERE school_id = ?
         ORDER BY id ASC`,
      )
      .all(schoolId) as unknown as Array<{
      id: number;
      emailSuffix: string;
      isActive: number;
    }>;
  }

  getAdminOperationLogs(): AdminOperationLog[] {
    return this.db
      .prepare(
        `SELECT id, action_type, target_type, target_id, detail, created_at
         FROM admin_operation_logs
         ORDER BY datetime(created_at) DESC, id DESC
         LIMIT 30`,
      )
      .all()
      .map(
        row =>
          ({
            id: Number(row.id),
            actionType: String(row.action_type),
            targetType: String(row.target_type),
            targetId: Number(row.target_id),
            detail: String(row.detail),
            createdAt: String(row.created_at),
          }) satisfies AdminOperationLog,
      );
  }

  appendAdminOperationLog(actionType: string, targetType: string, targetId: number, detail: string) {
    this.db
      .prepare(
        `INSERT INTO admin_operation_logs (action_type, target_type, target_id, detail, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(actionType, targetType, targetId, detail, new Date().toISOString());
  }

  createAdminEmailRule(schoolId: number, emailSuffix: string) {
    this.db
      .prepare(
        `INSERT INTO school_email_rules (school_id, email_suffix, is_active)
         VALUES (?, ?, 1)
         ON CONFLICT(school_id, email_suffix) DO UPDATE SET
           is_active = 1`,
      )
      .run(schoolId, emailSuffix);

    const rule = this.db
      .prepare(
        `SELECT id FROM school_email_rules WHERE school_id = ? AND email_suffix = ?`,
      )
      .get(schoolId, emailSuffix) as { id: number } | undefined;

    if (rule) {
      this.appendAdminOperationLog('CREATE_EMAIL_RULE', 'EMAIL_RULE', rule.id, `鏂板閭鍚庣紑 ${emailSuffix}`);
    }

    return this.getAdminEmailRules(schoolId);
  }

  updateAdminEmailRule(ruleId: number, isActive: boolean) {
    this.db
      .prepare(`UPDATE school_email_rules SET is_active = ? WHERE id = ?`)
      .run(isActive ? 1 : 0, ruleId);

    this.appendAdminOperationLog(
      'UPDATE_EMAIL_RULE',
      'EMAIL_RULE',
      ruleId,
      `${isActive ? '鍚敤' : '鍋滅敤'}閭瑙勫垯 ${ruleId}`,
    );

    return this.db
      .prepare(
        `SELECT id, email_suffix AS emailSuffix, is_active AS isActive
         FROM school_email_rules
         WHERE id = ?`,
      )
      .get(ruleId) as unknown as { id: number; emailSuffix: string; isActive: number } | undefined;
  }

  setAdminUserBanStatus(userId: number, isBanned: boolean, reason: string | null) {
    if (isBanned) {
      this.db
        .prepare(
          `INSERT INTO user_bans (user_id, reason, banned_at)
           VALUES (?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             reason = excluded.reason,
             banned_at = excluded.banned_at`,
        )
        .run(userId, reason, new Date().toISOString());
      this.appendAdminOperationLog('BAN_USER', 'USER', userId, reason ?? `灏佺鐢ㄦ埛 ${userId}`);
    } else {
      this.db.prepare(`DELETE FROM user_bans WHERE user_id = ?`).run(userId);
      this.appendAdminOperationLog('UNBAN_USER', 'USER', userId, `瑙ｅ皝鐢ㄦ埛 ${userId}`);
    }

    return this.getAdminUsers().find(user => user.id === userId);
  }

  findCandidateById(targetUserId: number) {
    return this.loadUserCandidate(targetUserId) ?? this.candidates.find(candidate => candidate.id === targetUserId);
  }

  createUserReport(targetUserId: number, category: string, description: string) {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO reports (reporter_user_id, target_user_id, category, description, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(this.currentUserId, targetUserId, category, description, 'PENDING', now);

    const report = this.db
      .prepare(
        `SELECT id, target_user_id, category, description, status, created_at
         FROM reports
         WHERE reporter_user_id = ?
         ORDER BY id DESC
         LIMIT 1`,
      )
      .get(this.currentUserId) as {
      id: number;
      target_user_id: number;
      category: string;
      description: string;
      status: 'PENDING' | 'RESOLVED';
      created_at: string;
    };

    this.appendAdminOperationLog('CREATE_REPORT', 'REPORT', report.id, `鐢ㄦ埛 ${this.currentUserId} 涓炬姤鐢ㄦ埛 ${targetUserId}`);

    return {
      id: report.id,
      targetUserId: report.target_user_id,
      category: report.category,
      description: report.description,
      status: report.status,
      createdAt: report.created_at,
    } satisfies UserReportItem;
  }

  getMyReports(): UserReportItem[] {
    return this.db
      .prepare(
        `SELECT id, target_user_id, category, description, status, created_at
         FROM reports
         WHERE reporter_user_id = ?
         ORDER BY datetime(created_at) DESC, id DESC`,
      )
      .all(this.currentUserId)
      .map(
        row =>
          ({
            id: Number(row.id),
            targetUserId: Number(row.target_user_id),
            category: String(row.category),
            description: String(row.description),
            status: String(row.status) as 'PENDING' | 'RESOLVED',
            createdAt: String(row.created_at),
          }) satisfies UserReportItem,
      );
  }

  createBlock(blockedUserId: number) {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO user_blocks (user_id, blocked_user_id, created_at)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, blocked_user_id) DO NOTHING`,
      )
      .run(this.currentUserId, blockedUserId, now);

    this.appendAdminOperationLog('BLOCK_USER', 'USER', blockedUserId, `鐢ㄦ埛 ${this.currentUserId} 鎷夐粦鐢ㄦ埛 ${blockedUserId}`);

    return this.getBlocks();
  }

  getBlocks(): UserBlockItem[] {
    return this.db
      .prepare(
        `SELECT blocked_user_id, created_at
         FROM user_blocks
         WHERE user_id = ?
         ORDER BY datetime(created_at) DESC, blocked_user_id DESC`,
      )
      .all(this.currentUserId)
      .map(row => {
        const candidate = this.findCandidateById(Number(row.blocked_user_id));
        return {
          blockedUserId: Number(row.blocked_user_id),
          blockedName: candidate?.name ?? `鐢ㄦ埛 ${row.blocked_user_id}`,
          createdAt: String(row.created_at),
        } satisfies UserBlockItem;
      });
  }

  removeBlock(blockedUserId: number) {
    this.db
      .prepare(`DELETE FROM user_blocks WHERE user_id = ? AND blocked_user_id = ?`)
      .run(this.currentUserId, blockedUserId);

    this.appendAdminOperationLog('UNBLOCK_USER', 'USER', blockedUserId, `鐢ㄦ埛 ${this.currentUserId} 鍙栨秷鎷夐粦鐢ㄦ埛 ${blockedUserId}`);

    return this.getBlocks();
  }

  saveRecommendationAction(targetUserId: number, action: 'LIKE' | 'PASS') {
    this.db
      .prepare(
        `INSERT INTO recommendation_actions (user_id, target_user_id, action, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, target_user_id) DO UPDATE SET
           action = excluded.action,
           created_at = excluded.created_at`,
      )
      .run(this.currentUserId, targetUserId, action, new Date().toISOString());
  }

  getRecommendationAction(targetUserId: number) {
    return this.db
      .prepare(
        `SELECT action FROM recommendation_actions WHERE user_id = ? AND target_user_id = ?`,
      )
      .get(this.currentUserId, targetUserId) as { action: 'LIKE' | 'PASS' } | undefined;
  }

  createOrActivateConnection(targetUserId: number) {
    const now = new Date().toISOString();
    const existing = this.db
      .prepare(
        `SELECT id, user_id, target_user_id, state, conversation_id, first_message_sent_at, target_replied_at, created_at, updated_at
         FROM connections WHERE user_id = ? AND target_user_id = ?`,
      )
      .get(this.currentUserId, targetUserId) as
      | {
          id: number;
          user_id: number;
          target_user_id: number;
          state: ConnectionState;
          conversation_id: number | null;
          first_message_sent_at: string | null;
          target_replied_at: string | null;
          created_at: string;
          updated_at: string;
        }
      | undefined;

    if (existing) {
      return existing;
    }

    const reverse = this.db
      .prepare(
        `SELECT id, user_id, target_user_id, state, conversation_id, first_message_sent_at, target_replied_at, created_at, updated_at
         FROM connections WHERE user_id = ? AND target_user_id = ?`,
      )
      .get(targetUserId, this.currentUserId) as
      | {
          id: number;
          user_id: number;
          target_user_id: number;
          state: ConnectionState;
          conversation_id: number | null;
          first_message_sent_at: string | null;
          target_replied_at: string | null;
          created_at: string;
          updated_at: string;
        }
      | undefined;

    const conversationSeed = this.db
      .prepare(`SELECT COALESCE(MAX(conversation_id), 20000) + 1 AS next_id FROM connections WHERE conversation_id IS NOT NULL`)
      .get() as { next_id: number };
    const conversationId = reverse?.conversation_id ?? Number(conversationSeed.next_id);

    this.db
      .prepare(
        `INSERT INTO connections (
           user_id, target_user_id, state, conversation_id, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(this.currentUserId, targetUserId, 'WAITING_FIRST_MESSAGE', conversationId, now, now);

    if (!reverse) {
      this.db
        .prepare(
          `INSERT INTO connections (
             user_id, target_user_id, state, conversation_id, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(targetUserId, this.currentUserId, 'WAITING_REPLY', conversationId, now, now);
    } else if (reverse.conversation_id == null) {
      this.db
        .prepare(`UPDATE connections SET conversation_id = ?, updated_at = ? WHERE id = ?`)
        .run(conversationId, now, reverse.id);
    }

    return this.db
      .prepare(
        `SELECT id, user_id, target_user_id, state, conversation_id, first_message_sent_at, target_replied_at, created_at, updated_at
         FROM connections WHERE user_id = ? AND target_user_id = ?`,
      )
      .get(this.currentUserId, targetUserId) as {
      id: number;
      user_id: number;
      target_user_id: number;
      state: ConnectionState;
      conversation_id: number | null;
      first_message_sent_at: string | null;
      target_replied_at: string | null;
      created_at: string;
      updated_at: string;
    };
  }

  private getUnreadCount(conversationId: number) {
    const row = this.db
      .prepare(
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
      )
      .get(this.currentUserId, conversationId, this.currentUserId) as { unread_count: number } | undefined;

    return Number(row?.unread_count ?? 0);
  }

  getConnections(): ConnectionSummary[] {
    const rows = this.db
      .prepare(
        `SELECT id, target_user_id, state, conversation_id, updated_at FROM connections
         WHERE user_id = ?
         ORDER BY datetime(updated_at) DESC, id DESC`,
      )
      .all(this.currentUserId) as Array<{
      id: number;
      target_user_id: number;
      state: ConnectionState;
      conversation_id: number | null;
      updated_at: string;
    }>;

    return rows
      .map(row => {
        const candidate = this.findCandidateById(row.target_user_id);
        if (!candidate) {
          return null;
        }

        const lastMessage = row.conversation_id
          ? (this.db
              .prepare(
                `SELECT sender_user_id, sender_role, message_type, content, created_at
                  FROM messages WHERE conversation_id = ?
                 ORDER BY datetime(created_at) DESC, id DESC
                 LIMIT 1`,
              )
                .get(row.conversation_id) as
                | {
                    sender_user_id: number | null;
                    sender_role: 'SELF' | 'TARGET';
                  message_type: MessageType;
                  content: string;
                  created_at: string;
                }
              | undefined)
          : undefined;

        return {
          id: row.id,
          targetUserId: candidate.id,
          targetName: candidate.name,
          targetAge: candidate.age,
          targetSchool: candidate.school,
          state: row.state,
          canSendFirstMessage: row.state === 'WAITING_FIRST_MESSAGE',
          canMutualChat: row.state === 'MUTUAL_CHAT',
          conversationId: row.conversation_id,
          lastMessageSnippet: lastMessage?.content ?? '连接已建立，等待你发出首条私信。',
          lastMessageAt: lastMessage?.created_at ?? row.updated_at,
          unreadCount: row.conversation_id == null ? 0 : this.getUnreadCount(row.conversation_id),
        } satisfies ConnectionSummary;
      })
      .filter((item): item is ConnectionSummary => Boolean(item));
  }

  getConnectionDetail(connectionId: number) {
    const row = this.db
      .prepare(
        `SELECT id, target_user_id, state, conversation_id FROM connections
         WHERE id = ? AND user_id = ?`,
      )
      .get(connectionId, this.currentUserId) as
      | {
          id: number;
          target_user_id: number;
          state: ConnectionState;
          conversation_id: number | null;
        }
      | undefined;

    if (!row) {
      return null;
    }

    const candidate = this.findCandidateById(row.target_user_id);
    if (!candidate) {
      return null;
    }

    return {
      connectionId: row.id,
      targetUserId: candidate.id,
      targetName: candidate.name,
      state: row.state,
      canSendFirstMessage: row.state === 'WAITING_FIRST_MESSAGE',
      canMutualChat: row.state === 'MUTUAL_CHAT',
      conversationId: row.conversation_id,
    };
  }

  sendFirstMessage(connectionId: number, content: string) {
    const detail = this.getConnectionDetail(connectionId);
    if (!detail || !detail.canSendFirstMessage || !detail.conversationId) {
      return null;
    }

    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO messages (conversation_id, sender_user_id, sender_role, message_type, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(detail.conversationId, this.currentUserId, 'SELF', 'TEXT', content, now);

    this.db
      .prepare(
        `UPDATE connections
         SET state = ?, first_message_sent_at = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`,
      )
      .run('WAITING_REPLY', now, now, connectionId, this.currentUserId);

    this.db
      .prepare(
        `UPDATE connections
         SET state = ?, updated_at = ?
         WHERE conversation_id = ? AND user_id = ? AND target_user_id = ?`,
      )
      .run('MUTUAL_CHAT', now, detail.conversationId, detail.targetUserId, this.currentUserId);

    return this.getConnectionDetail(connectionId);
  }

  getMessages(conversationId: number): ConversationMessage[] {
    const connection = this.db
      .prepare(
        `SELECT id FROM connections WHERE conversation_id = ? AND user_id = ?`,
      )
      .get(conversationId, this.currentUserId) as { id: number } | undefined;

    if (!connection) {
      return [];
    }

    return this.db
      .prepare(
        `SELECT id, conversation_id, sender_user_id, sender_role, message_type, content, created_at
         FROM messages
         WHERE conversation_id = ?
         ORDER BY datetime(created_at) ASC, id ASC`,
      )
      .all(conversationId)
      .map(
        row =>
          ({
            id: Number(row.id),
            conversationId: Number(row.conversation_id),
            senderRole:
              row.sender_user_id == null
                ? (String(row.sender_role) as 'SELF' | 'TARGET')
                : Number(row.sender_user_id) === this.currentUserId
                  ? 'SELF'
                  : 'TARGET',
            type: String(row.message_type) as MessageType,
            content: String(row.content),
            createdAt: String(row.created_at),
          }) satisfies ConversationMessage,
      );
  }

  markConversationRead(conversationId: number) {
    const connection = this.db
      .prepare(`SELECT id FROM connections WHERE conversation_id = ? AND user_id = ?`)
      .get(conversationId, this.currentUserId) as { id: number } | undefined;

    if (!connection) {
      return;
    }

    const row = this.db
      .prepare(
        `SELECT MAX(id) AS last_read_message_id
         FROM messages
         WHERE conversation_id = ?
           AND (
             (sender_user_id IS NOT NULL AND sender_user_id <> ?)
             OR (sender_user_id IS NULL AND sender_role = 'TARGET')
           )`,
      )
      .get(conversationId, this.currentUserId) as { last_read_message_id: number | null } | undefined;

    this.db
      .prepare(
        `INSERT INTO conversation_reads (user_id, conversation_id, last_read_message_id, last_read_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, conversation_id) DO UPDATE SET
           last_read_message_id = excluded.last_read_message_id,
           last_read_at = excluded.last_read_at`,
      )
      .run(this.currentUserId, conversationId, Number(row?.last_read_message_id ?? 0), new Date().toISOString());
  }

  sendConversationMessage(conversationId: number, type: MessageType, content: string) {
    const connection = this.db
      .prepare(
        `SELECT id, state, target_user_id FROM connections WHERE conversation_id = ? AND user_id = ?`,
      )
      .get(conversationId, this.currentUserId) as
      | {
          id: number;
          state: ConnectionState;
          target_user_id: number;
        }
      | undefined;

    if (!connection || (connection.state !== 'MUTUAL_CHAT' && connection.state !== 'WAITING_REPLY')) {
      return null;
    }

    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO messages (conversation_id, sender_user_id, sender_role, message_type, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(conversationId, this.currentUserId, 'SELF', type, content, now);

    this.db
      .prepare(`UPDATE connections SET state = ?, updated_at = ? WHERE id = ?`)
      .run('MUTUAL_CHAT', now, connection.id);

    this.db
      .prepare(
        `UPDATE connections
         SET state = ?, target_replied_at = COALESCE(target_replied_at, ?), updated_at = ?
         WHERE conversation_id = ? AND user_id = ? AND target_user_id = ?`,
      )
      .run('MUTUAL_CHAT', now, now, conversationId, connection.target_user_id, this.currentUserId);

    return this.getMessages(conversationId);
  }
}
