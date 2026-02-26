-- 프로필 이미지 base64 저장 시 데이터 제약 위반 방지: TEXT(64KB) → LONGTEXT(4GB)
-- 리사이즈·크롭 후에도 2MB 제한 base64는 약 2.7M자로 TEXT로는 저장 불가
ALTER TABLE users MODIFY COLUMN profile_image_url LONGTEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL;
