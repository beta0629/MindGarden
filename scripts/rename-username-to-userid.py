#!/usr/bin/env python3
"""
username 필드를 userId로 일괄 변환 스크립트
표준화 2025-12-08: username -> userId 필드명 변경

주의사항:
- 데이터베이스 컬럼명(username)은 유지 (기존 데이터 호환)
- Java 필드명, 메서드명, 변수명만 변경
- 프론트엔드 변수명도 변경
"""

import os
import re
import sys
from pathlib import Path

# 변환 규칙
REPLACEMENTS = [
    # Java 필드/메서드
    (r'\busername\b', 'userId'),  # 필드명, 변수명
    (r'\bUsername\b', 'UserId'),  # 클래스명, 메서드명
    (r'\bUSERNAME\b', 'USER_ID'),  # 상수명
    (r'getUsername\(\)', 'getUserId()'),  # getter
    (r'setUsername\(', 'setUserId('),  # setter
    (r'\.username\b', '.userId'),  # 필드 접근
    (r'request\.username', 'request.userId'),
    (r'formData\.username', 'formData.userId'),
    (r'consultant\.username', 'consultant.userId'),
    (r'client\.username', 'client.userId'),
    (r'user\.username', 'user.userId'),
    (r'mapping\.username', 'mapping.userId'),
    
    # Repository 메서드
    (r'findByUsername\(', 'findByUserId('),
    (r'findByTenantIdAndUsername\(', 'findByTenantIdAndUserId('),
    (r'findByUsernameAndIsActive\(', 'findByUserIdAndIsActive('),
    (r'findByTenantIdAndUsernameAndIsActive\(', 'findByTenantIdAndUserIdAndIsActive('),
    (r'existsByUsername\(', 'existsByUserId('),
    (r'existsByTenantIdAndUsername\(', 'existsByTenantIdAndUserId('),
    
    # Service 메서드
    (r'generateUniqueUsername\(', 'generateUniqueUserId('),
    (r'generateUsernameFromEmail\(', 'generateUserIdFromEmail('),
    (r'generateUsernameFromName\(', 'generateUserIdFromName('),
    
    # DTO 필드
    (r'private String username', 'private String userId'),
    (r'username:', 'userId:'),
    (r'"username"', '"userId"'),
    (r"'username'", "'userId'"),
    
    # JSON 키
    (r'"username":', '"userId":'),
    (r"'username':", "'userId':"),
    
    # 주석/문자열
    (r'사용자명', '사용자 ID'),
    (r'username 필드', 'userId 필드'),
    (r'username은', 'userId는'),
    (r'username이', 'userId가'),
    (r'username을', 'userId를'),
    (r'username의', 'userId의'),
    (r'username으로', 'userId로'),
    (r'username으로서', 'userId로서'),
]

# 제외할 파일/디렉토리
EXCLUDE_PATTERNS = [
    'node_modules',
    '.git',
    'target',
    'build',
    'dist',
    '.idea',
    '.vscode',
    '__pycache__',
    '*.pyc',
    '*.class',
    '*.jar',
    '*.log',
    '*.backup.*',  # 백업 파일 제외
]

# 변환할 파일 확장자
TARGET_EXTENSIONS = ['.java', '.js', '.jsx', '.ts', '.tsx', '.json']

def should_exclude(file_path):
    """파일이 제외 목록에 있는지 확인"""
    path_str = str(file_path)
    for pattern in EXCLUDE_PATTERNS:
        if pattern in path_str:
            return True
    return False

def convert_file(file_path):
    """파일 내용 변환"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 모든 변환 규칙 적용
        for pattern, replacement in REPLACEMENTS:
            content = re.sub(pattern, replacement, content)
        
        # 변경사항이 있으면 파일 저장
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"❌ 오류 발생 ({file_path}): {e}")
        return False

def main():
    """메인 함수"""
    # 프로젝트 루트 디렉토리
    project_root = Path(__file__).parent.parent
    
    # 변환할 디렉토리
    target_dirs = [
        project_root / 'src' / 'main' / 'java',
        project_root / 'frontend' / 'src',
    ]
    
    converted_files = []
    error_files = []
    
    print("🔄 username -> userId 일괄 변환 시작...")
    print(f"📁 프로젝트 루트: {project_root}")
    print()
    
    for target_dir in target_dirs:
        if not target_dir.exists():
            print(f"⚠️  디렉토리가 없습니다: {target_dir}")
            continue
        
        print(f"📂 검색 중: {target_dir}")
        
        # 모든 파일 검색
        for file_path in target_dir.rglob('*'):
            if should_exclude(file_path):
                continue
            
            if file_path.is_file() and file_path.suffix in TARGET_EXTENSIONS:
                try:
                    if convert_file(file_path):
                        converted_files.append(file_path)
                        print(f"  ✅ 변환: {file_path.relative_to(project_root)}")
                except Exception as e:
                    error_files.append((file_path, str(e)))
                    print(f"  ❌ 오류: {file_path.relative_to(project_root)} - {e}")
    
    print()
    print("=" * 60)
    print(f"✅ 변환 완료: {len(converted_files)}개 파일")
    if error_files:
        print(f"❌ 오류 발생: {len(error_files)}개 파일")
        for file_path, error in error_files:
            print(f"  - {file_path}: {error}")
    print("=" * 60)
    
    if converted_files:
        print("\n변환된 파일 목록:")
        for file_path in converted_files[:20]:  # 최대 20개만 표시
            print(f"  - {file_path.relative_to(project_root)}")
        if len(converted_files) > 20:
            print(f"  ... 외 {len(converted_files) - 20}개 파일")

if __name__ == '__main__':
    main()

