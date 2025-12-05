#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
역할 시스템 통합 표준화 스크립트
브랜치/HQ 개념 완전 제거 및 공통코드 기반 동적 역할 조회로 통합

표준화 원칙 (TENANT_ROLE_SYSTEM_STANDARD.md):
1. 브랜치/HQ 레거시 역할 완전 제거
   - BRANCH_ADMIN, BRANCH_SUPER_ADMIN, BRANCH_MANAGER → ADMIN 또는 STAFF로 통합
   - HQ_ADMIN, SUPER_HQ_ADMIN, HQ_MASTER, HQ_SUPER_ADMIN → ADMIN으로 통합
2. 표준 역할만 사용 (공통코드에서 동적 조회)
   - ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER (관리자)
   - CONSULTANT, CLIENT, STAFF, PARENT (일반 사용자)
3. 모든 역할 체크는 공통코드 기반 동적 조회 (COMMON_CODE_SYSTEM_STANDARD.md)
"""

import os
import re
import sys
import io
from pathlib import Path

# Windows 인코딩 문제 해결
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 프로젝트 루트 디렉토리
PROJECT_ROOT = Path(__file__).parent.parent.parent
JAVA_SRC = PROJECT_ROOT / "src" / "main" / "java" / "com" / "coresolution" / "consultation"

# 레거시 역할 → 표준 역할 매핑 (완전 제거)
LEGACY_ROLE_MAPPING = {
    # 브랜치 관련 → ADMIN 또는 STAFF로 통합
    'BRANCH_ADMIN': 'ADMIN',
    'BRANCH_SUPER_ADMIN': 'ADMIN',
    'BRANCH_MANAGER': 'STAFF',
    # HQ 관련 → ADMIN으로 통합
    'HQ_ADMIN': 'ADMIN',
    'SUPER_HQ_ADMIN': 'ADMIN',
    'HQ_MASTER': 'ADMIN',
    'HQ_SUPER_ADMIN': 'ADMIN',
}

# 표준 관리자 역할 (공통코드에서 조회)
STANDARD_ADMIN_ROLES = ['ADMIN', 'TENANT_ADMIN', 'PRINCIPAL', 'OWNER']

# 레거시 역할 체크 패턴 → 공통코드 기반으로 변경
LEGACY_ROLE_CHECK_PATTERNS = [
    # UserRole enum 직접 비교 → 공통코드 기반
    (r'user\.getRole\(\)\s*==\s*UserRole\.(HQ_MASTER|HQ_ADMIN|SUPER_HQ_ADMIN|HQ_SUPER_ADMIN|BRANCH_SUPER_ADMIN|BRANCH_ADMIN)',
     r'isAdminRoleFromCommonCode(user.getRole())'),
    (r'userRole\s*==\s*UserRole\.(HQ_MASTER|HQ_ADMIN|SUPER_HQ_ADMIN|HQ_SUPER_ADMIN|BRANCH_SUPER_ADMIN|BRANCH_ADMIN)',
     r'isAdminRoleFromCommonCode(userRole)'),
    (r'currentUser\.getRole\(\)\s*==\s*UserRole\.(HQ_MASTER|HQ_ADMIN|SUPER_HQ_ADMIN|HQ_SUPER_ADMIN|BRANCH_SUPER_ADMIN|BRANCH_ADMIN)',
     r'isAdminRoleFromCommonCode(currentUser.getRole())'),
    # BRANCH_MANAGER → STAFF
    (r'user\.getRole\(\)\s*==\s*UserRole\.BRANCH_MANAGER',
     r'isStaffRoleFromCommonCode(user.getRole())'),
    (r'userRole\s*==\s*UserRole\.BRANCH_MANAGER',
     r'isStaffRoleFromCommonCode(userRole)'),
    # .equals() 메서드
    (r'\.getRole\(\)\.equals\(UserRole\.(HQ_MASTER|HQ_ADMIN|SUPER_HQ_ADMIN|HQ_SUPER_ADMIN|BRANCH_SUPER_ADMIN|BRANCH_ADMIN)\)',
     r'.getRole()) && isAdminRoleFromCommonCode(user.getRole())'),
    (r'\.equals\(UserRole\.(HQ_MASTER|HQ_ADMIN|SUPER_HQ_ADMIN|HQ_SUPER_ADMIN|BRANCH_SUPER_ADMIN|BRANCH_ADMIN)\)',
     r') && isAdminRoleFromCommonCode(userRole)'),
]

# 레거시 메서드 호출 → 공통코드 기반으로 변경
LEGACY_METHOD_PATTERNS = [
    (r'\.isHeadquartersAdmin\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
    (r'\.isHqMaster\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
    (r'\.isHqAdmin\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
    (r'\.isSuperAdmin\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
    (r'\.isBranchAdmin\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
    (r'\.isBranchSuperAdmin\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
    (r'\.isBranchManager\(\)', r'.isStaffRoleFromCommonCode() // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
    (r'\.hasBranchManagementAccess\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
    (r'\.isAdminOrSuperAdmin\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
    (r'\.isMaster\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
]

# 복합 조건 → 공통코드 기반으로 단순화
COMPLEX_CONDITION_PATTERNS = [
    # 여러 레거시 역할 체크 → 단일 공통코드 체크
    (r'\(user\.getRole\(\)\s*==\s*UserRole\.(HQ_MASTER|HQ_ADMIN|SUPER_HQ_ADMIN|HQ_SUPER_ADMIN|BRANCH_SUPER_ADMIN|BRANCH_ADMIN)\s*\)\s*\|\|\s*\(user\.getRole\(\)\s*==\s*UserRole\.(HQ_MASTER|HQ_ADMIN|SUPER_HQ_ADMIN|HQ_SUPER_ADMIN|BRANCH_SUPER_ADMIN|BRANCH_ADMIN)\s*\)',
     r'isAdminRoleFromCommonCode(user.getRole())'),
    (r'user\.getRole\(\)\s*==\s*UserRole\.HQ_MASTER\s*\|\|\s*user\.getRole\(\)\s*==\s*UserRole\.BRANCH_SUPER_ADMIN',
     r'isAdminRoleFromCommonCode(user.getRole())'),
    (r'!user\.getRole\(\)\.isAdmin\(\)\s*&&\s*!user\.getRole\(\)\.isMaster\(\)',
     r'!isAdminRoleFromCommonCode(user.getRole())'),
    (r'!currentUser\.getRole\(\)\.isAdmin\(\)\s*&&\s*!currentUser\.getRole\(\)\.isMaster\(\)',
     r'!isAdminRoleFromCommonCode(currentUser.getRole())'),
]

# 레거시 역할 문자열 → 표준 역할로 변경
LEGACY_ROLE_STRING_PATTERNS = [
    (r'"HQ_MASTER"', '"ADMIN" // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
    (r'"HQ_ADMIN"', '"ADMIN" // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
    (r'"SUPER_HQ_ADMIN"', '"ADMIN" // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
    (r'"BRANCH_SUPER_ADMIN"', '"ADMIN" // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
    (r'"BRANCH_ADMIN"', '"ADMIN" // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
    (r'"BRANCH_MANAGER"', '"STAFF" // 표준화 2025-12-05: 브랜치/HQ 개념 제거'),
]

def add_common_code_helper_methods(content, file_path):
    """공통코드 기반 역할 체크 헬퍼 메서드 추가"""
    if 'isAdminRoleFromCommonCode' in content:
        return content, False
    
    # 클래스 끝부분 찾기
    class_end_match = re.search(r'(\n\s*)\}$', content)
    if not class_end_match:
        return content, False
    
    indent = class_end_match.group(1)
    
    helper_methods = f'''
{indent}/**
{indent} * 공통코드에서 관리자 역할인지 확인 (표준화 2025-12-05: 브랜치/HQ 개념 제거, 동적 역할 조회)
{indent} * 표준 관리자 역할: ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER
{indent} * 레거시 역할(HQ_*, BRANCH_*)은 더 이상 사용하지 않음
{indent} * @param role 사용자 역할
{indent} * @return 관리자 역할 여부
{indent} */
{indent}private boolean isAdminRoleFromCommonCode(UserRole role) {{
{indent}    if (role == null) {{
{indent}        return false;
{indent}    }}
{indent}    try {{
{indent}        // 공통코드에서 관리자 역할 목록 조회 (codeGroup='ROLE', extraData에 isAdmin=true)
{indent}        List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");
{indent}        if (roleCodes == null || roleCodes.isEmpty()) {{
{indent}            // 폴백: 표준 관리자 역할만 체크 (브랜치/HQ 개념 제거)
{indent}            return role == UserRole.ADMIN || 
{indent}                   role == UserRole.TENANT_ADMIN || 
{indent}                   role == UserRole.PRINCIPAL || 
{indent}                   role == UserRole.OWNER;
{indent}        }}
{indent}        // 공통코드에서 관리자 역할인지 확인
{indent}        String roleName = role.name();
{indent}        return roleCodes.stream()
{indent}            .anyMatch(code -> code.getCodeValue().equals(roleName) && 
{indent}                          (code.getExtraData() != null && 
{indent}                           (code.getExtraData().contains("\\"isAdmin\\":true") || 
{indent}                            code.getExtraData().contains("\\"roleType\\":\\"ADMIN\\""))));
{indent}    }} catch (Exception e) {{
{indent}        log.warn("공통코드에서 관리자 역할 조회 실패, 폴백 사용: {{}}", role, e);
{indent}        // 폴백: 표준 관리자 역할만 체크
{indent}        return role == UserRole.ADMIN || 
{indent}               role == UserRole.TENANT_ADMIN || 
{indent}               role == UserRole.PRINCIPAL || 
{indent}               role == UserRole.OWNER;
{indent}    }}
{indent}}}

{indent}/**
{indent} * 공통코드에서 사무원 역할인지 확인 (표준화 2025-12-05: 브랜치/HQ 개념 제거, 동적 역할 조회)
{indent} * BRANCH_MANAGER → STAFF로 통합
{indent} * @param role 사용자 역할
{indent} * @return 사무원 역할 여부
{indent} */
{indent}private boolean isStaffRoleFromCommonCode(UserRole role) {{
{indent}    if (role == null) {{
{indent}        return false;
{indent}    }}
{indent}    try {{
{indent}        // 공통코드에서 사무원 역할 목록 조회
{indent}        List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");
{indent}        if (roleCodes == null || roleCodes.isEmpty()) {{
{indent}            return role == UserRole.STAFF;
{indent}        }}
{indent}        // 공통코드에서 사무원 역할인지 확인
{indent}        String roleName = role.name();
{indent}        return roleCodes.stream()
{indent}            .anyMatch(code -> code.getCodeValue().equals(roleName) && 
{indent}                          (code.getExtraData() != null && 
{indent}                           (code.getExtraData().contains("\\"isStaff\\":true") || 
{indent}                            code.getExtraData().contains("\\"roleType\\":\\"STAFF\\""))));
{indent}    }} catch (Exception e) {{
{indent}        log.warn("공통코드에서 사무원 역할 조회 실패, 폴백 사용: {{}}", role, e);
{indent}        return role == UserRole.STAFF;
{indent}    }}
{indent}}}
'''
    
    insert_pos = class_end_match.start()
    new_content = content[:insert_pos] + helper_methods + content[insert_pos:]
    
    return new_content, True

def add_imports(content, file_path):
    """필요한 import 추가"""
    imports_to_add = []
    
    if 'CommonCode' in content and not re.search(r'import.*CommonCode', content):
        imports_to_add.append('import com.coresolution.consultation.entity.CommonCode;')
    
    if 'List<CommonCode>' in content and 'import java.util.List;' not in content:
        imports_to_add.append('import java.util.List;')
    
    if not imports_to_add:
        return content, False
    
    package_match = re.search(r'(package\s+[^;]+;)', content)
    if package_match:
        insert_pos = package_match.end()
        imports = '\n' + '\n'.join(imports_to_add) + '\n'
        new_content = content[:insert_pos] + imports + content[insert_pos:]
        return new_content, True
    
    return content, False

def process_file(file_path):
    """파일을 읽어서 브랜치/HQ 레거시 역할을 제거하고 공통코드 기반으로 변경"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        print(f"[WARN] 인코딩 오류: {file_path}")
        return False
    
    original_content = content
    modified = False
    
    # 1. 복합 조건 패턴 처리
    for pattern, replacement in COMPLEX_CONDITION_PATTERNS:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True
    
    # 2. 레거시 역할 비교 패턴 처리
    for pattern, replacement in LEGACY_ROLE_CHECK_PATTERNS:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True
    
    # 3. 레거시 메서드 호출 대체
    for pattern, replacement in LEGACY_METHOD_PATTERNS:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True
    
    # 4. 레거시 역할 문자열 대체
    for pattern, replacement in LEGACY_ROLE_STRING_PATTERNS:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True
    
    # 5. CommonCodeService 의존성 확인 및 추가
    if modified:
        if 'CommonCodeService' not in content and 'commonCodeService' not in content:
            if '@RequiredArgsConstructor' in content or '@Autowired' in content:
                class_match = re.search(r'public\s+class\s+(\w+)', content)
                if class_match:
                    class_start = class_match.end()
                    field_declaration = '\n    private final CommonCodeService commonCodeService;\n'
                    content = content[:class_start] + field_declaration + content[class_start:]
                    modified = True
        
        content, imports_added = add_imports(content, file_path)
        if imports_added:
            modified = True
        
        content, helpers_added = add_common_code_helper_methods(content, file_path)
        if helpers_added:
            modified = True
    
    # 6. 표준화 주석 추가
    if modified and '표준화 2025-12-05' not in content[:500]:
        package_match = re.search(r'(package\s+[^;]+;)', content)
        if package_match:
            insert_pos = package_match.end()
            comment = '\n\n// 표준화 2025-12-05: 브랜치/HQ 개념 제거, 역할 체크를 공통코드 기반 동적 조회로 통합 (TENANT_ROLE_SYSTEM_STANDARD.md 준수)'
            content = content[:insert_pos] + comment + content[insert_pos:]
    
    if modified and content != original_content:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"[ERROR] 파일 쓰기 실패: {file_path}, 오류: {e}")
            return False
    
    return False

