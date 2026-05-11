CREATE DATABASE IF NOT EXISTS pinch
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE pinch;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id VARCHAR(32) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(40) NOT NULL,
  phone_encrypted VARBINARY(512) NULL,
  phone_hash CHAR(64) NULL,
  avatar VARCHAR(8) NULL,
  bio VARCHAR(300) NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  status ENUM('active', 'banned', 'deleted') NOT NULL DEFAULT 'active',
  marketing_agreed_at DATETIME(3) NULL,
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_public_id (public_id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_phone_hash (phone_hash),
  KEY idx_users_role_status (role, status),
  KEY idx_users_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE user_agreements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  terms_version VARCHAR(32) NOT NULL,
  privacy_version VARCHAR(32) NOT NULL,
  marketing_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  agreed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_user_agreements_user (user_id),
  CONSTRAINT fk_user_agreements_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE phone_verifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  phone_hash CHAR(64) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  purpose ENUM('signup', 'password_reset', 'phone_change') NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 5,
  expires_at DATETIME(3) NOT NULL,
  verified_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_phone_verifications_phone_purpose (phone_hash, purpose, created_at),
  KEY idx_phone_verifications_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE categories (
  id VARCHAR(32) NOT NULL,
  label VARCHAR(40) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_label (label),
  KEY idx_categories_active_sort (is_active, sort_order)
) ENGINE=InnoDB;

CREATE TABLE topics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id VARCHAR(32) NOT NULL,
  category_id VARCHAR(32) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  news_url VARCHAR(1000) NULL,
  news_source VARCHAR(80) NULL,
  kst_day DATE NOT NULL,
  heat_score INT NOT NULL DEFAULT 0,
  status ENUM('draft', 'active', 'closed', 'deleted') NOT NULL DEFAULT 'active',
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_topics_public_id (public_id),
  KEY idx_topics_day_category_status (kst_day, category_id, status),
  KEY idx_topics_category_status_heat (category_id, status, heat_score),
  CONSTRAINT fk_topics_category
    FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_topics_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE active_topic_global (
  singleton_id TINYINT UNSIGNED NOT NULL,
  topic_id BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (singleton_id),
  CONSTRAINT ck_active_topic_global_singleton CHECK (singleton_id = 1),
  CONSTRAINT fk_active_topic_global_topic
    FOREIGN KEY (topic_id) REFERENCES topics(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_active_topic_global_user
    FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE active_topic_by_category (
  category_id VARCHAR(32) NOT NULL,
  topic_id BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (category_id),
  CONSTRAINT fk_active_topic_by_category_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_active_topic_by_category_topic
    FOREIGN KEY (topic_id) REFERENCES topics(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_active_topic_by_category_user
    FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE topic_revisions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  topic_id BIGINT UNSIGNED NOT NULL,
  mode ENUM('minor', 'replace') NOT NULL,
  reason VARCHAR(300) NULL,
  before_json JSON NOT NULL,
  after_json JSON NOT NULL,
  affected_pinches INT UNSIGNED NOT NULL DEFAULT 0,
  affected_likes INT UNSIGNED NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_topic_revisions_topic (topic_id, created_at),
  CONSTRAINT fk_topic_revisions_topic
    FOREIGN KEY (topic_id) REFERENCES topics(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_topic_revisions_user
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE pinches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id VARCHAR(32) NOT NULL,
  topic_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  kst_day DATE NOT NULL,
  original_topic_title VARCHAR(160) NOT NULL,
  text TEXT NOT NULL,
  status ENUM('active', 'archived_invalid', 'hidden_by_admin', 'deleted_by_user') NOT NULL DEFAULT 'active',
  active_day_key DATE GENERATED ALWAYS AS (
    CASE WHEN status = 'active' THEN kst_day ELSE NULL END
  ) STORED,
  invalidated_at DATETIME(3) NULL,
  invalidated_reason VARCHAR(300) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pinches_public_id (public_id),
  UNIQUE KEY uq_pinches_user_active_day (user_id, active_day_key),
  KEY idx_pinches_topic_status_created (topic_id, status, created_at),
  KEY idx_pinches_user_created (user_id, created_at),
  KEY idx_pinches_day_status (kst_day, status),
  FULLTEXT KEY ft_pinches_text (text),
  CONSTRAINT fk_pinches_topic
    FOREIGN KEY (topic_id) REFERENCES topics(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_pinches_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE pinch_likes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pinch_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pinch_likes_once (pinch_id, user_id),
  KEY idx_pinch_likes_user (user_id),
  CONSTRAINT fk_pinch_likes_pinch
    FOREIGN KEY (pinch_id) REFERENCES pinches(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_pinch_likes_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE pinch_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pinch_id BIGINT UNSIGNED NOT NULL,
  reporter_id BIGINT UNSIGNED NOT NULL,
  reason ENUM('spam', 'abuse', 'privacy', 'illegal', 'other') NOT NULL,
  detail VARCHAR(500) NULL,
  status ENUM('pending', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
  resolved_by BIGINT UNSIGNED NULL,
  resolved_at DATETIME(3) NULL,
  admin_note VARCHAR(500) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pinch_reports_once (pinch_id, reporter_id),
  KEY idx_pinch_reports_status_created (status, created_at),
  CONSTRAINT fk_pinch_reports_pinch
    FOREIGN KEY (pinch_id) REFERENCES pinches(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_pinch_reports_reporter
    FOREIGN KEY (reporter_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_pinch_reports_resolver
    FOREIGN KEY (resolved_by) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE daily_winners (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  kst_day DATE NOT NULL,
  category_id VARCHAR(32) NOT NULL,
  topic_id BIGINT UNSIGNED NOT NULL,
  pinch_id BIGINT UNSIGNED NOT NULL,
  like_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_daily_winners_day_category (kst_day, category_id),
  KEY idx_daily_winners_pinch (pinch_id),
  CONSTRAINT fk_daily_winners_category
    FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_daily_winners_topic
    FOREIGN KEY (topic_id) REFERENCES topics(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_daily_winners_pinch
    FOREIGN KEY (pinch_id) REFERENCES pinches(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE bans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  duration ENUM('week', 'month', 'permanent') NOT NULL,
  reason VARCHAR(300) NOT NULL,
  starts_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ends_at DATETIME(3) NULL,
  created_by BIGINT UNSIGNED NULL,
  lifted_by BIGINT UNSIGNED NULL,
  lifted_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_bans_user_active (user_id, lifted_at, ends_at),
  CONSTRAINT fk_bans_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_bans_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_bans_lifted_by
    FOREIGN KEY (lifted_by) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE banned_phones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  phone_hash CHAR(64) NOT NULL,
  reason VARCHAR(300) NOT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_banned_phones_hash (phone_hash),
  CONSTRAINT fk_banned_phones_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('topic_replaced', 'pinch_won', 'report_resolved', 'system') NOT NULL,
  title VARCHAR(120) NOT NULL,
  body VARCHAR(500) NOT NULL,
  data JSON NULL,
  read_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_notifications_user_read_created (user_id, read_at, created_at),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE admin_audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_user_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(40) NOT NULL,
  target_id VARCHAR(64) NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  ip_address VARBINARY(16) NULL,
  user_agent VARCHAR(500) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_admin_audit_logs_admin_created (admin_user_id, created_at),
  KEY idx_admin_audit_logs_target (target_type, target_id),
  CONSTRAINT fk_admin_audit_logs_admin
    FOREIGN KEY (admin_user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE news_cache (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cache_key VARCHAR(160) NOT NULL,
  payload JSON NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_news_cache_key (cache_key),
  KEY idx_news_cache_expires (expires_at)
) ENGINE=InnoDB;
