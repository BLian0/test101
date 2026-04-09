# 校园搭子数据库设计 v0.1

## 1. 设计目标

第一版数据库设计需要覆盖以下核心能力：

- 校园邮箱 + 手机号双验证注册
- 同校用户限制
- 基础资料存储
- 恋爱匹配问卷
- 标签和维度分结果
- 理想对象偏好
- 推荐刷人行为
- 建立连接
- 首条私信与双向聊天
- 图片/语音消息
- 拉黑与举报
- 后台管理

数据库默认采用 `MySQL 8.x`。

## 2. 核心设计原则

### 基础资料和匹配画像分离

- `基础资料` 用于展示和最小筛选
- `匹配画像` 用于算法和标签展示
- 两类数据不混在同一张大表中

### 问卷结果分层存储

问卷数据分三层：

1. 原始答案
2. 标签结果
3. 维度分数

这样后面才能支持：

- 重新计算标签
- 调整算法权重
- 新问卷版本复算匹配分

### 聊天状态分阶段

聊天不能直接等同于普通会话，要体现业务阶段：

1. 已建立连接，但仅允许 1 条首条私信
2. 对方已回复，开放双向聊天
3. 被拉黑/关闭

## 3. 表设计总览

第一版建议包含以下表：

- `schools`
- `school_email_rules`
- `users`
- `user_auth_accounts`
- `user_phone_verifications`
- `user_email_verifications`
- `user_profiles`
- `questionnaire_versions`
- `questionnaire_sections`
- `questionnaire_questions`
- `questionnaire_options`
- `user_questionnaire_sessions`
- `user_questionnaire_answers`
- `user_match_traits`
- `user_match_tags`
- `user_partner_preferences`
- `user_recommendation_actions`
- `user_connections`
- `conversations`
- `messages`
- `message_attachments`
- `user_blocks`
- `reports`
- `report_evidences`
- `admin_users`
- `admin_action_logs`

## 4. 详细表设计

### 4.1 学校与邮箱规则

#### `schools`

用途：

- 学校主数据
- 为后续多学校扩展做准备

关键字段：

- `id`
- `name`
- `code`
- `status`
- `created_at`
- `updated_at`

说明：

- 第一版只插入大连理工大学一条记录

#### `school_email_rules`

用途：

- 配置学校允许的邮箱后缀

关键字段：

- `id`
- `school_id`
- `email_suffix`
- `user_type`
- `is_active`
- `created_at`
- `updated_at`

建议说明：

- 第一版默认配置：
  - `mail.dlut.edu.cn`
  - `dlut.edu.cn`

---

### 4.2 用户与认证

#### `users`

用途：

- 用户主体表

关键字段：

- `id`
- `school_id`
- `status`
- `register_source`
- `phone_verified_at`
- `email_verified_at`
- `last_login_at`
- `created_at`
- `updated_at`

建议枚举：

- `status`: `ACTIVE`, `BLOCKED`, `BANNED`, `PENDING`

#### `user_auth_accounts`

用途：

- 存登录账号
- 支持一个用户绑定多个认证方式

关键字段：

- `id`
- `user_id`
- `account_type`
- `account_value`
- `password_hash`
- `is_primary`
- `verified_at`
- `created_at`
- `updated_at`

建议枚举：

- `account_type`: `EMAIL`, `PHONE`

说明：

- 校园邮箱和手机号都放在这张表
- `account_value` 需要唯一索引

#### `user_phone_verifications`

用途：

- 手机验证码记录

关键字段：

- `id`
- `phone`
- `scene`
- `code_hash`
- `expired_at`
- `verified_at`
- `created_at`

建议枚举：

- `scene`: `REGISTER`, `LOGIN`, `BIND_PHONE`, `RESET_PASSWORD`

#### `user_email_verifications`

用途：

- 校园邮箱验证码记录

关键字段：

- `id`
- `email`
- `school_id`
- `scene`
- `code_hash`
- `expired_at`
- `verified_at`
- `created_at`

建议枚举：

- `scene`: `REGISTER`, `LOGIN`, `BIND_EMAIL`

---

### 4.3 基础资料

#### `user_profiles`

用途：

- 存基础资料

关键字段：

