-- 비밀번호 변경 여부 필드 추가
-- 임시 비밀번호로 생성된 계정은 false, 비밀번호 변경 후 true
ALTER TABLE users 
ADD COLUMN is_password_changed BOOLEAN NOT NULL DEFAULT TRUE COMMENT '비밀번호 변경 여부 (임시 비밀번호인 경우 false, 비밀번호 변경 후 true)';

-- 기존 사용자는 이미 비밀번호 변경 완료로 간주 (기본값 TRUE)
-- 새로 등록되는 사용자는 등록 시 false로 설정됨

