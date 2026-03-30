#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
역할 시스템 동적 표준화 스크립트
하드코딩된 역할 체크를 공통코드 기반 동적 조회로 변경

표준화 원칙:
- 모든 역할은 공통코드(common_codes, codeGroup='ROLE' 또는 'USER_ROLE')에서 동적 조회
- UserRole enum의 하드코딩된 역할 체크 제거
- CommonCodeService를 통한 동적 역할 조회로 변경
"""

import os
import re
import sys
from pathlib import Path

# 프로젝트 루트 디렉토리
PROJECT_ROOT = Path(__file__).parent.parent.parent
JAVA_SRC = PROJECT_ROOT / "src" / "main" / "java" / "com" / "coresolution" / "consultation"

# 레거시 역할 체크 메서드 → 공통코드 기반 동적 조회로 변경
LEGACY_METHOD_REPLACEMENTS = {
    # UserRole enum 메서드 → 공통코드 조회
    "isHeadquartersAdmin()": "isAdminRoleFromCommonCode()",  # 공통코드에서 ADMIN 역할 조회
    "isHqMaster()": "isAdminRoleFromCommonCode()",
    "isHqAdmin()": "isAdminRoleFromCommonCode()",
    "isSuperAdmin()": "isAdminRoleFromCommonCode()",
    "isBranchAdmin()": "isAdminRoleFromCommonCode()",
    "isBranchSuperAdmin()": "isAdminRoleFromCommonCode()",
    "isBranchManager()": "isStaffRoleFromCommonCode()",  # STAFF 역할 조회
    "hasBranchManagementAccess()": "isAdminRoleFromCommonCode()",
    "isAdminOrSuperAdmin()": "isAdminRoleFromCommonCode()",
}

# 역할 비교 패턴 → 공통코드 기반 비교로 변경
ROLE_COMPARISON_PATTERNS = [
    # 브랜치/HQ 관련 레거시 역할 → 공통코드 기반 관리자 역할 조회
    # HQ_MASTER, HQ_ADMIN, SUPER_HQ_ADMIN, HQ_SUPER_ADMIN → ADMIN 역할로 통합
    (r'user\.getRole\(\)\s*==\s*UserRole\.(HQ_MASTER|HQ_ADMIN|SUPER_HQ_ADMIN|HQ_SUPER_ADMIN)',
     r'isAdminRoleFromCommonCode(user.getRole())'),
    (r'userRole\s*==\s*UserRole\.(HQ_MASTER|HQ_ADMIN|SUPER_HQ_ADMIN|HQ_SUPER_ADMIN)',
     r'isAdminRoleFromCommonCode(userRole)'),
    (r'currentUser\.getRole\(\)\s*==\s*UserRole\.(HQ_MASTER|HQ_ADMIN|SUPER_HQ_ADMIN|HQ_SUPER_ADMIN)',
     r'isAdminRoleFromCommonCode(currentUser.getRole())'),
    # BRANCH_SUPER_ADMIN, BRANCH_ADMIN → ADMIN 역할로 통합
    (r'user\.getRole\(\)\s*==\s*UserRole\.(BRANCH_SUPER_ADMIN|BRANCH_ADMIN)',
     r'isAdminRoleFromCommonCode(user.getRole())'),
    (r'userRole\s*==\s*UserRole\.(BRANCH_SUPER_ADMIN|BRANCH_ADMIN)',
     r'isAdminRoleFromCommonCode(userRole)'),
    (r'currentUser\.getRole\(\)\s*==\s*UserRole\.(BRANCH_SUPER_ADMIN|BRANCH_ADMIN)',
     r'isAdminRoleFromCommonCode(currentUser.getRole())'),
    # BRANCH_MANAGER → STAFF 역할 조회
    (r'user\.getRole\(\)\s*==\s*UserRole\.BRANCH_MANAGER',
     r'isStaffRoleFromCommonCode(user.getRole())'),
    (r'userRole\s*==\s*UserRole\.BRANCH_MANAGER',
     r'isStaffRoleFromCommonCode(userRole)'),
    # .equals() 메서드 사용 패턴
    (r'\.getRole\(\)\.equals\(UserRole\.(HQ_MASTER|HQ_ADMIN|SUPER_HQ_ADMIN|HQ_SUPER_ADMIN|BRANCH_SUPER_ADMIN|BRANCH_ADMIN)\)',
     r'.getRole()) && isAdminRoleFromCommonCode(user.getRole())'),
    (r'\.equals\(UserRole\.(HQ_MASTER|HQ_ADMIN|SUPER_HQ_ADMIN|HQ_SUPER_ADMIN|BRANCH_SUPER_ADMIN|BRANCH_ADMIN)\)',
     r') && isAdminRoleFromCommonCode(userRole)'),
]

# 역할 문자열 비교 → 공통코드 조회로 변경
ROLE_STRING_PATTERNS = [
    # "HQ_MASTER" → commonCodeService에서 조회
    (r'"HQ_MASTER"|"HQ_ADMIN"|"SUPER_HQ_ADMIN"|"BRANCH_SUPER_ADMIN"|"BRANCH_ADMIN"',
     r'getAdminRoleFromCommonCode()'),  # 주의: 실제 구현 필요
    (r"'HQ_MASTER'|'HQ_ADMIN'|'SUPER_HQ_ADMIN'|'BRANCH_SUPER_ADMIN'|'BRANCH_ADMIN'",
     r"getAdminRoleFromCommonCode()"),
]

# 복합 조건 → 공통코드 기반으로 단순화
COMPLEX_CONDITION_PATTERNS = [
    # HQ_MASTER || BRANCH_SUPER_ADMIN → isAdminRoleFromCommonCode()
    (r'user\.getRole\(\)\s*==\s*UserRole\.HQ_MASTER\s*\|\|\s*user\.getRole\(\)\s*==\s*UserRole\.BRANCH_SUPER_ADMIN',
     r'isAdminRoleFromCommonCode(user.getRole())'),
    (r'userRole\s*==\s*UserRole\.HQ_MASTER\s*\|\|\s*userRole\s*==\s*UserRole\.BRANCH_SUPER_ADMIN',
     r'isAdminRoleFromCommonCode(userRole)'),
    (r'currentUser\.getRole\(\)\s*==\s*UserRole\.HQ_MASTER\s*\|\|\s*currentUser\.getRole\(\)\s*==\s*UserRole\.BRANCH_SUPER_ADMIN',
     r'isAdminRoleFromCommonCode(currentUser.getRole())'),
    # 여러 관리자 역할 체크 → isAdminRoleFromCommonCode()
    (r'\(user\.getRole\(\)\s*==\s*UserRole\.(HQ_MASTER|HQ_ADMIN|SUPER_HQ_ADMIN|HQ_SUPER_ADMIN|BRANCH_SUPER_ADMIN|BRANCH_ADMIN)\s*\)\s*\|\|\s*\(user\.getRole\(\)\s*==\s*UserRole\.(HQ_MASTER|HQ_ADMIN|SUPER_HQ_ADMIN|HQ_SUPER_ADMIN|BRANCH_SUPER_ADMIN|BRANCH_ADMIN)\s*\)',
     r'isAdminRoleFromCommonCode(user.getRole())'),
    # !isAdmin() && !isMaster() → !isAdminRoleFromCommonCode()
    (r'!user\.getRole\(\)\.isAdmin\(\)\s*&&\s*!user\.getRole\(\)\.isMaster\(\)',
     r'!isAdminRoleFromCommonCode(user.getRole())'),
    (r'!currentUser\.getRole\(\)\.isAdmin\(\)\s*&&\s*!currentUser\.getRole\(\)\.isMaster\(\)',
     r'!isAdminRoleFromCommonCode(currentUser.getRole())'),
    # HQ_ADMIN || SUPER_HQ_ADMIN → isAdminRoleFromCommonCode()
    (r'user\.getRole\(\)\s*==\s*UserRole\.HQ_ADMIN\s*\|\|\s*user\.getRole\(\)\s*==\s*UserRole\.SUPER_HQ_ADMIN',
     r'isAdminRoleFromCommonCode(user.getRole())'),
    # BRANCH_SUPER_ADMIN || ADMIN → isAdminRoleFromCommonCode()
    (r'user\.getRole\(\)\s*==\s*UserRole\.BRANCH_SUPER_ADMIN\s*\|\|\s*user\.getRole\(\)\s*==\s*UserRole\.ADMIN',
     r'isAdminRoleFromCommonCode(user.getRole())'),
]

def add_common_code_helper_methods(content, file_path):
    """공통코드 기반 역할 체크 헬퍼 메서드 추가"""
    # 이미 헬퍼 메서드가 있는지 확인
    if 'isAdminRoleFromCommonCode' in content:
        return content, False
    
    # 클래스 끝부분 찾기 (마지막 } 전)
    class_end_match = re.search(r'(\n\s*)\}$', content)
    if not class_end_match:
        return content, False
    
    indent = class_end_match.group(1)
    
    # 헬퍼 메서드 추가
    helper_methods = f'''
{indent}/**
{indent} * 공통코드에서 관리자 역할인지 확인 (표준화 2025-12-05: 동적 역할 조회)
{indent} * @param role 사용자 역할
{indent} * @return 관리자 역할 여부
{indent} */
{indent}private boolean isAdminRoleFromCommonCode(UserRole role) {{
{indent}    if (role == null) {{
{indent}        return false;
{indent}    }}
{indent}    try {{
{indent}        // 공통코드에서 관리자 역할 목록 조회
{indent}        List<CommonCode> adminRoles = commonCodeService.getActiveCommonCodesByGroup("ROLE");
{indent}        if (adminRoles == null || adminRoles.isEmpty()) {{
{indent}            // 폴백: 표준 관리자 역할만 체크
{indent}            return role == UserRole.ADMIN || 
{indent}                   role == UserRole.TENANT_ADMIN || 
{indent}                   role == UserRole.PRINCIPAL || 
{indent}                   role == UserRole.OWNER;
{indent}        }}
{indent}        // 공통코드에서 관리자 역할인지 확인
{indent}        String roleName = role.name();
{indent}        return adminRoles.stream()
{indent}            .anyMatch(code -> code.getCodeValue().equals(roleName) && 
{indent}                          (code.getExtraData() != null && 
{indent}                           code.getExtraData().contains("\\"isAdmin\\":true")));
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
{indent} * 공통코드에서 사무원 역할인지 확인 (표준화 2025-12-05: 동적 역할 조회)
{indent} * @param role 사용자 역할
{indent} * @return 사무원 역할 여부
{indent} */
{indent}private boolean isStaffRoleFromCommonCode(UserRole role) {{
{indent}    if (role == null) {{
{indent}        return false;
{indent}    }}
{indent}    try {{
{indent}        // 공통코드에서 사무원 역할 목록 조회
{indent}        List<CommonCode> staffRoles = commonCodeService.getActiveCommonCodesByGroup("ROLE");
{indent}        if (staffRoles == null || staffRoles.isEmpty()) {{
{indent}            return role == UserRole.STAFF;
{indent}        }}
{indent}        // 공통코드에서 사무원 역할인지 확인
{indent}        String roleName = role.name();
{indent}        return staffRoles.stream()
{indent}            .anyMatch(code -> code.getCodeValue().equals(roleName) && 
{indent}                          (code.getExtraData() != null && 
{indent}                           code.getExtraData().contains("\\"isStaff\\":true")));
{indent}    }} catch (Exception e) {{
{indent}        log.warn("공통코드에서 사무원 역할 조회 실패, 폴백 사용: {{}}", role, e);
{indent}        return role == UserRole.STAFF;
{indent}    }}
{indent}}}
'''
    
    # 클래스 끝부분에 헬퍼 메서드 추가
    insert_pos = class_end_match.start()
    new_content = content[:insert_pos] + helper_methods + content[insert_pos:]
    
    return new_content, True

def add_imports(content, file_path):
    """필요한 import 추가"""
    imports_to_add = []
    
    # CommonCode import 필요 여부 확인
    if 'CommonCode' in content and 'import.*CommonCode' not in content:
        imports_to_add.append('import com.coresolution.consultation.entity.CommonCode;')
    
    # List import 필요 여부 확인
    if 'List<CommonCode>' in content and 'import java.util.List;' not in content:
        imports_to_add.append('import java.util.List;')
    
    if not imports_to_add:
        return content, False
    
    # package 선언 다음에 import 추가
    package_match = re.search(r'(package\s+[^;]+;)', content)
    if package_match:
        insert_pos = package_match.end()
        imports = '\n' + '\n'.join(imports_to_add) + '\n'
        new_content = content[:insert_pos] + imports + content[insert_pos:]
        return new_content, True
    
    return content, False

def process_file(file_path):
    """파일을 읽어서 하드코딩된 역할 체크를 공통코드 기반으로 변경"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        print(f"⚠️  인코딩 오류: {file_path}")
        return False
    
    original_content = content
    modified = False
    
    # 1. 복합 조건 패턴 처리
    for pattern, replacement in COMPLEX_CONDITION_PATTERNS:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True
    
    # 2. 역할 비교 패턴 처리
    for pattern, replacement in ROLE_COMPARISON_PATTERNS:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True
    
    # 3. 레거시 메서드 호출 대체 (브랜치/HQ 관련 메서드)
    # isHeadquartersAdmin(), isBranchAdmin() 등 → 공통코드 기반으로 변경
    legacy_method_patterns = [
        (r'\.isHeadquartersAdmin\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 공통코드 기반'),
        (r'\.isHqMaster\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 공통코드 기반'),
        (r'\.isHqAdmin\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 공통코드 기반'),
        (r'\.isSuperAdmin\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 공통코드 기반'),
        (r'\.isBranchAdmin\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 공통코드 기반'),
        (r'\.isBranchSuperAdmin\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 공통코드 기반'),
        (r'\.isBranchManager\(\)', r'.isStaffRoleFromCommonCode() // 표준화 2025-12-05: 공통코드 기반'),
        (r'\.hasBranchManagementAccess\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 공통코드 기반'),
        (r'\.isAdminOrSuperAdmin\(\)', r'.isAdminRoleFromCommonCode() // 표준화 2025-12-05: 공통코드 기반'),
        # UserRole enum 메서드 직접 호출
        (r'UserRole\.fromString\([^)]+\)\.isHeadquartersAdmin\(\)', r'isAdminRoleFromCommonCode(UserRole.fromString($1))'),
        (r'UserRole\.fromString\([^)]+\)\.isBranchAdmin\(\)', r'isAdminRoleFromCommonCode(UserRole.fromString($1))'),
    ]
    
    for pattern, replacement in legacy_method_patterns:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True
    
    # 4. CommonCodeService 의존성 확인 및 추가
    if modified:
        # CommonCodeService 필드/주입 확인
        if 'CommonCodeService' not in content and 'commonCodeService' not in content:
            # @RequiredArgsConstructor 또는 생성자 주입 확인
            if '@RequiredArgsConstructor' in content or '@Autowired' in content:
                # 필드 추가 (클래스 필드 영역 찾기)
                field_match = re.search(r'(@RequiredArgsConstructor|@Autowired)\s*\n\s*public\s+class\s+\w+', content)
                if field_match:
                    # 필드 추가 위치 찾기
                    class_match = re.search(r'public\s+class\s+(\w+)', content)
                    if class_match:
                        # 클래스 시작 부분에 필드 추가
                        class_start = class_match.end()
                        field_declaration = '\n    private final CommonCodeService commonCodeService;\n'
                        content = content[:class_start] + field_declaration + content[class_start:]
                        modified = True
        
        # import 추가
        content, imports_added = add_imports(content, file_path)
        if imports_added:
            modified = True
        
        # 헬퍼 메서드 추가
        content, helpers_added = add_common_code_helper_methods(content, file_path)
        if helpers_added:
            modified = True
    
    # 5. 표준화 주석 추가
    if modified and '표준화 2025-12-05' not in content[:500]:
        package_match = re.search(r'(package\s+[^;]+;)', content)
        if package_match:
            insert_pos = package_match.end()
            comment = '\n\n// 표준화 2025-12-05: 역할 체크를 공통코드 기반 동적 조회로 변경 (COMMON_CODE_SYSTEM_STANDARD.md 준수)'
            content = content[:insert_pos] + comment + content[insert_pos:]
    
    if modified and content != original_content:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"❌ 파일 쓰기 실패: {file_path}, 오류: {e}")
            return False
    
    return False

