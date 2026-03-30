#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
문법 오류 일괄 수정 스크립트
- JavaDoc 주석 형식 오류 수정 (/** 누락)
- 레거시 역할 사용 제거 (HQ_MASTER 등 → 표준 역할로 변경)
- 기타 문법 오류 수정
"""

import os
import re
import sys
from pathlib import Path

# 인코딩 설정
if sys.platform == 'win32':
    sys.stdout = open(sys.stdout.buffer.fileno(), 'w', encoding='utf-8', errors='replace')
    sys.stderr = open(sys.stderr.buffer.fileno(), 'w', encoding='utf-8', errors='replace')

def fix_javadoc_comments(content):
    """JavaDoc 주석 형식 오류 수정"""
    # 패턴 1: ` * 설명` 형태 (/** 누락)
    content = re.sub(
        r'^(\s+)\* ([^*].*)$',
        r'\1/**\n\1 * \2',
        content,
        flags=re.MULTILINE
    )
    
    # 패턴 2: 클래스/메서드 바로 위의 주석이 /** 없이 시작하는 경우
    lines = content.split('\n')
    fixed_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # ` * 설명` 형태로 시작하는 주석 블록 찾기
        if re.match(r'^\s+\* [^*]', line):
            # 이전 줄이 비어있거나 import/package가 아닌 경우
            if i > 0 and not re.match(r'^\s*(import|package|@)', lines[i-1]):
                # /** 추가
                indent = len(line) - len(line.lstrip())
                fixed_lines.append(' ' * indent + '/**')
        fixed_lines.append(line)
        i += 1
    
    return '\n'.join(fixed_lines)

def fix_legacy_roles(content):
    """레거시 역할 사용 제거"""
    replacements = [
        # UserRole.HQ_MASTER → UserRole.ADMIN 또는 isAdmin()
        (r'UserRole\.HQ_MASTER', 'UserRole.ADMIN // 표준화 2025-12-05: HQ_MASTER → ADMIN으로 통합'),
        (r'UserRole\.BRANCH_SUPER_ADMIN', 'UserRole.ADMIN // 표준화 2025-12-05: BRANCH_SUPER_ADMIN → ADMIN으로 통합'),
        (r'UserRole\.BRANCH_ADMIN', 'UserRole.ADMIN // 표준화 2025-12-05: BRANCH_ADMIN → ADMIN으로 통합'),
        (r'UserRole\.HQ_ADMIN', 'UserRole.ADMIN // 표준화 2025-12-05: HQ_ADMIN → ADMIN으로 통합'),
        (r'UserRole\.SUPER_HQ_ADMIN', 'UserRole.ADMIN // 표준화 2025-12-05: SUPER_HQ_ADMIN → ADMIN으로 통합'),
        (r'UserRole\.HQ_SUPER_ADMIN', 'UserRole.ADMIN // 표준화 2025-12-05: HQ_SUPER_ADMIN → ADMIN으로 통합'),
        (r'UserRole\.BRANCH_MANAGER', 'UserRole.STAFF // 표준화 2025-12-05: BRANCH_MANAGER → STAFF로 통합'),
        
        # role == UserRole.HQ_MASTER → role.isAdmin()
        (r'role\s*==\s*UserRole\.HQ_MASTER', 'role.isAdmin()'),
        (r'role\s*==\s*UserRole\.BRANCH_SUPER_ADMIN', 'role.isAdmin()'),
        (r'role\s*==\s*UserRole\.BRANCH_ADMIN', 'role.isAdmin()'),
        (r'role\s*==\s*UserRole\.HQ_ADMIN', 'role.isAdmin()'),
        (r'role\s*==\s*UserRole\.SUPER_HQ_ADMIN', 'role.isAdmin()'),
        (r'role\s*==\s*UserRole\.HQ_SUPER_ADMIN', 'role.isAdmin()'),
        
        # user.getRole().equals(UserRole.HQ_MASTER) → user.getRole().isAdmin()
        (r'\.equals\(UserRole\.HQ_MASTER\)', '.isAdmin()'),
        (r'\.equals\(UserRole\.BRANCH_SUPER_ADMIN\)', '.isAdmin()'),
        (r'\.equals\(UserRole\.BRANCH_ADMIN\)', '.isAdmin()'),
        (r'\.equals\(UserRole\.HQ_ADMIN\)', '.isAdmin()'),
        (r'\.equals\(UserRole\.SUPER_HQ_ADMIN\)', '.isAdmin()'),
        (r'\.equals\(UserRole\.HQ_SUPER_ADMIN\)', '.isAdmin()'),
        
        # UserRole.HQ_MASTER.equals() → isAdmin()
        (r'UserRole\.HQ_MASTER\.equals\(', 'user.getRole() != null && user.getRole().isAdmin() // 표준화 2025-12-05'),
    ]
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    return content

def fix_permission_matrix(content):
    """PermissionMatrix의 레거시 역할 매핑 제거"""
    # ROLE_FEATURES.put(UserRole.HQ_MASTER, ...) 제거
    content = re.sub(
        r'//\s*(SUPER_HQ_ADMIN|HQ_MASTER|BRANCH_MANAGER|HQ_SUPER_ADMIN|BRANCH_SUPER_ADMIN|BRANCH_ADMIN|HQ_ADMIN).*?\n\s*ROLE_FEATURES\.put\(UserRole\.\w+.*?\);',
        '// 표준화 2025-12-05: 레거시 역할 제거',
        content,
        flags=re.DOTALL
    )
    
    # ROLE_MENU_GROUPS.put(UserRole.HQ_MASTER, ...) 제거
    content = re.sub(
        r'//\s*(SUPER_HQ_ADMIN|HQ_MASTER|BRANCH_MANAGER|HQ_SUPER_ADMIN|BRANCH_SUPER_ADMIN|BRANCH_ADMIN|HQ_ADMIN).*?\n\s*ROLE_MENU_GROUPS\.put\(UserRole\.\w+.*?\);',
        '// 표준화 2025-12-05: 레거시 역할 제거',
        content,
        flags=re.DOTALL
    )
    
    # ROLE_API_PATTERNS.put(UserRole.HQ_MASTER, ...) 제거
    content = re.sub(
        r'//\s*(SUPER_HQ_ADMIN|HQ_MASTER|BRANCH_MANAGER|HQ_SUPER_ADMIN|BRANCH_SUPER_ADMIN|BRANCH_ADMIN|HQ_ADMIN).*?\n\s*ROLE_API_PATTERNS\.put\(UserRole\.\w+.*?\);',
        '// 표준화 2025-12-05: 레거시 역할 제거',
        content,
        flags=re.DOTALL
    )
    
    return content

def fix_admin_role_utils(content):
    """AdminRoleUtilsMetaAdapter의 레거시 역할 체크 제거"""
    # fallbackIsHqAdmin 메서드 수정
    content = re.sub(
        r'private boolean fallbackIsHqAdmin\(User user\) \{[^}]*return role == UserRole\.HQ_ADMIN[^}]*\}',
        '''private boolean fallbackIsHqAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        // 표준화 2025-12-05: 레거시 역할 제거, 표준 관리자 역할만 체크
        return user.getRole().isAdmin();
    }''',
        content,
        flags=re.DOTALL
    )
    
    # fallbackIsBranchAdmin 메서드 수정
    content = re.sub(
        r'private boolean fallbackIsBranchAdmin\(User user\) \{[^}]*return role == UserRole\.BRANCH_ADMIN[^}]*\}',
        '''private boolean fallbackIsBranchAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        // 표준화 2025-12-05: 레거시 역할 제거, 표준 관리자 역할만 체크
        return user.getRole().isAdmin() || user.getRole() == UserRole.STAFF;
    }''',
        content,
        flags=re.DOTALL
    )
    
    return content

def fix_super_admin_controller(content):
    """SuperAdminController의 레거시 역할 체크 수정"""
    # HQ_MASTER 체크를 isAdmin()으로 변경
    content = re.sub(
        r'if\s*\(currentUser\s*==\s*null\s*\|\|\s*\(!currentUser\.getRole\(\)\.equals\(UserRole\.HQ_MASTER\.getValue\(\)\)[^)]*\)\)',
        'if (currentUser == null || currentUser.getRole() == null || !currentUser.getRole().isAdmin())',
        content
    )
    
    return content

def fix_file(file_path):
    """파일 수정"""
    try:
        file_path_str = str(file_path)
        with open(file_path_str, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # JavaDoc 주석 수정
        content = fix_javadoc_comments(content)
        
        # 레거시 역할 제거
        content = fix_legacy_roles(content)
        
        # PermissionMatrix 특수 처리
        if 'PermissionMatrix' in file_path_str:
            content = fix_permission_matrix(content)
        
        # AdminRoleUtilsMetaAdapter 특수 처리
        if 'AdminRoleUtilsMetaAdapter' in file_path_str:
            content = fix_admin_role_utils(content)
        
        # SuperAdminController 특수 처리
        if 'SuperAdminController' in file_path_str:
            content = fix_super_admin_controller(content)
        
        # 변경사항이 있으면 파일 저장
        if content != original_content:
            with open(file_path_str, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"❌ 오류 발생 ({file_path_str}): {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False

def main():
    """메인 함수"""
    # Java 파일 찾기
    base_dir = Path(__file__).parent.parent
    java_files = []
    
    # 주요 디렉토리에서 Java 파일 찾기
    for pattern in [
        '**/src/main/java/**/*.java',
        '**/src/test/java/**/*.java',
    ]:
        java_files.extend(base_dir.glob(pattern))
    
    # 수정할 파일 목록 (오류가 있는 파일들)
    target_files = [
        'src/main/java/com/coresolution/consultation/service/impl/UserProfileServiceImpl.java',
        'src/main/java/com/coresolution/consultation/controller/SuperAdminController.java',
        'src/main/java/com/coresolution/consultation/constant/PermissionMatrix.java',
        'src/main/java/com/coresolution/core/service/impl/AdminRoleUtilsMetaAdapter.java',
        'src/main/java/com/coresolution/consultation/service/impl/ScheduleServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/ErpServiceImpl.java',
        'src/main/java/com/coresolution/consultation/entity/Schedule.java',
        'src/main/java/com/coresolution/consultation/service/impl/SessionSyncServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/BankTransferServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/StatisticsServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/ConsultantRatingServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/ConsultationServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/BranchServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/FinancialTransactionServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/PaymentServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/StatisticsSchedulerServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/ClientStatsServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/StatisticsTestDataServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/DiscountAccountingServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/AcademyBillingServiceImpl.java',
        'src/main/java/com/coresolution/core/service/billing/impl/SubscriptionPlanChangeServiceImpl.java',
        'src/main/java/com/coresolution/core/service/billing/impl/SubscriptionExpirationServiceImpl.java',
        'src/main/java/com/coresolution/core/service/billing/impl/SubscriptionRefundServiceImpl.java',
        'src/main/java/com/coresolution/core/service/impl/TenantPgConfigurationServiceImpl.java',
        'src/main/java/com/coresolution/core/service/impl/OnboardingServiceImpl.java',
        'src/main/java/com/coresolution/core/service/ops/DashboardService.java',
        'src/main/java/com/coresolution/consultation/entity/PerformanceAlert.java',
        'src/main/java/com/coresolution/consultation/entity/AccountingEntry.java',
        'src/main/java/com/coresolution/consultation/entity/Budget.java',
        'src/main/java/com/coresolution/consultation/entity/Branch.java',
        'src/main/java/com/coresolution/consultation/entity/ConsultantRating.java',
        'src/main/java/com/coresolution/consultation/entity/ConsultantClientMapping.java',
        'src/main/java/com/coresolution/consultation/entity/ConsultationRecordAlert.java',
        'src/main/java/com/coresolution/consultation/entity/DiscountAccountingTransaction.java',
        'src/main/java/com/coresolution/consultation/entity/ErpSyncLog.java',
        'src/main/java/com/coresolution/consultation/entity/FinancialTransaction.java',
        'src/main/java/com/coresolution/consultation/entity/PurchaseOrder.java',
        'src/main/java/com/coresolution/consultation/entity/PurchaseRequest.java',
        'src/main/java/com/coresolution/consultation/entity/SessionExtensionRequest.java',
        'src/main/java/com/coresolution/consultation/service/BranchCodeInitService.java',
        'src/main/java/com/coresolution/consultation/service/ScheduleAutoCompleteService.java',
        'src/main/java/com/coresolution/core/controller/OnboardingController.java',
        'src/main/java/com/coresolution/core/controller/academy/AcademyConsultationController.java',
        'src/main/java/com/coresolution/core/controller/academy/AcademyEnrollmentController.java',
        'src/main/java/com/coresolution/core/domain/Tenant.java',
        'src/main/java/com/coresolution/core/domain/TenantComponent.java',
        'src/main/java/com/coresolution/core/domain/TenantPgConfiguration.java',
        'src/main/java/com/coresolution/core/domain/TenantSubscription.java',
        'src/main/java/com/coresolution/core/domain/academy/AcademyInvoice.java',
        'src/main/java/com/coresolution/core/domain/academy/AcademySettlement.java',
        'src/main/java/com/coresolution/core/domain/academy/AcademyTuitionPayment.java',
        'src/main/java/com/coresolution/core/domain/academy/Class.java',
        'src/main/java/com/coresolution/core/domain/academy/ClassEnrollment.java',
        'src/main/java/com/coresolution/core/domain/onboarding/OnboardingRequest.java',
        'src/main/java/com/coresolution/core/service/academy/impl/AcademySettlementServiceImpl.java',
        'src/main/java/com/coresolution/core/service/academy/impl/ClassEnrollmentServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/ErpDiscountIntegrationServiceImpl.java',
        'src/main/java/com/coresolution/consultation/controller/AdminController.java',
        'src/main/java/com/coresolution/consultation/controller/TestDataController.java',
        'src/main/java/com/coresolution/consultation/service/impl/BranchPermissionServiceImpl.java',
    ]
    
    fixed_count = 0
    error_count = 0
    
    for rel_path in target_files:
        file_path = base_dir / rel_path
        if file_path.exists():
            print(f"수정 중: {rel_path}")
            if fix_file(file_path):
                fixed_count += 1
                print(f"✅ 수정 완료: {rel_path}")
            else:
                print(f"ℹ️  변경사항 없음: {rel_path}")
        else:
            print(f"⚠️  파일 없음: {rel_path}")
            error_count += 1
    
    print(f"\n✅ 수정 완료: {fixed_count}개 파일")
    if error_count > 0:
        print(f"⚠️  파일 없음: {error_count}개")

if __name__ == '__main__':
    main()

