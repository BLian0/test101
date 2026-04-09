CREATE DATABASE IF NOT EXISTS campus_match CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campus_match;

CREATE TABLE IF NOT EXISTS schools (
  id BIGINT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  code VARCHAR(32) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS school_email_rules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  school_id BIGINT NOT NULL,
  email_suffix VARCHAR(128) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uk_school_suffix (school_id, email_suffix)
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  uid VARCHAR(16) NOT NULL UNIQUE,
  school_id BIGINT NOT NULL,
  username VARCHAR(24) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(32) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  registered_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  scene VARCHAR(16) NOT NULL,
  code VARCHAR(16) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS phone_verification_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(32) NOT NULL,
  scene VARCHAR(16) NOT NULL,
  code VARCHAR(16) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT PRIMARY KEY,
  nickname VARCHAR(64) NOT NULL,
  avatar_url TEXT NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(32) NOT NULL,
  sexual_orientation VARCHAR(32) NOT NULL,
  bio TEXT NULL,
  nickname_change_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_user_profiles_nickname (nickname)
);

CREATE TABLE IF NOT EXISTS questionnaire_submissions (
  user_id BIGINT PRIMARY KEY,
  answers_json JSON NOT NULL,
  tags_json JSON NOT NULL,
  traits_json JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id BIGINT PRIMARY KEY,
  preferred_genders_json JSON NOT NULL,
  age_min INT NOT NULL,
  age_max INT NOT NULL,
  relationship_goal VARCHAR(32) NOT NULL,
  intimacy_preference VARCHAR(32) NOT NULL,
  value_priority VARCHAR(32) NOT NULL,
  emotional_style VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS recommendation_actions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  target_user_id BIGINT NOT NULL,
  action VARCHAR(16) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_recommendation_action (user_id, target_user_id)
);

CREATE TABLE IF NOT EXISTS connections (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  target_user_id BIGINT NOT NULL,
  state VARCHAR(32) NOT NULL,
  conversation_id BIGINT NULL,
  first_message_sent_at DATETIME(3) NULL,
  target_replied_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_connection (user_id, target_user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT NOT NULL,
  sender_user_id BIGINT NULL,
  sender_role VARCHAR(16) NOT NULL,
  message_type VARCHAR(16) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reporter_user_id BIGINT NOT NULL,
  target_user_id BIGINT NOT NULL,
  category VARCHAR(32) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_blocks (
  user_id BIGINT NOT NULL,
  blocked_user_id BIGINT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (user_id, blocked_user_id)
);

CREATE TABLE IF NOT EXISTS user_bans (
  user_id BIGINT PRIMARY KEY,
  reason TEXT NULL,
  banned_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS report_resolutions (
  report_id BIGINT PRIMARY KEY,
  resolution_note TEXT NULL,
  resolved_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_operation_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  action_type VARCHAR(64) NOT NULL,
  target_type VARCHAR(32) NOT NULL,
  target_id BIGINT NOT NULL,
  detail TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL
);
