-- =============================================================================
-- Shop·Reward P1 — 온보딩 default_components_json + ActivateDefaultComponents 정합
-- default_components_json 은 component_code 배열 (V9 SSOT)
-- ActivateDefaultComponents 는 component_catalog.component_code 로 component_id 조회
-- =============================================================================

UPDATE business_category_items
SET
    default_components_json = JSON_ARRAY_APPEND(
        COALESCE(default_components_json, JSON_ARRAY()),
        '$',
        'CLIENT_SHOP'
    ),
    updated_by = 'flyway-backfill',
    updated_at = CURRENT_TIMESTAMP
WHERE (is_deleted = 0 OR is_deleted IS NULL OR is_deleted = FALSE)
  AND (business_type IN ('CONSULTATION', 'COUNSELING') OR item_code = 'COUNSELING')
  AND NOT JSON_CONTAINS(COALESCE(default_components_json, JSON_ARRAY()), '"CLIENT_SHOP"', '$');

UPDATE business_category_items
SET
    default_components_json = JSON_ARRAY_APPEND(
        COALESCE(default_components_json, JSON_ARRAY()),
        '$',
        'CLIENT_REWARD'
    ),
    updated_by = 'flyway-backfill',
    updated_at = CURRENT_TIMESTAMP
WHERE (is_deleted = 0 OR is_deleted IS NULL OR is_deleted = FALSE)
  AND (business_type IN ('CONSULTATION', 'COUNSELING') OR item_code = 'COUNSELING')
  AND NOT JSON_CONTAINS(COALESCE(default_components_json, JSON_ARRAY()), '"CLIENT_REWARD"', '$');

UPDATE business_category_items
SET
    default_components_json = JSON_ARRAY_APPEND(
        COALESCE(default_components_json, JSON_ARRAY()),
        '$',
        'ADMIN_SHOP_CATALOG'
    ),
    updated_by = 'flyway-backfill',
    updated_at = CURRENT_TIMESTAMP
WHERE (is_deleted = 0 OR is_deleted IS NULL OR is_deleted = FALSE)
  AND (business_type IN ('CONSULTATION', 'COUNSELING') OR item_code = 'COUNSELING')
  AND NOT JSON_CONTAINS(COALESCE(default_components_json, JSON_ARRAY()), '"ADMIN_SHOP_CATALOG"', '$');

DROP PROCEDURE IF EXISTS ActivateDefaultComponents;

DELIMITER $$

CREATE PROCEDURE ActivateDefaultComponents(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_activated_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_default_components JSON;
    DECLARE v_component_code VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_component_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_i INT DEFAULT 0;
    DECLARE v_len INT DEFAULT 0;
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('기본 컴포넌트 활성화 오류: ', v_error_message);
    END;

    SELECT default_components_json
    INTO v_default_components
    FROM business_category_items
    WHERE business_type COLLATE utf8mb4_unicode_ci = p_business_type COLLATE utf8mb4_unicode_ci
      AND is_active = TRUE
      AND (is_deleted = 0 OR is_deleted IS NULL OR is_deleted = FALSE)
    ORDER BY display_order ASC
    LIMIT 1;

    IF v_default_components IS NULL THEN
        SET p_success = TRUE;
        SET p_message = '기본 컴포넌트 설정 없음';
    ELSE
        SET v_len = JSON_LENGTH(v_default_components);

        activation_loop: WHILE v_i < v_len DO
            SET v_component_code = JSON_UNQUOTE(JSON_EXTRACT(v_default_components, CONCAT('$[', v_i, ']')));

            SET v_component_id = NULL;

            SELECT cc.component_id
            INTO v_component_id
            FROM component_catalog cc
            WHERE cc.component_code COLLATE utf8mb4_unicode_ci = v_component_code COLLATE utf8mb4_unicode_ci
              AND (cc.is_deleted = 0 OR cc.is_deleted IS NULL OR cc.is_deleted = FALSE)
              AND cc.is_active = TRUE
            LIMIT 1;

            IF v_component_id IS NOT NULL THEN
                INSERT INTO tenant_components (
                    tenant_component_id,
                    tenant_id,
                    component_id,
                    status,
                    activated_at,
                    activated_by,
                    is_deleted,
                    created_by,
                    updated_by
                )
                SELECT
                    UUID(),
                    p_tenant_id,
                    v_component_id,
                    'ACTIVE',
                    CURRENT_TIMESTAMP,
                    p_activated_by,
                    FALSE,
                    p_activated_by,
                    p_activated_by
                FROM DUAL
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM tenant_components tc
                    WHERE tc.tenant_id = p_tenant_id
                      AND tc.component_id = v_component_id
                      AND (tc.is_deleted = 0 OR tc.is_deleted IS NULL OR tc.is_deleted = FALSE)
                );
            END IF;

            SET v_i = v_i + 1;
        END WHILE activation_loop;

        SET p_success = TRUE;
        SET p_message = '기본 컴포넌트가 활성화되었습니다.';
    END IF;
END$$

DELIMITER ;
