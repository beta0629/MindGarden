-- =============================================================================
-- V20260831_004 — 동일 tenant+group+표시명(korean_name / code_label) 중복 공통코드 통합
--
-- 범위 (중요):
--   • 동일 표시명 그룹 중 시드 SSOT code_value 가 최소 1개 포함된 그룹만 merge
--     (예: MEAL vs EAT — 시드 MEAL 생존, 커스텀 EAT 패자)
--   • 커스텀만 있는 그룹(예: internst / internet) 은 INSERT·merge 대상에서 제외
--   • 커스텀 중복은 tenant DELETE SSOT(목록=삭제) + create 표시명 유니크로 처리
--   • 특정 오타 문자열 wipe 하드코딩 금지
--
-- 생존자 선정 (Java CommonCodeDisplayNameSurvivorSelector 와 동일 정신, 시드 포함 그룹):
--   1) 시드 SSOT code_value 우선 (EXPENSE_/INCOME_ 시드 집합)
--   2) financial_transactions category|subcategory 매칭 건수 많은 쪽
--   3) recurring_expenses category|subcategory|expenseType 매칭 건수 많은 쪽
--   4) 더 이른 created_at, 그다음 더 작은 id
--
-- 동작 (loser → survivor, 시드 포함 그룹만):
--   • recurring_expenses / financial_transactions: category 문자열만 survivor 로 정규화
--   • common_codes 자식 parent_code_value: loser → survivor (같은 tenant)
--   • loser 행 soft-delete (is_deleted=1, deleted_at=NOW(), is_active=0)
--
-- 금지:
--   • 금액(amount) / polarity 변경
--   • 특정 오타 문자열(internst 등)만 하드코딩 wipe
--   • 커스텀 전용 중복 그룹 자동 merge (오타가 FT/recurring 건수로 생존자가 되는 위험)
--   • 커스텀 단일 행 삭제(중복이 아닐 때)
--   • display-only alias 맵
--
-- MySQL: self-ref UPDATE 는 파생 테이블 패턴 (V20260831_003 참고)
-- =============================================================================

DROP TABLE IF EXISTS _tmp_cc_display_name_merge_20260831;

