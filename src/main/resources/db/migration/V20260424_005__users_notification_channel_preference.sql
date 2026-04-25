-- Phase1 알림 수신 채널 선호 (내담자·상담사). users.tenant_id 유지.
-- 레거시 notification_preferences(JSON/문자열)와 병행: 발송 우선순위는 NotificationServiceImpl 주석 참고.
ALTER TABLE users
    ADD COLUMN notification_channel_preference VARCHAR(32) NOT NULL DEFAULT 'TENANT_DEFAULT';
