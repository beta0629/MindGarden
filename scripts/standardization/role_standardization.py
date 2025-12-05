#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
역할 시스템 표준화 스크립트
HQ 및 브랜치 관련 레거시 역할을 표준 역할로 대체

표준 관리자 역할: ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER
제거된 레거시 역할: HQ_*, BRANCH_* 관련 모든 역할
"""

import os
import re
import sys
from pathlib import Path

# 프로젝트 루트 디렉토리
PROJECT_ROOT = Path(__file__).parent.parent.parent
JAVA_SRC = PROJECT_ROOT / "src" / "main" / "java" / "com" / "coresolution" / "consultation"

# 레거시 역할 매핑 (표준 역할로 대체)
LEGACY_ROLE_MAPPINGS = {
    # 본사 관련 역할 → ADMIN
    "HQ_MASTER": "ADMIN",
    "HQ_ADMIN": "ADMIN",
    "SUPER_HQ_ADMIN": "ADMIN",
    "HQ_SUPER_ADMIN": "ADMIN",
    # 브랜치 관련 역할 → ADMIN (관리자) 또는 STAFF (사무원)
    "BRANCH_SUPER_ADMIN": "ADMIN",
    "BRANCH_ADMIN": "ADMIN",
    "BRANCH_MANAGER": "STAFF",  # 지점장은 사무원으로
}

# 레거시 역할 체크 메서드 → 표준 메서드로 대체
LEGACY_METHOD_MAPPINGS = {
    # 본사 관련 메서드
    "isHeadquartersAdmin()": "isAdmin()",
    "isHqMaster()": "isAdmin()",
    "isHqAdmin()": "isAdmin()",
    "isSuperAdmin()": "isAdmin()",
    # 브랜치 관련 메서드
    "isBranchAdmin()": "isAdmin()",
    "isBranchSuperAdmin()": "isAdmin()",
    "isBranchManager()": "isAdmin()",  # 또는 STAFF 체크 필요 시 별도 처리
    "hasBranchManagementAccess()": "isAdmin()",
    # AdminRoleUtils 메서드
    "AdminRoleUtils.isHqMaster": "AdminRoleUtils.isAdmin",
    "AdminRoleUtils.isHqAdmin": "AdminRoleUtils.isAdmin",
    "AdminRoleUtils.isBranchAdmin": "AdminRoleUtils.isAdmin",
    "AdminRoleUtils.isBranchSuperAdmin": "AdminRoleUtils.isAdmin",
}

# 레거시 역할 직접 비교 → 표준 역할로 대체
LEGACY_ROLE_COMPARISONS = {
    r'==\s*UserRole\.HQ_MASTER': '== UserRole.ADMIN',
    r'==\s*UserRole\.HQ_ADMIN': '== UserRole.ADMIN',
    r'==\s*UserRole\.SUPER_HQ_ADMIN': '== UserRole.ADMIN',
    r'==\s*UserRole\.HQ_SUPER_ADMIN': '== UserRole.ADMIN',
    r'==\s*UserRole\.BRANCH_SUPER_ADMIN': '== UserRole.ADMIN',
    r'==\s*UserRole\.BRANCH_ADMIN': '== UserRole.ADMIN',
    r'==\s*UserRole\.BRANCH_MANAGER': '== UserRole.STAFF',
    r'\.equals\(UserRole\.HQ_MASTER\)': '.equals(UserRole.ADMIN)',
    r'\.equals\(UserRole\.HQ_ADMIN\)': '.equals(UserRole.ADMIN)',
    r'\.equals\(UserRole\.SUPER_HQ_ADMIN\)': '.equals(UserRole.ADMIN)',
    r'\.equals\(UserRole\.BRANCH_SUPER_ADMIN\)': '.equals(UserRole.ADMIN)',
    r'\.equals\(UserRole\.BRANCH_ADMIN\)': '.equals(UserRole.ADMIN)',
    r'\.equals\(UserRole\.BRANCH_MANAGER\)': '.equals(UserRole.STAFF)',
}

# 레거시 역할 문자열 비교 → 표준 역할로 대체
LEGACY_STRING_COMPARISONS = {
    r'"HQ_MASTER"': '"ADMIN"',
    r'"HQ_ADMIN"': '"ADMIN"',
    r'"SUPER_HQ_ADMIN"': '"ADMIN"',
    r'"HQ_SUPER_ADMIN"': '"ADMIN"',
    r'"BRANCH_SUPER_ADMIN"': '"ADMIN"',
    r'"BRANCH_ADMIN"': '"ADMIN"',
    r'"BRANCH_MANAGER"': '"STAFF"',
    r"'HQ_MASTER'": "'ADMIN'",
    r"'HQ_ADMIN'": "'ADMIN'",
    r"'SUPER_HQ_ADMIN'": "'ADMIN'",
    r"'BRANCH_SUPER_ADMIN'": "'ADMIN'",
    r"'BRANCH_ADMIN'": "'ADMIN'",
    r"'BRANCH_MANAGER'": "'STAFF'",
}

# 복합 조건 패턴 (여러 레거시 역할 체크)
COMPLEX_PATTERNS = [
    # HQ_MASTER || BRANCH_SUPER_ADMIN → isAdmin()
    (r'user\.getRole\(\)\s*==\s*UserRole\.HQ_MASTER\s*\|\|\s*user\.getRole\(\)\s*==\s*UserRole\.BRANCH_SUPER_ADMIN',
     'user.getRole().isAdmin()'),
    (r'userRole\s*==\s*UserRole\.HQ_MASTER\s*\|\|\s*userRole\s*==\s*UserRole\.BRANCH_SUPER_ADMIN',
     'userRole.isAdmin()'),
    # HQ_ADMIN || SUPER_HQ_ADMIN → isAdmin()
    (r'user\.getRole\(\)\s*==\s*UserRole\.HQ_ADMIN\s*\|\|\s*user\.getRole\(\)\s*==\s*UserRole\.SUPER_HQ_ADMIN',
     'user.getRole().isAdmin()'),
    # BRANCH_SUPER_ADMIN || ADMIN → isAdmin()
    (r'user\.getRole\(\)\s*==\s*UserRole\.BRANCH_SUPER_ADMIN\s*\|\|\s*user\.getRole\(\)\s*==\s*UserRole\.ADMIN',
     'user.getRole().isAdmin()'),
]

def process_file(file_path):
    """파일을 읽어서 레거시 역할을 표준 역할로 대체"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        print(f"⚠️  인코딩 오류: {file_path}")
        return False
    
    original_content = content
    modified = False
    
    # 1. 복합 조건 패턴 처리
    for pattern, replacement in COMPLEX_PATTERNS:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True
    
    # 2. 레거시 역할 직접 비교 대체
    for pattern, replacement in LEGACY_ROLE_COMPARISONS.items():
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True
    
    # 3. 레거시 역할 문자열 비교 대체
    for pattern, replacement in LEGACY_STRING_COMPARISONS.items():
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True
    
    # 4. 레거시 메서드 호출 대체
    for old_method, new_method in LEGACY_METHOD_MAPPINGS.items():
        # 메서드 호출 패턴
        if old_method in content:
            # UserRole.isHeadquartersAdmin() → UserRole.isAdmin()
            content = content.replace(f'UserRole.{old_method}', f'UserRole.{new_method}')
            # user.getRole().isHeadquartersAdmin() → user.getRole().isAdmin()
            content = content.replace(f'.{old_method}', f'.{new_method}')
            # AdminRoleUtils.isHqMaster(user) → AdminRoleUtils.isAdmin(user)
            if 'AdminRoleUtils' in old_method:
                old_utils_method = old_method.split('.')[-1]
                new_utils_method = new_method.split('.')[-1]
                content = content.replace(f'AdminRoleUtils.{old_utils_method}', f'AdminRoleUtils.{new_utils_method}')
            modified = True
    
    # 5. 레거시 역할 enum 값 사용 (UserRole.HQ_MASTER → UserRole.ADMIN)
    for legacy_role, standard_role in LEGACY_ROLE_MAPPINGS.items():
        # UserRole.HQ_MASTER → UserRole.ADMIN
        pattern = f'UserRole\\.{legacy_role}'
        replacement = f'UserRole.{standard_role}'
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True
    
    # 6. 주석 추가 (레거시 역할 사용 발견 시)
    if modified and not '표준화 2025-12-05' in content:
        # 파일 상단에 표준화 주석 추가 (이미 있으면 스킵)
        if 'package ' in content and '표준화 2025-12-05' not in content[:500]:
            # package 선언 다음에 주석 추가
            package_match = re.search(r'(package\s+[^;]+;)', content)
            if package_match:
                insert_pos = package_match.end()
                comment = '\n\n// 표준화 2025-12-05: 레거시 역할(HQ_*, BRANCH_*)을 표준 역할(ADMIN, STAFF)로 대체'
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
        dirs[:] = [d for d in dirs if d not in ['target', '.git', 'node_modules']]
        for file in files:
            if file.endswith('.java'):
                java_files.append(os.path.join(root, file))
    return java_files