def find_java_files(directory):
    """Java 파일 찾기"""
    java_files = []
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in ['target', '.git', 'node_modules', 'test']]
        for file in files:
            if file.endswith('.java'):
                if any(keyword in file for keyword in ['Controller', 'Service', 'Utils', 'Constant', 'Role']):
                    java_files.append(os.path.join(root, file))
    return java_files

def main():
    """메인 함수"""
    print("=" * 60)
    print("역할 시스템 통합 표준화 스크립트")
    print("=" * 60)
    print("표준: TENANT_ROLE_SYSTEM_STANDARD.md - 브랜치/HQ 개념 완전 제거")
    print("표준: COMMON_CODE_SYSTEM_STANDARD.md - 모든 역할은 공통코드에서 동적 조회")
    print()
    
    controller_dir = JAVA_SRC / "controller"
    service_dir = JAVA_SRC / "service"
    util_dir = JAVA_SRC / "util"
    utils_dir = JAVA_SRC / "utils"
    constant_dir = JAVA_SRC / "constant"
    
    all_files = []
    
    if controller_dir.exists():
        all_files.extend(find_java_files(controller_dir))
    if service_dir.exists():
        all_files.extend(find_java_files(service_dir))
    if util_dir.exists():
        all_files.extend(find_java_files(util_dir))
    if utils_dir.exists():
        all_files.extend(find_java_files(utils_dir))
    if constant_dir.exists():
        all_files.extend(find_java_files(constant_dir))
    
    print(f"총 {len(all_files)}개 Java 파일 발견")
    print()
    
    modified_count = 0
    error_count = 0
    
    for file_path in all_files:
        try:
            if process_file(file_path):
                print(f"[OK] 수정: {file_path}")
                modified_count += 1
        except Exception as e:
            print(f"[ERROR] 오류: {file_path}, {e}")
            error_count += 1
    
    print()
    print("=" * 60)
    print("작업 완료")
    print("=" * 60)
    print(f"수정된 파일: {modified_count}개")
    print(f"오류 발생: {error_count}개")
    print()
    
    if modified_count > 0:
        print("[주의] 주의사항:")
        print("1. 브랜치/HQ 관련 레거시 역할이 모두 제거되고 표준 역할로 통합되었습니다.")
        print("2. 모든 역할 체크는 공통코드 기반 동적 조회로 변경되었습니다.")
        print("3. CommonCodeService 의존성 주입이 올바른지 확인하세요.")
        print("4. 공통코드에 ROLE 코드 그룹이 설정되어 있는지 확인하세요.")
        print("5. 헬퍼 메서드(isAdminRoleFromCommonCode 등)의 실제 구현을 검토하세요.")

if __name__ == "__main__":
    main()

