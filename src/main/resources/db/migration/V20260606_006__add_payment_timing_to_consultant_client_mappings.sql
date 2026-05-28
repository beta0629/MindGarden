-- OPTION_B_RESERVATION_FIRST_PLAN — 사이드바 카드 SAME_DAY_CARD 분기 + 드래그 허용
--
-- 본 마이그레이션은 consultant_client_mappings 테이블에 payment_timing 컬럼을 추가한다.
-- 옵션 B (사후 카드 결제, 당일 방문)와 기본 흐름(선납 입금)을 구분하기 위해 매핑 생성 시점의
-- 결제 방식 의도를 보존한다.
--
-- 컬럼 사양:
--   - 타입 VARCHAR(32) — Enum 값 ADVANCE / SAME_DAY_CARD 보관용
--   - NULL 허용 — 레거시 매핑(컬럼 추가 전에 생성)은 NULL 로 남으며, 코드 측에서 ADVANCE 와 동일하게 취급
--   - 디폴트 NULL — 신규 매핑 생성 시 컨트롤러/서비스 단에서 명시적 값을 세팅
--
-- 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md
--
-- @author CoreSolution
-- @since 2026-05-28

ALTER TABLE consultant_client_mappings
    ADD COLUMN payment_timing VARCHAR(32) NULL
        COMMENT '옵션 B 결제 방식 의도: ADVANCE(선납 입금) / SAME_DAY_CARD(당일 카드 결제). NULL=레거시(ADVANCE 동등)';