def main():
    """메인 함수"""
    print("=" * 60)
    print("역할 시스템 표준화 스크립트")
    print("=" * 60)
    print()
    
    # Controller와 Service 디렉토리
    controller_dir = JAVA_SRC / "controller"
    service_dir = JAVA_SRC / "service"
    util_dir = JAVA_SRC / "util"
    utils_dir = JAVA_SRC / "utils"
    
    # UserRole.java는 별도 처리
    user_role_file = JAVA_SRC / "constant" / "UserRole.java"
    
    all_files = []
    
    # Controller 파일
    if controller_dir.exists():
        all_files.extend(find_java_files(controller_dir))
    
    # Service 파일
    if service_dir.exists():
        all_files.extend(find_java_files(service_dir))
    
    # Util 파일
    if util_dir.exists():
        all_files.extend(find_java_files(util_dir))
    
    # Utils 파일
    if utils_dir.exists():
        all_files.extend(find_java_files(utils_dir))
    
    # UserRole.java 추가
    if user_role_file.exists():
        all_files.append(str(user_role_file))
    
    print(f"총 {len(all_files)}개 Java 파일 발견")
    print()
    
    modified_count = 0
    error_count = 0
    
    for file_path in all_files:
        try:
            if process_file(file_path):
                print(f"✅ 수정: {file_path}")
                modified_count += 1
        except Exception as e:
            print(f"❌ 오류: {file_path}, {e}")
            error_count += 1
    
    print()
    print("=" * 60)
    print("작업 완료")
    print("=" * 60)
    print(f"수정된 파일: {modified_count}개")
    print(f"오류 발생: {error_count}개")
    print()
    
    if modified_count > 0:
        print("⚠️  주의: 수정된 파일을 검토하고 테스트를 실행하세요.")
        print("⚠️  일부 복잡한 조건문은 수동으로 확인이 필요할 수 있습니다.")

if __name__ == "__main__":
    main()

