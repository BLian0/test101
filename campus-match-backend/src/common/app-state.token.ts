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

export const APP_STATE = Symbol('APP_STATE');

type Awaitable<T> = T | Promise<T>;

export interface AppState {
  getStorageInfo(): Awaitable<{
    driver: string;
    sqlitePath: string | null;
  }>;
  getSchool(): Awaitable<{
    id: number;
    name: string;
    code: string;
    emailRules: string[];
  }>;
  getCurrentUser(): Awaitable<AppUser>;
  isNicknameAvailable(nickname: string): Awaitable<boolean>;
  findUserByEmail(email: string): Awaitable<{ id: number; username: string; email: string; phone: string; password: string } | undefined>;
  findUserByUsername(username: string): Awaitable<{ id: number; username: string; email: string; phone: string; password: string } | undefined>;
  findUserByPhone(phone: string): Awaitable<{ id: number; username: string; email: string; phone: string; password: string } | undefined>;
  updateUserPassword(email: string, password: string): Awaitable<boolean>;
  issueEmailVerificationCode(payload: {
    email: string;
    scene: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD';
    code: string;
    expiresAt: string;
  }): Awaitable<void>;
  getEmailVerificationRateLimit(payload: {
    email: string;
    scene: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD';
  }): Awaitable<{
    lastSentAt: string | null;
    countLastHour: number;
  }>;
  issuePhoneVerificationCode(payload: {
    phone: string;
    scene: 'REGISTER' | 'LOGIN';
    code: string;
    expiresAt: string;
  }): Awaitable<void>;
  verifyEmailVerificationCode(payload: {
    email: string;
    scene: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD';
    code: string;
  }): Awaitable<boolean>;
  verifyPhoneVerificationCode(payload: {
    phone: string;
    scene: 'REGISTER' | 'LOGIN';
    code: string;
  }): Awaitable<boolean>;
  consumeEmailVerificationCode(payload: {
    email: string;
    scene: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD';
    code: string;
  }): Awaitable<void>;
  consumePhoneVerificationCode(payload: {
    phone: string;
    scene: 'REGISTER' | 'LOGIN';
    code: string;
  }): Awaitable<void>;
  registerUser(payload: { username: string; email: string; phone?: string; password: string }): Awaitable<AppUser>;
  saveProfile(profile: AppUser['profile']): Awaitable<AppUser['profile']>;
  saveQuestionnaire(questionnaire: AppUser['questionnaire']): Awaitable<AppUser['questionnaire']>;
  savePreferences(preferences: AppUser['preferences']): Awaitable<AppUser['preferences']>;
  getCandidates(): Awaitable<CandidateProfile[]>;
  getAdminUsers(): Awaitable<AdminUserSummary[]>;
  getAdminReports(): Awaitable<AdminReportSummary[]>;
  resolveAdminReport(reportId: number, resolutionNote: string | null): Awaitable<AdminReportSummary | undefined>;
  getAdminEmailRules(schoolId: number): Awaitable<Array<{ id: number; emailSuffix: string; isActive: number }>>;
  getAdminOperationLogs(): Awaitable<AdminOperationLog[]>;
  appendAdminOperationLog(actionType: string, targetType: string, targetId: number, detail: string): Awaitable<void>;
  createAdminEmailRule(
    schoolId: number,
    emailSuffix: string,
  ): Awaitable<Array<{ id: number; emailSuffix: string; isActive: number }>>;
  updateAdminEmailRule(
    ruleId: number,
    isActive: boolean,
  ): Awaitable<{ id: number; emailSuffix: string; isActive: number } | undefined>;
  setAdminUserBanStatus(
    userId: number,
    isBanned: boolean,
    reason: string | null,
  ): Awaitable<AdminUserSummary | undefined>;
  findCandidateById(targetUserId: number): Awaitable<CandidateProfile | undefined>;
  createUserReport(targetUserId: number, category: string, description: string): Awaitable<UserReportItem>;
  getMyReports(): Awaitable<UserReportItem[]>;
  createBlock(blockedUserId: number): Awaitable<UserBlockItem[]>;
  getBlocks(): Awaitable<UserBlockItem[]>;
  removeBlock(blockedUserId: number): Awaitable<UserBlockItem[]>;
  saveRecommendationAction(targetUserId: number, action: 'LIKE' | 'PASS'): Awaitable<void>;
  getRecommendationAction(targetUserId: number): Awaitable<{ action: 'LIKE' | 'PASS' } | undefined>;
  createOrActivateConnection(targetUserId: number): Awaitable<{
    id: number;
    state: string;
  }>;
  getConnections(): Awaitable<ConnectionSummary[]>;
  getConnectionDetail(connectionId: number): Awaitable<
    | {
        connectionId: number;
        targetUserId: number;
        targetName: string;
        state: string;
        canSendFirstMessage: boolean;
        canMutualChat: boolean;
        conversationId: number | null;
      }
    | null
  >;
  sendFirstMessage(connectionId: number, content: string): Awaitable<
    | {
        connectionId: number;
        targetUserId: number;
        targetName: string;
        state: string;
        canSendFirstMessage: boolean;
        canMutualChat: boolean;
        conversationId: number | null;
      }
    | null
  >;
  getMessages(conversationId: number): Awaitable<ConversationMessage[]>;
  markConversationRead(conversationId: number): Awaitable<void>;
  sendConversationMessage(
    conversationId: number,
    type: 'TEXT' | 'IMAGE' | 'VOICE',
    content: string,
  ): Awaitable<ConversationMessage[] | null>;
}
