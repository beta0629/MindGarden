-- Flyway(MySQL 8) migration: onboarding approval procedures
-- NOTE: MySQL procedural SQL requires custom delimiter in SQL migrations.

DROP PROCEDURE IF EXISTS CreateOrActivateTenant;

DELIMITER $$

CREATE PROCEDURE CreateOrActivateTenant(
  IN p_tenant_id VARCHAR(64),
  IN p_tenant_name VARCHAR(255),
  IN p_business_type VARCHAR(50),
  IN p_approved_by VARCHAR(100),
  OUT p_success BOOLEAN,
  OUT p_message TEXT
)
BEGIN
  DECLARE v_exists BOOLEAN DEFAULT FALSE;
  DECLARE v_error_message VARCHAR(500);
  DECLARE v_subdomain VARCHAR(100) DEFAULT '';
  DECLARE v_domain VARCHAR(255) DEFAULT '';
  DECLARE v_settings_json JSON DEFAULT NULL;
  DECLARE v_counter INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    GET DIAGNOSTICS CONDITION 1 v_error_message = MESSAGE_TEXT;
    SET p_success = FALSE;
    SET p_message = CONCAT('테넌트 생성/활성화 중 오류 발생: ', v_error_message);
  END;

  START TRANSACTION;

  SELECT COUNT(*) > 0 INTO v_exists
  FROM tenants
  WHERE tenant_id = p_tenant_id;

  IF v_exists THEN
    SELECT settings_json INTO v_settings_json
    FROM tenants
    WHERE tenant_id = p_tenant_id;

    IF v_settings_json IS NULL OR JSON_EXTRACT(v_settings_json, '$.subdomain') IS NULL THEN
      SET v_subdomain = LOWER(p_tenant_name);
      SET v_subdomain = REPLACE(v_subdomain, ' ', '-');
      SET v_subdomain = REPLACE(v_subdomain, '가든', 'garden');
      SET v_subdomain = REPLACE(v_subdomain, '마인드', 'mind');
      SET v_subdomain = REPLACE(v_subdomain, '상담', 'consultation');
      SET v_subdomain = REPLACE(v_subdomain, '학원', 'academy');
      SET v_subdomain = REGEXP_REPLACE(v_subdomain, '[^a-z0-9\\-]', '');

      IF LENGTH(v_subdomain) > 63 THEN
        SET v_subdomain = LEFT(v_subdomain, 63);
      END IF;

      IF v_subdomain = '' OR v_subdomain IS NULL THEN
        SET v_subdomain = CONCAT('tenant-', SUBSTRING(p_tenant_id, 1, 8));
      END IF;

      SET v_counter = 0;
      activation_subdomain_loop: WHILE v_counter < 100 DO
        SELECT COUNT(*) > 0 INTO v_exists
        FROM tenants
        WHERE JSON_EXTRACT(COALESCE(settings_json, '{}'), '$.subdomain') = v_subdomain
          AND is_deleted = FALSE
          AND tenant_id != p_tenant_id;

        IF NOT v_exists THEN
          LEAVE activation_subdomain_loop;
        END IF;

        SET v_counter = v_counter + 1;
        SET v_subdomain = CONCAT(v_subdomain, '-', v_counter);
      END WHILE activation_subdomain_loop;

      SET v_domain = CONCAT(v_subdomain, '.dev.core-solution.co.kr');

      UPDATE tenants
      SET status = 'ACTIVE',
          settings_json = JSON_SET(
            COALESCE(settings_json, '{}'),
            '$.subdomain', v_subdomain,
            '$.domain', v_domain
          ),
          updated_at = NOW(),
          updated_by = p_approved_by
      WHERE tenant_id = p_tenant_id;

      SET p_success = TRUE;
      SET p_message = CONCAT('테넌트 활성화 완료 (서브도메인: ', v_subdomain, '): ', p_tenant_id);
    ELSE
      UPDATE tenants
      SET status = 'ACTIVE',
          updated_at = NOW(),
          updated_by = p_approved_by
      WHERE tenant_id = p_tenant_id;

      SET p_success = TRUE;
      SET p_message = CONCAT('테넌트 활성화 완료: ', p_tenant_id);
    END IF;
  ELSE
    SET v_subdomain = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
      p_tenant_name,
      ' ', '-'),
      '가든', 'garden'),
      '마인드', 'mind'),
      '상담', 'consultation'),
      '학원', 'academy'
    ));

    SET v_subdomain = REGEXP_REPLACE(v_subdomain, '[^a-z0-9-]', '');

    IF LENGTH(v_subdomain) > 63 THEN
      SET v_subdomain = LEFT(v_subdomain, 63);
    END IF;

    IF v_subdomain = '' OR v_subdomain IS NULL THEN
      SET v_subdomain = CONCAT('tenant-', SUBSTRING(p_tenant_id, 1, 8));
    END IF;

    SET v_counter = 0;
    create_subdomain_loop: WHILE v_counter < 100 DO
      SELECT COUNT(*) > 0 INTO v_exists
      FROM tenants
      WHERE JSON_EXTRACT(COALESCE(settings_json, '{}'), '$.subdomain') = v_subdomain
        AND is_deleted = FALSE
        AND tenant_id != p_tenant_id;

      IF NOT v_exists THEN
        LEAVE create_subdomain_loop;
      END IF;

      SET v_counter = v_counter + 1;
      SET v_subdomain = CONCAT(v_subdomain, '-', v_counter);
    END WHILE create_subdomain_loop;

    SET v_domain = CONCAT(v_subdomain, '.dev.core-solution.co.kr');
    SET v_settings_json = JSON_OBJECT(
      'subdomain', v_subdomain,
      'domain', v_domain
    );

    INSERT INTO tenants (
      tenant_id,
      name,
      business_type,
      status,
      subscription_status,
      settings_json,
      created_at,
      updated_at,
      created_by,
      updated_by,
      is_deleted,
      version,
      lang_code
    ) VALUES (
      p_tenant_id,
      p_tenant_name,
      p_business_type,
      'ACTIVE',
      'ACTIVE',
      v_settings_json,
      NOW(),
      NOW(),
      p_approved_by,
      p_approved_by,
      FALSE,
      0,
      'ko'
    );

    SET p_success = TRUE;
    SET p_message = CONCAT('테넌트 생성 완료 (서브도메인: ', v_subdomain, '): ', p_tenant_id);
  END IF;

  COMMIT;
END$$

DELIMITER ;
