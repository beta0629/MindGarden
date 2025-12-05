#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
레거시 역할 일괄 수정 스크립트
"""

import os
import re
import sys
from pathlib import Path

# 인코딩 설정
if sys.platform == 'win32':
    sys.stdout = open(sys.stdout.buffer.fileno(), 'w', encoding='utf-8', errors='replace')
    sys.stderr = open(sys.stderr.buffer.fileno(), 'w', encoding='utf-8', errors='replace')

def fix_legacy_roles_in_file(file_path):
    """파일에서 레거시 역할 제거"""
    try:
        file_path_str = str(file_path)
        with open(file_path_str, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # UserRole.HQ_MASTER → UserRole.ADMIN
        content = re.sub(
            r'UserRole\.HQ_MASTER',
            'UserRole.ADMIN // 표준화 2025-12-05: HQ_MASTER → ADMIN으로 통합',
            content
        )
        
        # UserRole.SUPER_HQ_ADMIN → UserRole.ADMIN
        content = re.sub(
            r'UserRole\.SUPER_HQ_ADMIN',
            'UserRole.ADMIN // 표준화 2025-12-05: SUPER_HQ_ADMIN → ADMIN으로 통합',
            content
        )
        
        # UserRole.HQ_ADMIN → UserRole.ADMIN
        content = re.sub(
            r'UserRole\.HQ_ADMIN',
            'UserRole.ADMIN // 표준화 2025-12-05: HQ_ADMIN → ADMIN으로 통합',
            content
        )
        
        # UserRole.HQ_SUPER_ADMIN → UserRole.ADMIN
        content = re.sub(
            r'UserRole\.HQ_SUPER_ADMIN',
            'UserRole.ADMIN // 표준화 2025-12-05: HQ_SUPER_ADMIN → ADMIN으로 통합',
            content
        )
        
        # UserRole.BRANCH_SUPER_ADMIN → UserRole.ADMIN
        content = re.sub(
            r'UserRole\.BRANCH_SUPER_ADMIN',
            'UserRole.ADMIN // 표준화 2025-12-05: BRANCH_SUPER_ADMIN → ADMIN으로 통합',
            content
        )
        
        # UserRole.BRANCH_ADMIN → UserRole.ADMIN
        content = re.sub(
            r'UserRole\.BRANCH_ADMIN',
            'UserRole.ADMIN // 표준화 2025-12-05: BRANCH_ADMIN → ADMIN으로 통합',
            content
        )
        
        # UserRole.BRANCH_MANAGER → UserRole.STAFF
        content = re.sub(
            r'UserRole\.BRANCH_MANAGER',
            'UserRole.STAFF // 표준화 2025-12-05: BRANCH_MANAGER → STAFF로 통합',
            content
        )
        
        # 변경사항이 있으면 파일 저장
        if content != original_content:
            with open(file_path_str, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"❌ 오류 발생 ({file_path_str}): {e}", file=sys.stderr)
        return False

def main():
    """메인 함수"""
    base_dir = Path(__file__).parent.parent
    
    # 수정할 파일 목록
    target_files = [
        'src/main/java/com/coresolution/consultation/constant/PermissionMatrix.java',
        'src/main/java/com/coresolution/core/service/impl/AdminRoleUtilsMetaAdapter.java',
        'src/main/java/com/coresolution/consultation/service/impl/UserProfileServiceImpl.java',
        'src/main/java/com/coresolution/consultation/controller/SuperAdminController.java',
        'src/test/java/com/coresolution/core/context/SuperAdminBypassTest.java',
    ]
    
    fixed_count = 0
    
    for rel_path in target_files:
        file_path = base_dir / rel_path
        if file_path.exists():
            print(f"수정 중: {rel_path}")
            if fix_legacy_roles_in_file(file_path):
                fixed_count += 1
                print(f"✅ 수정 완료: {rel_path}")
            else:
                print(f"ℹ️  변경사항 없음: {rel_path}")
        else:
            print(f"⚠️  파일 없음: {rel_path}")
    
    print(f"\n✅ 수정 완료: {fixed_count}개 파일")

if __name__ == '__main__':
    main()

