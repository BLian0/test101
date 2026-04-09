# 校园搭子 API 设计 v0.1

## 1. 设计原则

- 采用 REST API
- 路径按业务模块拆分
- 首版以 `v1` 命名空间隔离
- 登录后接口默认使用 Bearer Token
- 上传接口独立处理

基础前缀：

- `/api/v1`

## 2. 认证与注册

### 2.1 发送手机验证码

- `POST /api/v1/auth/phone/send-code`

请求体：

```json
{
  "phone": "13800000000",
  "scene": "REGISTER"
}
```

### 2.2 发送校园邮箱验证码

- `POST /api/v1/auth/email/send-code`

请求体：

```json
{
  "email": "example@mail.dlut.edu.cn",
  "scene": "REGISTER"
}
```

### 2.3 注册

- `POST /api/v1/auth/register`

请求体：

```json
{
  "email": "example@mail.dlut.edu.cn",
  "emailCode": "123456",
  "phone": "13800000000",
  "phoneCode": "123456",
  "password": "hashed-or-plain-before-server-policy"
}
```

说明：

- 注册前必须完成邮箱后缀校验
- 注册成功后返回 access token 和用户基础状态

### 2.4 邮箱登录

- `POST /api/v1/auth/login/email`

### 2.5 手机号登录

- `POST /api/v1/auth/login/phone`

### 2.6 获取当前登录用户

- `GET /api/v1/auth/me`

返回内容建议包括：

- 用户 id
- 注册完成状态
- 基础资料完成状态
- 问卷完成状态
- 是否可进入推荐页

## 3. 学校与邮箱规则

### 3.1 获取当前支持学校信息

- `GET /api/v1/public/schools/current`

### 3.2 获取当前学校可用邮箱后缀

- `GET /api/v1/public/schools/current/email-rules`

## 4. 用户基础资料

### 4.1 获取我的基础资料

- `GET /api/v1/profile/me`

### 4.2 更新我的基础资料

- `PUT /api/v1/profile/me`

请求体：

```json
{
  "nickname": "小李",
  "avatarUrl": "https://...",
  "age": 22,
  "gender": "MALE",
  "sexualOrientation": "FEMALE",
  "bio": "可选"
}
```

### 4.3 上传头像

- `POST /api/v1/uploads/avatar`

## 5. 问卷与匹配画像

### 5.1 获取当前激活问卷版本

- `GET /api/v1/questionnaires/active`

### 5.2 获取问卷题目

- `GET /api/v1/questionnaires/active/questions`

### 5.3 保存问卷草稿

- `POST /api/v1/questionnaires/sessions/draft`

### 5.4 提交问卷

- `POST /api/v1/questionnaires/sessions/submit`

请求体：

```json
{
  "questionnaireVersionId": 1,
  "answers": [
    {
      "questionId": 101,
      "answerValue": "A"
    },
    {
      "questionId": 102,
      "answerValue": 4
    }
  ]
}
```

### 5.5 获取我的标签结果和维度分

- `GET /api/v1/questionnaires/me/result`

返回内容建议包括：

- 标签列表
- trait 分数
- 问卷版本
- 最近提交时间

### 5.6 保存理想对象偏好

- `PUT /api/v1/preferences/me`

请求体：

```json
{
  "preferredGenders": ["FEMALE"],
  "minAge": 20,
  "maxAge": 26,
  "traitPreferences": {
    "relationship_commitment": "HIGH",
    "consumption_openness": "MEDIUM"
  },
  "tagPreferences": {
    "love_style": ["stable", "serious"],
    "values": ["long_term"]
  }
}
```

### 5.7 获取我的理想对象偏好

- `GET /api/v1/preferences/me`

## 6. 推荐刷人

### 6.1 获取推荐列表

- `GET /api/v1/recommendations`

查询参数建议：

- `cursor`
- `limit`

返回内容建议包括：

- 用户基础资料
- 标签摘要
- 匹配分
- 匹配原因摘要

### 6.2 喜欢某人

- `POST /api/v1/recommendations/{targetUserId}/like`

### 6.3 跳过某人