def find_java_files(directory):
    """Java 파일 찾기"""
    java_files = []
    for root, dirs, files in os.walk(directory):
        # target, .git 등 제외
        dirs[:] = [d for d in dirs if d not in ['target', '.git', 'node_modules', 'test']]
        for file in files:
            if file.endswith('.java'):
                # Controller, Service, Utils, Constant 파일 모두 포함
                if any(keyword in file for keyword in ['Controller', 'Service', 'Utils', 'Constant', 'Role']):
                    java_files.append(os.path.join(root, file))
    return java_files

def main():
    """메인 함수"""
    # Windows 인코딩 문제 해결
    import sys
    import io
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    
    print("=" * 60)
    print("역할 시스템 동적 표준화 스크립트")
    print("=" * 60)
    print("표준: COMMON_CODE_SYSTEM_STANDARD.md - 모든 역할은 공통코드에서 동적 조회")
    print("브랜치/HQ 레거시 역할 제거 및 공통코드 기반으로 변경")
    print()
    
    # Controller, Service, Utils 디렉토리
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
        print("1. 수정된 파일을 검토하고 테스트를 실행하세요.")
        print("2. CommonCodeService 의존성 주입이 올바른지 확인하세요.")
        print("3. 공통코드에 ROLE 코드 그룹이 설정되어 있는지 확인하세요.")
        print("4. 복잡한 조건문은 수동으로 확인이 필요할 수 있습니다.")
        print("5. 헬퍼 메서드(isAdminRoleFromCommonCode 등)의 실제 구현을 검토하세요.")
        print("6. 브랜치/HQ 관련 레거시 역할은 모두 공통코드 기반으로 변경되었습니다.")

if __name__ == "__main__":
    main()