- `id`
- `user_id`
- `nickname`
- `avatar_url`
- `age`
- `gender`
- `sexual_orientation`
- `bio`
- `profile_completion_score`
- `created_at`
- `updated_at`

说明：

- 这张表只放展示型资料
- 不放问卷匹配维度

---

### 4.4 问卷与匹配画像

#### `questionnaire_versions`

用途：

- 问卷版本管理

关键字段：

- `id`
- `name`
- `version_code`
- `status`
- `description`
- `created_at`
- `updated_at`

建议枚举：

- `status`: `DRAFT`, `ACTIVE`, `ARCHIVED`

#### `questionnaire_sections`

用途：

- 问卷分组

建议分组：

- MBTI 风格题组
- 人格倾向题组
- 恋爱观题组
- 性态度题组
- 价值观题组
- 关系边界题组

关键字段：

- `id`
- `questionnaire_version_id`
- `title`
- `section_code`
- `sort_order`
- `created_at`

#### `questionnaire_questions`

用途：

- 问卷题目

关键字段：

- `id`
- `questionnaire_version_id`
- `section_id`
- `question_code`
- `title`
- `description`
- `question_type`
- `is_required`
- `sort_order`
- `created_at`
- `updated_at`

建议枚举：

- `question_type`: `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `SCALE`, `BOOLEAN`, `TEXT`

#### `questionnaire_options`

用途：

- 题目选项

关键字段：

- `id`
- `question_id`
- `option_code`
- `label`
- `score_payload`
- `sort_order`
- `created_at`

说明：

- `score_payload` 建议存 JSON
- 可直接映射到多个 trait 分值

#### `user_questionnaire_sessions`

用途：

- 用户某次完成问卷的记录

关键字段：

- `id`
- `user_id`
- `questionnaire_version_id`
- `status`
- `submitted_at`
- `scored_at`
- `created_at`
- `updated_at`

建议枚举：

- `status`: `DRAFT`, `SUBMITTED`, `SCORED`

#### `user_questionnaire_answers`

用途：

- 用户每道题的答案

关键字段：

- `id`
- `session_id`
- `question_id`
- `answer_value`
- `created_at`

说明：

- `answer_value` 建议 JSON 存储

#### `user_match_traits`

用途：

- 用户的结构化维度分数

关键字段：

- `id`
- `user_id`
- `session_id`
- `trait_code`
- `trait_value`
- `version_code`
- `created_at`
- `updated_at`

示例 `trait_code`：

- `introversion_extroversion`
- `rationality_emotionality`
- `relationship_commitment`
- `physical_intimacy_acceptance`
- `consumption_openness`
- `boundary_closeness`

#### `user_match_tags`

用途：

- 用户展示型标签

关键字段：

- `id`
- `user_id`
- `session_id`
- `tag_code`
- `tag_label`
- `tag_group`
- `confidence_score`
- `created_at`

示例 `tag_group`：

- `mbti`
- `personality`
- `love_style`
- `sex_attitude`
- `values`

#### `user_partner_preferences`

用途：

- 用户对理想对象的偏好

关键字段：

- `id`
- `user_id`
- `preferred_genders`
- `min_age`
- `max_age`
- `trait_preferences`
- `tag_preferences`
- `created_at`
- `updated_at`

说明：

- `trait_preferences` 建议 JSON
- `tag_preferences` 建议 JSON

---

### 4.5 推荐与建立连接

#### `user_recommendation_actions`

用途：

- 记录刷人行为

关键字段：

- `id`
- `actor_user_id`
- `target_user_id`
- `action_type`
- `match_score_snapshot`
- `created_at`

建议枚举：

- `action_type`: `LIKE`, `PASS`, `SUPER_LIKE`, `REPORT_ENTRY`

#### `user_connections`

用途：

- 记录两人之间是否建立连接

关键字段：

- `id`
- `user_a_id`
- `user_b_id`
- `status`
- `initiator_user_id`
- `first_message_sender_id`
- `first_message_sent_at`
- `mutual_chat_opened_at`
- `created_at`
- `updated_at`

建议枚举：

- `status`: `PENDING_FIRST_MESSAGE`, `WAITING_REPLY`, `MUTUAL_OPEN`, `BLOCKED`, `CLOSED`

说明：

- 这张表是聊天权限判断核心
- 不是简单的 match 表

---

### 4.6 会话与消息

#### `conversations`

用途：

- 会话主表

关键字段：

- `id`
- `connection_id`
- `status`
- `last_message_id`
- `last_message_at`
- `created_at`
- `updated_at`

建议枚举：

- `status`: `ACTIVE`, `BLOCKED`, `CLOSED`

#### `messages`

用途：

- 存聊天消息

关键字段：

- `id`
- `conversation_id`
- `sender_user_id`
- `message_type`
- `text_content`
- `is_first_unlock_message`
- `status`
- `sent_at`
- `created_at`

建议枚举：

- `message_type`: `TEXT`, `IMAGE`, `VOICE`, `EMOJI`
- `status`: `SENT`, `RECALLED`, `BLOCKED`

说明：

- 首条私信用 `is_first_unlock_message` 标记

#### `message_attachments`

用途：

- 图片、语音等附件

关键字段：

- `id`
- `message_id`
- `file_type`
- `file_url`
- `file_size`
- `duration_ms`
- `width`
- `height`
- `created_at`

建议枚举：

- `file_type`: `IMAGE`, `VOICE`

---

### 4.7 风控

#### `user_blocks`

用途：

- 拉黑关系

关键字段：

- `id`
- `blocker_user_id`
- `blocked_user_id`
- `reason`
- `created_at`

约束：

- 唯一索引：`blocker_user_id + blocked_user_id`

#### `reports`

用途：

- 举报记录

关键字段：

- `id`
- `reporter_user_id`
- `target_user_id`
- `conversation_id`
- `message_id`
- `report_type`
- `description`
- `status`
- `processed_by_admin_id`
- `processed_at`
- `created_at`
- `updated_at`

建议枚举：

- `report_type`: `HARASSMENT`, `FAKE_IDENTITY`, `SEXUAL_CONTENT`, `SPAM`, `ABUSE`
- `status`: `PENDING`, `REVIEWING`, `RESOLVED`, `REJECTED`

#### `report_evidences`

用途：

- 举报补充证据

关键字段：

- `id`
- `report_id`
- `evidence_type`
- `file_url`
- `created_at`

---

### 4.8 后台管理

#### `admin_users`

用途：

- 后台管理员账号

关键字段：

- `id`
- `username`
- `password_hash`
- `role`
- `status`
- `last_login_at`
- `created_at`
- `updated_at`

#### `admin_action_logs`

用途：

- 管理员操作日志

关键字段：

- `id`
- `admin_user_id`
- `action_type`
- `target_type`
- `target_id`
- `payload`
- `created_at`

## 5. 关键索引建议

### 唯一索引

- `user_auth_accounts(account_type, account_value)`
- `school_email_rules(school_id, email_suffix)`
- `user_blocks(blocker_user_id, blocked_user_id)`

### 查询索引

- `users(school_id, status)`
- `user_profiles(user_id)`
- `user_match_traits(user_id, trait_code)`
- `user_match_tags(user_id, tag_group)`
- `user_recommendation_actions(actor_user_id, created_at)`
- `user_connections(user_a_id, user_b_id)`
- `messages(conversation_id, created_at)`
- `reports(status, created_at)`

## 6. 关键约束和业务规则

### 注册

- 创建用户前必须完成手机号和邮箱双验证码验证
- 邮箱后缀必须命中学校允许规则

### 建立连接与聊天

- 连接建立后，只允许发 1 条首条私信
- 首条私信发送后，连接状态变为 `WAITING_REPLY`
- 对方回复后，连接状态变为 `MUTUAL_OPEN`
- `WAITING_REPLY` 阶段禁止继续发第二条消息

### 联系方式限制

- 首条私信阶段应触发联系方式敏感词校验
- 若命中规则，可拒绝写入消息或标记阻断

### 拉黑

- 任一方拉黑后：
  - 推荐流不可再见
  - 会话不可继续发送消息
  - 对方资料不可见

## 7. 后续可扩展点

- 多学校支持
- 问卷版本升级
- 标签规则引擎
- 匹配分缓存表
- 推荐结果快照表
- 聊天内容审核表
- 自定义表情包表

## 8. 下一步

在本数据库设计基础上，下一步输出：

- API 设计 v0.1
- 后端模块拆分
- 页面流程图