CREATE TABLE _tmp_cc_display_name_merge_20260831 (
    tenant_id VARCHAR(64) NOT NULL,
    code_group VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    loser_id BIGINT NOT NULL,
    loser_code_value VARCHAR(100) NOT NULL,
    survivor_id BIGINT NOT NULL,
    survivor_code_value VARCHAR(100) NOT NULL,
    PRIMARY KEY (loser_id),
    KEY idx_tmp_cc_merge_tenant_loser (tenant_id, loser_code_value),
    KEY idx_tmp_cc_merge_survivor (tenant_id, survivor_code_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- A. 시드 SSOT 포함 중복 표시명 그룹만 생존자·패자 매핑 적재
--    (커스텀-only 그룹은 HAVING MIN(seed_rank)=0 미충족 → INSERT 제외)
-- ---------------------------------------------------------------------------
INSERT INTO _tmp_cc_display_name_merge_20260831 (
    tenant_id, code_group, display_name,
    loser_id, loser_code_value, survivor_id, survivor_code_value
)
WITH base AS (
    SELECT
        cc.id,
        cc.tenant_id,
        cc.code_group,
        cc.code_value,
        TRIM(
            CASE
                WHEN cc.korean_name IS NOT NULL AND TRIM(cc.korean_name) <> ''
                    THEN cc.korean_name
                ELSE COALESCE(cc.code_label, '')
            END
        ) AS display_name,
        CASE
            WHEN cc.code_group = 'EXPENSE_CATEGORY' AND cc.code_value IN (
                'SALARY', 'RENT', 'UTILITY', 'OFFICE_SUPPLIES', 'TAX', 'MEAL',
                'MARKETING', 'EQUIPMENT', 'SOFTWARE', 'CONSULTING', 'OTHER'
            ) THEN 0
            WHEN cc.code_group = 'INCOME_CATEGORY' AND cc.code_value IN (
                '상담료', 'PACKAGE', 'OTHER'
            ) THEN 0
            WHEN cc.code_group = 'EXPENSE_SUBCATEGORY' AND cc.code_value IN (
                'CONSULTANT_SALARY', 'ADMIN_SALARY', 'OFFICE_RENT', 'MAINTENANCE_FEE',
                'ELECTRICITY', 'WATER', 'STATIONERY', 'PRINTING', 'INCOME_TAX', 'VAT',
                'CORPORATE_TAX', 'ONLINE_ADS', 'OFFLINE_ADS', 'COMPUTER', 'FURNITURE',
                'LICENSE', 'EXTERNAL_CONSULTING', 'CONSULTATION_REFUND', 'OTHER_EXPENSE'
            ) THEN 0
            WHEN cc.code_group = 'INCOME_SUBCATEGORY' AND cc.code_value IN (
                'INDIVIDUAL_CONSULTATION', 'GROUP_CONSULTATION', 'ADDITIONAL_CONSULTATION',
                'BASIC_PACKAGE', 'PREMIUM_PACKAGE', 'OTHER_INCOME'
            ) THEN 0
            ELSE 1
        END AS seed_rank,
        (
            SELECT COUNT(*)
            FROM financial_transactions ft
            WHERE ft.tenant_id = cc.tenant_id
              AND (ft.is_deleted IS NULL OR ft.is_deleted = FALSE)
              AND (ft.category = cc.code_value OR ft.subcategory = cc.code_value)
        ) AS ft_count,
        (
            SELECT COUNT(*)
            FROM recurring_expenses re
            WHERE re.tenant_id = cc.tenant_id
              AND (re.is_deleted IS NULL OR re.is_deleted = FALSE)
              AND (
                  re.category = cc.code_value
                  OR re.subcategory = cc.code_value
                  OR re.expense_type = cc.code_value
              )
        ) AS re_count,
        cc.created_at
    FROM common_codes cc
    WHERE cc.tenant_id IS NOT NULL
      AND cc.tenant_id <> ''
      AND (cc.is_deleted IS NULL OR cc.is_deleted = FALSE)
      AND cc.code_group IN (
          'EXPENSE_CATEGORY', 'EXPENSE_SUBCATEGORY',
          'INCOME_CATEGORY', 'INCOME_SUBCATEGORY'
      )
),
named AS (
    SELECT *
    FROM base
    WHERE display_name <> ''
),
dup_keys AS (
    -- 시드 SSOT code_value 가 그룹에 1개 이상 있을 때만 merge (MIN(seed_rank)=0)
    SELECT tenant_id, code_group, display_name
    FROM named
    GROUP BY tenant_id, code_group, display_name
    HAVING COUNT(*) >= 2
       AND MIN(seed_rank) = 0
),
ranked AS (
    SELECT
        n.*,
        ROW_NUMBER() OVER (
            PARTITION BY n.tenant_id, n.code_group, n.display_name
            ORDER BY
                n.seed_rank ASC,
                n.ft_count DESC,
                n.re_count DESC,
                n.created_at ASC,
                n.id ASC
        ) AS rn
    FROM named n
    INNER JOIN dup_keys d
      ON d.tenant_id = n.tenant_id
     AND d.code_group = n.code_group
     AND d.display_name = n.display_name
),
survivors AS (
    SELECT
        tenant_id,
        code_group,
        display_name,
        id AS survivor_id,
        code_value AS survivor_code_value
    FROM ranked
    WHERE rn = 1
)
SELECT
    l.tenant_id,
    l.code_group,
    l.display_name,
    l.id AS loser_id,
    l.code_value AS loser_code_value,
    s.survivor_id,
    s.survivor_code_value
FROM ranked l
INNER JOIN survivors s
  ON s.tenant_id = l.tenant_id
 AND s.code_group = l.code_group
 AND s.display_name = l.display_name
WHERE l.rn > 1
  AND l.code_value <> s.survivor_code_value;

-- ---------------------------------------------------------------------------
-- B. recurring_expenses: category / subcategory / expenseType → survivor
--    (금액 미변경; soft-delete 하지 않음 — 저장 코드만 정규화)
-- ---------------------------------------------------------------------------
UPDATE recurring_expenses re
INNER JOIN _tmp_cc_display_name_merge_20260831 m
  ON m.tenant_id = re.tenant_id
 AND m.loser_code_value = re.category
SET re.category = m.survivor_code_value,
    re.updated_at = NOW()
WHERE (re.is_deleted IS NULL OR re.is_deleted = FALSE);

UPDATE recurring_expenses re
INNER JOIN _tmp_cc_display_name_merge_20260831 m
  ON m.tenant_id = re.tenant_id
 AND m.loser_code_value = re.subcategory
SET re.subcategory = m.survivor_code_value,
    re.updated_at = NOW()
WHERE (re.is_deleted IS NULL OR re.is_deleted = FALSE);

UPDATE recurring_expenses re
INNER JOIN _tmp_cc_display_name_merge_20260831 m
  ON m.tenant_id = re.tenant_id
 AND m.loser_code_value = re.expense_type
SET re.expense_type = m.survivor_code_value,
    re.updated_at = NOW()
WHERE (re.is_deleted IS NULL OR re.is_deleted = FALSE);

-- ---------------------------------------------------------------------------
-- C. financial_transactions: category / subcategory → survivor (amount 미변경)
-- ---------------------------------------------------------------------------
UPDATE financial_transactions ft
INNER JOIN _tmp_cc_display_name_merge_20260831 m
  ON m.tenant_id = ft.tenant_id
 AND m.loser_code_value = ft.category
SET ft.category = m.survivor_code_value,
    ft.updated_at = NOW()
WHERE (ft.is_deleted IS NULL OR ft.is_deleted = FALSE);

UPDATE financial_transactions ft
INNER JOIN _tmp_cc_display_name_merge_20260831 m
  ON m.tenant_id = ft.tenant_id
 AND m.loser_code_value = ft.subcategory
SET ft.subcategory = m.survivor_code_value,
    ft.updated_at = NOW()
WHERE (ft.is_deleted IS NULL OR ft.is_deleted = FALSE);

-- ---------------------------------------------------------------------------
-- D. common_codes 자식: parent_code_value loser → survivor (파생 테이블)
-- ---------------------------------------------------------------------------
UPDATE common_codes cc
INNER JOIN (
    SELECT tenant_id, loser_code_value, survivor_code_value
    FROM _tmp_cc_display_name_merge_20260831
) m
  ON m.tenant_id = cc.tenant_id
 AND m.loser_code_value = cc.parent_code_value
SET cc.parent_code_value = m.survivor_code_value,
    cc.updated_at = NOW()
WHERE (cc.is_deleted IS NULL OR cc.is_deleted = FALSE)
  AND cc.parent_code_value IS NOT NULL
  AND cc.parent_code_value <> '';

-- ---------------------------------------------------------------------------
-- E. loser 행 soft-delete (시드 포함 중복 패자만 — 커스텀 wipe 금지)
-- ---------------------------------------------------------------------------
UPDATE common_codes cc
INNER JOIN (
    SELECT loser_id
    FROM _tmp_cc_display_name_merge_20260831
) m
  ON m.loser_id = cc.id
SET cc.is_deleted = TRUE,
    cc.deleted_at = NOW(),
    cc.is_active = FALSE,
    cc.updated_at = NOW()
WHERE (cc.is_deleted IS NULL OR cc.is_deleted = FALSE);

DROP TABLE IF EXISTS _tmp_cc_display_name_merge_20260831;
