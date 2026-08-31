-- =============================================================================
-- V20260831_002 — EXPENSE_*/INCOME_* SSOT: CopyDefaultTenantCodes whitelist
--                  + 미시드 테넌트 core→tenant 백필
--
-- • 장부(financial_transactions) 금액 리맵 금지
-- • 이미 동일 (tenant_id, code_group, code_value) 있으면 skip
-- • core(tenant_id IS NULL) 는 부트스트랩 원천; 운영 list 는 tenant-only
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A. CopyDefaultTenantCodes: EXPENSE_*/INCOME_* whitelist + core 폴백 복사
-- ---------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS CopyDefaultTenantCodes;

DELIMITER $$

CREATE PROCEDURE CopyDefaultTenantCodes(
    IN p_target_tenant_id VARCHAR(64),
    IN p_source_tenant_id VARCHAR(64),
    IN p_created_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_copied_count INT DEFAULT 0;
    DECLARE v_finance_copied INT DEFAULT 0;
    DECLARE v_tenant_code_groups TEXT DEFAULT '';
    DECLARE v_actor VARCHAR(100) DEFAULT 'SYSTEM_AUTO_COPY';

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('테넌트 코드 복사 중 오류 발생: ', v_error_message);
    END;

    SET v_actor = COALESCE(NULLIF(TRIM(p_created_by), ''), 'SYSTEM_AUTO_COPY');

    START TRANSACTION;

    SET v_tenant_code_groups = CONCAT(
        'CONSULTATION_PACKAGE,PACKAGE_TYPE,PAYMENT_METHOD,SPECIALTY,CONSULTATION_TYPE,',
        'MAPPING_STATUS,RESPONSIBILITY,CONSULTANT_GRADE,',
        'EXPENSE_CATEGORY,EXPENSE_SUBCATEGORY,INCOME_CATEGORY,INCOME_SUBCATEGORY'
    );

    INSERT INTO common_codes (
        code_group,
        code_value,
        korean_name,
        code_label,
        code_description,
        sort_order,
        is_active,
        color_code,
        icon,
        parent_code_group,
        parent_code_value,
        extra_data,
        tenant_id,
        created_at,
        updated_at,
        created_by,
        updated_by,
        is_deleted,
        version
    )
    SELECT
        cc.code_group,
        cc.code_value,
        cc.korean_name,
        cc.code_label,
        cc.code_description,
        cc.sort_order,
        cc.is_active,
        cc.color_code,
        cc.icon,
        cc.parent_code_group,
        cc.parent_code_value,
        cc.extra_data,
        p_target_tenant_id,
        NOW(),
        NOW(),
        v_actor,
        v_actor,
        FALSE,
        0
    FROM common_codes cc
    INNER JOIN code_group_metadata cgm ON cc.code_group = cgm.group_name
    WHERE cc.tenant_id = p_source_tenant_id
    AND cgm.code_type = 'TENANT'
    AND cc.is_deleted = FALSE
    AND cc.is_active = TRUE
    AND FIND_IN_SET(cc.code_group, v_tenant_code_groups) > 0
    AND NOT EXISTS (
        SELECT 1 FROM common_codes existing
        WHERE existing.tenant_id = p_target_tenant_id
          AND existing.code_group = cc.code_group
          AND existing.code_value = cc.code_value
          AND (existing.is_deleted = FALSE OR existing.is_deleted IS NULL)
    );

    SET v_copied_count = ROW_COUNT();

    IF v_copied_count = 0 THEN
        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
            created_by, updated_by, is_deleted, version
        ) VALUES
        ('CONSULTATION_PACKAGE', 'INDIVIDUAL', '개인상담', '개인상담', '1:1 개인 심리상담',
         JSON_OBJECT('price', 80000, 'sessions', 20, 'duration', 50, 'unit', '회'),
         1, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('CONSULTATION_PACKAGE', 'FAMILY', '가족상담', '가족상담', '가족 단위 상담',
         JSON_OBJECT('price', 120000, 'sessions', 20, 'duration', 60, 'unit', '회'),
         2, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('CONSULTATION_PACKAGE', 'GROUP', '그룹상담', '그룹상담', '그룹 심리상담',
         JSON_OBJECT('price', 50000, 'sessions', 20, 'duration', 90, 'unit', '회'),
         3, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('CONSULTATION_PACKAGE', 'SINGLE_75000', '단회기 75,000원', '단회기 75,000원', '1회기 상담 패키지',
         JSON_OBJECT('price', 75000, 'duration', 50, 'unit', '회', 'sessions', 1),
         4, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('CONSULTATION_PACKAGE', 'SINGLE_80000', '단회기 80,000원', '단회기 80,000원', '1회기 상담 패키지',
         JSON_OBJECT('price', 80000, 'duration', 50, 'unit', '회', 'sessions', 1),
         5, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('CONSULTATION_PACKAGE', 'SINGLE_85000', '단회기 85,000원', '단회기 85,000원', '1회기 상담 패키지',
         JSON_OBJECT('price', 85000, 'duration', 50, 'unit', '회', 'sessions', 1),
         6, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('CONSULTATION_PACKAGE', 'SINGLE_90000', '단회기 90,000원', '단회기 90,000원', '1회기 상담 패키지',
         JSON_OBJECT('price', 90000, 'duration', 50, 'unit', '회', 'sessions', 1),
         7, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('CONSULTATION_PACKAGE', 'SINGLE_95000', '단회기 95,000원', '단회기 95,000원', '1회기 상담 패키지',
         JSON_OBJECT('price', 95000, 'duration', 50, 'unit', '회', 'sessions', 1),
         8, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('CONSULTATION_PACKAGE', 'SINGLE_100000', '단회기 100,000원', '단회기 100,000원', '1회기 상담 패키지',
         JSON_OBJECT('price', 100000, 'duration', 50, 'unit', '회', 'sessions', 1),
         9, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('PACKAGE_TYPE', 'INDIVIDUAL', '개인 상담', '개인 상담', '1:1 개인 상담',
         NULL, 1, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('PACKAGE_TYPE', 'GROUP', '그룹 상담', '그룹 상담', '그룹 상담',
         NULL, 2, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('PAYMENT_METHOD', 'CASH', '현금', '현금', '현금 결제',
         NULL, 1, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('PAYMENT_METHOD', 'CARD', '카드', '카드', '카드 결제',
         NULL, 2, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('PAYMENT_METHOD', 'TRANSFER', '계좌이체', '계좌이체', '계좌이체 결제',
         NULL, 3, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('SPECIALTY', 'GENERAL', '일반 상담', '일반 상담', '일반적인 심리 상담',
         NULL, 1, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('SPECIALTY', 'FAMILY', '가족 상담', '가족 상담', '가족 관계 상담',
         NULL, 2, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('CONSULTATION_TYPE', 'INDIVIDUAL', '개인상담', '개인상담', '1:1 개인 심리상담',
         JSON_OBJECT('durationMinutes', 50), 1, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('CONSULTATION_TYPE', 'FAMILY', '가족상담', '가족상담', '가족 단위 상담',
         JSON_OBJECT('durationMinutes', 100), 2, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('CONSULTATION_TYPE', 'COUPLE', '부부상담', '부부상담', '부부 상담',
         JSON_OBJECT('durationMinutes', 80), 3, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('CONSULTATION_TYPE', 'INITIAL', '초기상담', '초기상담', '초기 상담',
         JSON_OBJECT('durationMinutes', 60), 4, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0),
        ('CONSULTATION_TYPE', 'GROUP', '집단상담', '집단상담', '집단·그룹 상담',
         JSON_OBJECT('durationMinutes', 90), 5, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0);

        SET v_copied_count = ROW_COUNT();
        SET p_message = CONCAT('기본 테넌트 코드 생성 완료: ', v_copied_count, '개 (단회기 패키지 포함)');
    ELSE
        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
            created_by, updated_by, is_deleted, version
        )
        SELECT
            'CONSULTATION_PACKAGE', 'SINGLE_75000', '단회기 75,000원', '단회기 75,000원', '1회기 상담 패키지',
            JSON_OBJECT('price', 75000, 'duration', 50, 'unit', '회', 'sessions', 1),
            4, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0
        WHERE NOT EXISTS (
            SELECT 1 FROM common_codes
            WHERE tenant_id = p_target_tenant_id
            AND code_group = 'CONSULTATION_PACKAGE'
            AND code_value = 'SINGLE_75000'
        );

        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
            created_by, updated_by, is_deleted, version
        )
        SELECT
            'CONSULTATION_PACKAGE', 'SINGLE_80000', '단회기 80,000원', '단회기 80,000원', '1회기 상담 패키지',
            JSON_OBJECT('price', 80000, 'duration', 50, 'unit', '회', 'sessions', 1),
            5, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0
        WHERE NOT EXISTS (
            SELECT 1 FROM common_codes
            WHERE tenant_id = p_target_tenant_id
            AND code_group = 'CONSULTATION_PACKAGE'
            AND code_value = 'SINGLE_80000'
        );

        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
            created_by, updated_by, is_deleted, version
        )
        SELECT
            'CONSULTATION_PACKAGE', 'SINGLE_85000', '단회기 85,000원', '단회기 85,000원', '1회기 상담 패키지',
            JSON_OBJECT('price', 85000, 'duration', 50, 'unit', '회', 'sessions', 1),
            6, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0
        WHERE NOT EXISTS (
            SELECT 1 FROM common_codes
            WHERE tenant_id = p_target_tenant_id
            AND code_group = 'CONSULTATION_PACKAGE'
            AND code_value = 'SINGLE_85000'
        );

        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
            created_by, updated_by, is_deleted, version
        )
        SELECT
            'CONSULTATION_PACKAGE', 'SINGLE_90000', '단회기 90,000원', '단회기 90,000원', '1회기 상담 패키지',
            JSON_OBJECT('price', 90000, 'duration', 50, 'unit', '회', 'sessions', 1),
            7, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0
        WHERE NOT EXISTS (
            SELECT 1 FROM common_codes
            WHERE tenant_id = p_target_tenant_id
            AND code_group = 'CONSULTATION_PACKAGE'
            AND code_value = 'SINGLE_90000'
        );

        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
            created_by, updated_by, is_deleted, version
        )
        SELECT
            'CONSULTATION_PACKAGE', 'SINGLE_95000', '단회기 95,000원', '단회기 95,000원', '1회기 상담 패키지',
            JSON_OBJECT('price', 95000, 'duration', 50, 'unit', '회', 'sessions', 1),
            8, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0
        WHERE NOT EXISTS (
            SELECT 1 FROM common_codes
            WHERE tenant_id = p_target_tenant_id
            AND code_group = 'CONSULTATION_PACKAGE'
            AND code_value = 'SINGLE_95000'
        );

        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
            created_by, updated_by, is_deleted, version
        )
        SELECT
            'CONSULTATION_PACKAGE', 'SINGLE_100000', '단회기 100,000원', '단회기 100,000원', '1회기 상담 패키지',
            JSON_OBJECT('price', 100000, 'duration', 50, 'unit', '회', 'sessions', 1),
            9, TRUE, p_target_tenant_id, NOW(), NOW(), v_actor, v_actor, FALSE, 0
        WHERE NOT EXISTS (
            SELECT 1 FROM common_codes
            WHERE tenant_id = p_target_tenant_id
            AND code_group = 'CONSULTATION_PACKAGE'
            AND code_value = 'SINGLE_100000'
        );

        SET p_message = CONCAT('테넌트 코드 복사 완료: ', v_copied_count, '개 (단회기 패키지 확인 및 추가 완료)');
    END IF;

    -- 소스에 없어도 core(tenant_id IS NULL) EXPENSE_*/INCOME_* 를 타깃에 백필
    INSERT INTO common_codes (
        code_group, code_value, korean_name, code_label, code_description,
        sort_order, is_active, color_code, icon,
        parent_code_group, parent_code_value, extra_data,
        tenant_id, created_at, updated_at, created_by, updated_by, is_deleted, version
    )
    SELECT
        core.code_group,
        core.code_value,
        core.korean_name,
        core.code_label,
        core.code_description,
        core.sort_order,
        core.is_active,
        core.color_code,
        core.icon,
        core.parent_code_group,
        core.parent_code_value,
        core.extra_data,
        p_target_tenant_id,
        NOW(),
        NOW(),
        v_actor,
        v_actor,
        FALSE,
        0
    FROM common_codes core
    WHERE core.tenant_id IS NULL
      AND core.is_deleted = FALSE
      AND core.is_active = TRUE
      AND core.code_group IN (
          'EXPENSE_CATEGORY', 'EXPENSE_SUBCATEGORY',
          'INCOME_CATEGORY', 'INCOME_SUBCATEGORY'
      )
      AND NOT EXISTS (
          SELECT 1 FROM common_codes existing
          WHERE existing.tenant_id = p_target_tenant_id
            AND existing.code_group = core.code_group
            AND existing.code_value = core.code_value
            AND (existing.is_deleted = FALSE OR existing.is_deleted IS NULL)
      );

    SET v_finance_copied = ROW_COUNT();
    SET p_message = CONCAT(
        COALESCE(p_message, '테넌트 코드 복사'),
        ' / finance SSOT 백필 ', v_finance_copied, '건'
    );

    SET p_success = TRUE;
    COMMIT;
END$$

DELIMITER ;

-- ---------------------------------------------------------------------------
-- B. 기존 테넌트 EXPENSE_*/INCOME_* 미시드 백필 (core → tenant, 중복 skip)
--    장부 금액·category 문자열 리맵 없음
-- ---------------------------------------------------------------------------
INSERT INTO common_codes (
    tenant_id,
    code_group,
    code_value,
    korean_name,
    code_label,
    code_description,
    sort_order,
    is_active,
    color_code,
    icon,
    parent_code_group,
    parent_code_value,
    extra_data,
    created_at,
    updated_at,
    created_by,
    updated_by,
    is_deleted,
    version
)
SELECT
    t.tenant_id,
    core.code_group,
    core.code_value,
    core.korean_name,
    core.code_label,
    core.code_description,
    core.sort_order,
    core.is_active,
    core.color_code,
    core.icon,
    core.parent_code_group,
    core.parent_code_value,
    core.extra_data,
    NOW(),
    NOW(),
    'SYSTEM_EXPENSE_SSOT_BACKFILL',
    'SYSTEM_EXPENSE_SSOT_BACKFILL',
    FALSE,
    0
FROM (
    SELECT DISTINCT tenant_id
    FROM common_codes
    WHERE tenant_id IS NOT NULL
      AND TRIM(tenant_id) <> ''
) t
CROSS JOIN common_codes core
WHERE core.tenant_id IS NULL
  AND core.is_deleted = FALSE
  AND core.is_active = TRUE
  AND core.code_group IN (
      'EXPENSE_CATEGORY', 'EXPENSE_SUBCATEGORY',
      'INCOME_CATEGORY', 'INCOME_SUBCATEGORY'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM common_codes existing
      WHERE existing.tenant_id = t.tenant_id
        AND existing.code_group = core.code_group
        AND existing.code_value = core.code_value
        AND (existing.is_deleted = FALSE OR existing.is_deleted IS NULL)
  );
