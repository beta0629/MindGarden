#!/usr/bin/env python3
"""
API 경로 표준화 스크립트
/api/ 경로를 /api/v1/로 일괄 수정
"""

import os
import re
import sys

# 수정할 경로 패턴 (더 포괄적인 패턴)
PATH_PATTERNS = [
    # 특정 경로들
    (r'/api/auth/config/oauth2', '/api/v1/auth/config/oauth2'),
    (r'/api/auth/tenant/check-multi', '/api/v1/auth/tenant/check-multi'),
    (r'/api/permissions/my-permissions', '/api/v1/permissions/my-permissions'),
    # 일반 경로들 (이미 /api/v1/가 아닌 경우만)
    (r'/api/system-notifications(?!.*v1)', '/api/v1/system-notifications'),
    (r'/api/consultation-messages(?!.*v1)', '/api/v1/consultation-messages'),
    # 더 포괄적인 패턴: /api/로 시작하지만 /api/v1/가 아닌 경우
    (r"(['\"`])(/api/)(?!v1/)(auth|permissions|system-notifications|consultation-messages)", r'\1/api/v1/\3'),
]

# 제외할 파일 (백업 파일 등)
EXCLUDE_PATTERNS = [
    '.backup.',
    '.bak',
    'node_modules',
    '.git',
]

def should_exclude_file(filepath):
    """파일이 제외 대상인지 확인"""
    for pattern in EXCLUDE_PATTERNS:
        if pattern in filepath:
            return True
    return False

def fix_api_paths_in_file(filepath):
    """파일 내 API 경로 수정"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        modified = False
        
        # 특정 경로들을 먼저 수정
        specific_patterns = [
            (r'/api/auth/config/oauth2', '/api/v1/auth/config/oauth2'),
            (r'/api/auth/tenant/check-multi', '/api/v1/auth/tenant/check-multi'),
            (r'/api/permissions/my-permissions', '/api/v1/permissions/my-permissions'),
        ]
        
        for pattern, replacement in specific_patterns:
            # 문자열 리터럴 내의 경로만 수정
            new_content = re.sub(
                rf"(['\"`])({re.escape(pattern)})(['\"`])",
                rf'\1{replacement}\3',
                content
            )
            
            # 백틱 템플릿 리터럴 내의 경로도 수정
            new_content = re.sub(
                rf"`([^`]*?)({re.escape(pattern)})([^`]*?)`",
                lambda m: m.group(0).replace(pattern, replacement),
                new_content
            )
            
            if new_content != content:
                content = new_content
                modified = True
        
        # 일반 경로들 수정 (이미 /api/v1/가 아닌 경우만)
        general_patterns = [
            (r'/api/system-notifications', '/api/v1/system-notifications'),
            (r'/api/consultation-messages', '/api/v1/consultation-messages'),
        ]
        
        for pattern, replacement in general_patterns:
            # /api/v1/가 이미 있는 경우는 제외
            if f'/api/v1{pattern[4:]}' in content:
                continue
            
            # 문자열 리터럴 내의 경로만 수정
            new_content = re.sub(
                rf"(['\"`])({re.escape(pattern)})(['\"`])",
                rf'\1{replacement}\3',
                content
            )
            
            # 백틱 템플릿 리터럴 내의 경로도 수정
            new_content = re.sub(
                rf"`([^`]*?)({re.escape(pattern)})([^`]*?)`",
                lambda m: m.group(0).replace(pattern, replacement),
                new_content
            )
            
            if new_content != content:
                content = new_content
                modified = True
        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    except Exception as e:
        print(f"Error ({filepath}): {e}")
        return False

def main():
    """메인 함수"""
    frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src')
    
    if not os.path.exists(frontend_dir):
        print(f"Error: Frontend directory not found: {frontend_dir}")
        sys.exit(1)
    
    modified_files = []
    
    # .js, .jsx 파일만 처리
    for root, dirs, files in os.walk(frontend_dir):
        # node_modules 등 제외
        dirs[:] = [d for d in dirs if not should_exclude_file(os.path.join(root, d))]
        
        for file in files:
            if not (file.endswith('.js') or file.endswith('.jsx')):
                continue
            
            filepath = os.path.join(root, file)
            
            if should_exclude_file(filepath):
                continue
            
            if fix_api_paths_in_file(filepath):
                modified_files.append(filepath)
    
    print(f"Fixed {len(modified_files)} files")
    if modified_files:
        print("\nModified files:")
        for filepath in modified_files[:20]:  # 최대 20개만 표시
            rel_path = os.path.relpath(filepath, frontend_dir)
            print(f"  - {rel_path}")
        if len(modified_files) > 20:
            print(f"  ... and {len(modified_files) - 20} more files")

if __name__ == '__main__':
    main()

