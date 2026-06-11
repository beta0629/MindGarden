-- =============================================================================
-- Apple G1.2 UGC (P2-C) — community_reports.reason_code 5종 마이그레이션
--
-- 기존 8종 → 5종 매핑 (디자이너 시안 §B 정합, P2-C 코더 인용):
--   * ABUSIVE_LANGUAGE  → HARASSMENT
--   * VIOLENCE          → HARASSMENT
--   * MISINFORMATION    → OTHER
--   * COPYRIGHT         → OTHER
--   * SPAM/HARASSMENT/OBSCENE/OTHER — 변경 없음
--   * SELF_HARM (신규)  — 본 마이그레이션에서는 빈 카테고리, 이후 신고에서만 사용
--
-- 멱등성:
--   * UPDATE 는 매핑이 필요한 row 만 대상으로 함 (WHERE reason_code IN (...))
--   * 두 번째 실행 시 매칭되는 row 가 없어 NO-OP
--
-- 영향:
--   * 운영 DB 의 신고 큐 어드민 UI 가 자동으로 5종으로만 노출됨
--   * Java enum 의 레거시 4종은 @Deprecated 로 유지 (기존 직렬화 안전)
--
-- @author MindGarden
-- @since 2026-06-11
-- =============================================================================

UPDATE community_reports
   SET reason_code = 'HARASSMENT'
 WHERE reason_code IN ('ABUSIVE_LANGUAGE', 'VIOLENCE');

UPDATE community_reports
   SET reason_code = 'OTHER'
 WHERE reason_code IN ('MISINFORMATION', 'COPYRIGHT');