- `POST /api/v1/recommendations/{targetUserId}/pass`

### 6.4 获取与某人的匹配解释

- `GET /api/v1/recommendations/{targetUserId}/insight`

## 7. 建立连接与聊天

### 7.1 获取连接列表

- `GET /api/v1/connections`

### 7.2 获取某个连接详情

- `GET /api/v1/connections/{connectionId}`

返回内容建议包括：

- 当前连接状态
- 是否允许发首条私信
- 是否已开放双向聊天
- 是否允许交换联系方式

### 7.3 发送首条私信

- `POST /api/v1/connections/{connectionId}/first-message`

约束：

- 每个连接仅允许一次
- 需要敏感词检测
- 首条私信阶段禁止发送联系方式

### 7.4 获取会话消息列表

- `GET /api/v1/conversations/{conversationId}/messages`

### 7.5 发送文本消息

- `POST /api/v1/conversations/{conversationId}/messages/text`

### 7.6 发送图片消息

- `POST /api/v1/conversations/{conversationId}/messages/image`

### 7.7 发送语音消息

- `POST /api/v1/conversations/{conversationId}/messages/voice`

### 7.8 上传聊天图片

- `POST /api/v1/uploads/chat-image`

### 7.9 上传聊天语音

- `POST /api/v1/uploads/chat-voice`

## 8. 拉黑与举报

### 8.1 拉黑用户

- `POST /api/v1/blocks`

请求体：

```json
{
  "targetUserId": 1002,
  "reason": "骚扰"
}
```

### 8.2 获取黑名单

- `GET /api/v1/blocks`

### 8.3 取消拉黑

- `DELETE /api/v1/blocks/{blockedUserId}`

### 8.4 举报用户

- `POST /api/v1/reports`

请求体：

```json
{
  "targetUserId": 1002,
  "conversationId": 3001,
  "messageId": 5001,
  "reportType": "HARASSMENT",
  "description": "持续骚扰"
}
```

### 8.5 获取我的举报记录

- `GET /api/v1/reports/me`

## 9. 邀约占位

### 9.1 获取邀约页配置

- `GET /api/v1/placeholder/invitations`

返回内容建议包括：

- 是否上线
- 占位文案

## 10. 后台接口

### 10.1 管理员登录

- `POST /api/v1/admin/auth/login`

### 10.2 用户列表

- `GET /api/v1/admin/users`

### 10.3 用户详情

- `GET /api/v1/admin/users/{userId}`

### 10.4 封禁用户

- `POST /api/v1/admin/users/{userId}/ban`

### 10.5 举报列表

- `GET /api/v1/admin/reports`

### 10.6 举报详情

- `GET /api/v1/admin/reports/{reportId}`

### 10.7 处理举报

- `POST /api/v1/admin/reports/{reportId}/resolve`

### 10.8 学校邮箱规则列表

- `GET /api/v1/admin/schools/{schoolId}/email-rules`

### 10.9 新增邮箱规则

- `POST /api/v1/admin/schools/{schoolId}/email-rules`

### 10.10 更新邮箱规则

- `PUT /api/v1/admin/email-rules/{ruleId}`

### 10.11 问卷版本列表

- `GET /api/v1/admin/questionnaires`

### 10.12 新建问卷版本

- `POST /api/v1/admin/questionnaires`

## 11. 错误码建议

建议统一错误码风格：

- `AUTH_*`
- `PROFILE_*`
- `QUESTIONNAIRE_*`
- `MATCH_*`
- `CHAT_*`
- `REPORT_*`
- `ADMIN_*`

示例：

- `AUTH_EMAIL_SUFFIX_INVALID`
- `AUTH_PHONE_CODE_INVALID`
- `QUESTIONNAIRE_NOT_COMPLETED`
- `CHAT_FIRST_MESSAGE_ALREADY_SENT`
- `CHAT_CONTACT_INFO_BLOCKED`
- `MATCH_NOT_ALLOWED`

## 12. 下一步

在本 API 设计基础上，下一步输出：

- 后端模块拆分
- 技术路线
- 页面流程图
