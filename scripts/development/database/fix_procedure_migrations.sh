#!/bin/bash
# 프로시저 마이그레이션 파일을 Flyway 호환 형식으로 변환하는 스크립트
# DELIMITER를 제거하고 프로시저 본문을 동적으로 생성하여 실행하는 방식으로 변경

set -e

MIGRATION_DIR="src/main/resources/db/migration"
PROCEDURE_FILES=(
    "V20251222_001__create_create_or_activate_tenant_procedure.sql"
    "V42__create_create_or_activate_tenant_procedure.sql"
    "V13__create_onboarding_approval_procedures.sql"
    "V15__create_process_onboarding_approval_procedure.sql"
    "V40__add_tenant_settings_json_features.sql"
    "V41__create_missing_onboarding_procedures.sql"
    "V55__integrate_tenant_code_copy_to_onboarding.sql"
    "V57__update_tenant_creation_with_default_users.sql"
    "V59__fix_onboarding_approval_procedure_uuid.sql"
    "V60__add_composite_indexes_for_performance.sql"
    "V61__integrate_admin_account_creation_to_tenant_procedure.sql"
    "V62__fix_user_id_generation_in_tenant_procedure.sql"
    "V64__update_copy_default_tenant_codes_add_single_session_packages.sql"
    "V14__create_erd_generation_procedure.sql"
    "V4__add_tenant_id_to_main_tables_fixed.sql"
    "V20251202_014__fix_apply_default_role_templates_collation.sql"
    "V20251202_015__fix_apply_default_role_templates_collation_v2.sql"
    "V20251202_016__fix_all_onboarding_procedures_collation.sql"
    "V20251202_017__fix_all_onboarding_procedures_collation_v2.sql"
    "V20251202_018__simplify_onboarding_approval_procedure.sql"
    "V20251203_006__add_permission_groups_to_role_templates.sql"
    "V20251212_001__fix_apply_default_role_templates_procedure.sql"
    "V20251212_003__add_subdomain_to_onboarding_approval_procedures.sql"
    "V20251222_002__fix_already_active_tenant_handling.sql"
    "V20251223_001__fix_create_tenant_admin_account_user_id.sql"
    "V20251225_001__enhance_onboarding_procedures_error_handling.sql"
    "V20251225_003__fix_process_onboarding_approval_null_definition.sql"
    "V20251225_004__force_recreate_process_onboarding_approval.sql"
)

echo "🔍 프로시저 마이그레이션 파일 변환 시작..."
echo "총 ${#PROCEDURE_FILES[@]}개 파일 처리 예정"

for file in "${PROCEDURE_FILES[@]}"; do
    filepath="${MIGRATION_DIR}/${file}"
    if [ ! -f "$filepath" ]; then
        echo "⚠️  파일을 찾을 수 없습니다: $filepath"
        continue
    fi
    
    if ! grep -q "DELIMITER" "$filepath"; then
        echo "ℹ️  DELIMITER가 없는 파일 (건너뜀): $file"
        continue
    fi
    
    echo "📝 처리 중: $file"
    # 백업 생성
    cp "$filepath" "${filepath}.backup"
    
    # 여기서는 파일 목록만 출력 (실제 변환은 Python 스크립트로 처리)
    echo "  → 백업 생성 완료: ${filepath}.backup"
done

echo "✅ 파일 목록 확인 완료"
echo "📋 실제 변환은 Python 스크립트로 진행합니다"

