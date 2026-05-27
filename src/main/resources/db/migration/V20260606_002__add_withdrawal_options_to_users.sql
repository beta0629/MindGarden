-- USER_LIFECYCLE_TERMINATION_POLICY v1.1 §0.1 Q12-b — 자발 탈퇴 시 본인 옵션 보관.
--
-- 본 마이그레이션은 users 테이블에 withdrawal_options_json 컬럼을 추가한다.
-- 자발 탈퇴 신청 (`POST /api/v1/mypage/withdrawal/request`) 시점에 본인이 선택한 옵션을
-- JSON 으로 직렬화하여 보관하고, WithdrawalGracePeriodScheduler 가 30일 유예 만료 후
-- ANONYMIZED 전이 시점에 UserAnonymizationService 로 옵션을 전달하여 community body 등
-- 사용자-선택 PII 처리 분기에 활용한다.
--
-- 컬럼 사양:
--   - 타입 TEXT — 향후 옵션 확장 (예: deleteMoodJournal 등) 대비. 현재는 단일 boolean 만 사용.
--   - NULL 허용 — 기본값 (모든 옵션 미선택) 은 NULL 로 표현. WithdrawalOptions.defaults() 와 정합.
--   - 디폴트 NULL — WITHDRAWAL_PENDING 진입 외 상태에서는 항상 NULL.
--
-- @author CoreSolution
-- @since 2026-06-06

ALTER TABLE users
    ADD COLUMN withdrawal_options_json TEXT NULL
        COMMENT '자발 탈퇴 본인 옵션 JSON (Q12-b 등). WITHDRAWAL_PENDING 진입 시 직렬화, ANONYMIZED 전이 시 사용';
