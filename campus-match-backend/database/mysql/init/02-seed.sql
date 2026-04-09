USE campus_match;

INSERT INTO schools (id, name, code)
VALUES (1, 'Dalian University of Technology', 'DLUT')
ON DUPLICATE KEY UPDATE name = VALUES(name), code = VALUES(code);

INSERT INTO school_email_rules (school_id, email_suffix, is_active)
VALUES
  (1, 'mail.dlut.edu.cn', 1),
  (1, 'dlut.edu.cn', 1)
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

INSERT INTO users (id, school_id, username, email, phone, password, registered_at)
VALUES (1, 1, 'demo', 'demo@mail.dlut.edu.cn', '13800000000', 'abc123', '2026-04-02 19:30:00.000')
ON DUPLICATE KEY UPDATE
  email = VALUES(email),
  phone = VALUES(phone),
  password = VALUES(password),
  registered_at = VALUES(registered_at);

INSERT INTO user_bans (user_id, reason, banned_at)
VALUES (1, 'Dev seed ban reason: repeated risk-control trigger.', '2026-04-02 21:40:00.000')
ON DUPLICATE KEY UPDATE
  reason = VALUES(reason),
  banned_at = VALUES(banned_at);

INSERT INTO reports (id, reporter_user_id, target_user_id, category, description, status, created_at)
VALUES (
  1,
  1,
  1003,
  'HARASSMENT',
  'The other side repeatedly crossed my stated boundaries during probing chat. I want an admin review first.',
  'PENDING',
  '2026-04-02 21:20:00.000'
)
ON DUPLICATE KEY UPDATE
  category = VALUES(category),
  description = VALUES(description),
  status = VALUES(status),
  created_at = VALUES(created_at);

INSERT INTO admin_operation_logs (id, action_type, target_type, target_id, detail, created_at)
VALUES (1, 'BAN_USER', 'USER', 1, 'Initial seed operation: banned user 1.', '2026-04-02 21:40:00.000')
ON DUPLICATE KEY UPDATE
  detail = VALUES(detail),
  created_at = VALUES(created_at);
