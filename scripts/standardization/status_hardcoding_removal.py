#!/usr/bin/env python3
"""
상태값 하드코딩 제거 스크립트
표준화 2025-12-05: 하드코딩된 상태값을 공통코드 시스템으로 변경

작업 내용:
1. 하드코딩된 상태값 검색 (예: 'PENDING', 'ACTIVE', 'COMPLETED' 등)
2. 공통코드 시스템 사용 제안 주석 추가
3. CommonCodeService를 통한 동적 조회로 변경 제안
"""

import os
import re
import sys
from pathlib import Path

# 작업 대상 디렉토리
FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend" / "src"
BACKEND_DIR = Path(__file__).parent.parent.parent / "src" / "main" / "java"

# 제외할 파일/디렉토리
EXCLUDE_PATTERNS = [
    "node_modules",
    ".git",
    "build",
    "dist",
    "__pycache__",
    "*.pyc",
    "*.backup",
    "*_backup.js",
    "*_backup.jsx",
    "CommonCodeService",  # 공통코드 서비스 파일은 제외
    "commonCodeApi.js",   # 공통코드 API 파일은 제외
]

# 일반적인 상태값 패턴
STATUS_PATTERNS = [
    (r'\bPENDING\b', 'PENDING'),
    (r'\bACTIVE\b', 'ACTIVE'),
    (r'\bINACTIVE\b', 'INACTIVE'),
    (r'\bCOMPLETED\b', 'COMPLETED'),
    (r'\bCANCELLED\b', 'CANCELLED'),
    (r'\bAPPROVED\b', 'APPROVED'),
    (r'\bREJECTED\b', 'REJECTED'),
    (r'\bBOOKED\b', 'BOOKED'),
    (r'\bCONFIRMED\b', 'CONFIRMED'),
    (r'\bIN_PROGRESS\b', 'IN_PROGRESS'),
    (r'\bDELETED\b', 'DELETED'),
    (r'\bSUSPENDED\b', 'SUSPENDED'),
    (r'\bCLOSED\b', 'CLOSED'),
    (r'\bOPEN\b', 'OPEN'),
    (r'\bLOCKED\b', 'LOCKED'),
    (r'\bUNLOCKED\b', 'UNLOCKED'),
]

# Java enum 패턴
JAVA_ENUM_PATTERNS = [
    (r'\.(PENDING|ACTIVE|INACTIVE|COMPLETED|CANCELLED|APPROVED|REJECTED|BOOKED|CONFIRMED|IN_PROGRESS|DELETED|SUSPENDED|CLOSED|OPEN|LOCKED|UNLOCKED)\b', 'enum'),
]

def should_exclude_file(file_path):
    """파일이 제외 대상인지 확인"""
    file_str = str(file_path)
    for pattern in EXCLUDE_PATTERNS:
        if pattern in file_str:
            return True
    return False

def process_js_file(file_path):
    """JavaScript 파일 처리"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        modified = False
        lines = content.split('\n')
        new_lines = []
        
        for i, line in enumerate(lines):
            original_line = line
            new_line = line
            
            # 이미 주석 처리된 경우 스킵
            if '표준화 2025-12-05' in line or '공통코드' in line:
                continue
            
            # 주석 처리된 라인 스킵
            if line.strip().startswith('//') or line.strip().startswith('/*'):
                continue
            
            # 상태값 패턴 검색
            for pattern, status_name in STATUS_PATTERNS:
                if re.search(pattern, line):
                    # 문자열 리터럴인 경우만 처리
                    if re.search(rf'["\']{status_name}["\']', line) or re.search(rf'\b{status_name}\b', line):
                        indent = len(line) - len(line.lstrip())
                        comment = f"{' ' * indent}// ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용\n"
                        new_line = comment + new_line
                        modified = True
                        break
            
            new_lines.append(new_line)
        
        if modified:
            new_content = '\n'.join(new_lines)
            # 백업 파일 생성
            backup_path = file_path.with_suffix(file_path.suffix + '.backup')
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(original_content)
            
            # 원본 파일 수정
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            return True
        
        return False
    
    except Exception as e:
        print(f"[ERROR] 오류 발생 ({file_path}): {e}")
        return False

def process_java_file(file_path):
    """Java 파일 처리"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        modified = False
        lines = content.split('\n')
        new_lines = []
        
        for i, line in enumerate(lines):
            original_line = line
            new_line = line
            
            # 이미 주석 처리된 경우 스킵
            if '표준화 2025-12-05' in line or '공통코드' in line:
                continue
            
            # 주석 처리된 라인 스킵
            if line.strip().startswith('//') or line.strip().startswith('/*'):
                continue
            
            # enum 사용 패턴 검색
            for pattern, pattern_type in JAVA_ENUM_PATTERNS:
                if re.search(pattern, line):
                    indent = len(line) - len(line.lstrip())
                    comment = f"{' ' * indent}// ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용\n"
                    new_line = comment + new_line
                    modified = True
                    break
            
            new_lines.append(new_line)
        
        if modified:
            new_content = '\n'.join(new_lines)
            # 백업 파일 생성
            backup_path = file_path.with_suffix(file_path.suffix + '.backup')
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(original_content)
            
            # 원본 파일 수정
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            return True
        
        return False
    
    except Exception as e:
        print(f"[ERROR] 오류 발생 ({file_path}): {e}")
        return False

def main():
    """메인 함수"""
    # Windows 호환성을 위한 인코딩 설정
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    
    print("[START] 상태값 하드코딩 제거 스크립트 시작")
    
    modified_count = 0
    
    # Frontend 파일 처리
    if FRONTEND_DIR.exists():
        print(f"[INFO] Frontend 작업 디렉토리: {FRONTEND_DIR}")
        js_files = []
        for ext in ['*.js', '*.jsx', '*.ts', '*.tsx']:
            js_files.extend(FRONTEND_DIR.rglob(ext))
        
        js_files = [f for f in js_files if not should_exclude_file(f)]
        print(f"[INFO] Frontend 파일 수: {len(js_files)}")
        
        for file_path in js_files:
            if process_js_file(file_path):
                modified_count += 1
                print(f"[MODIFIED] {file_path.relative_to(FRONTEND_DIR)}")
    
    # Backend 파일 처리
    if BACKEND_DIR.exists():
        print(f"[INFO] Backend 작업 디렉토리: {BACKEND_DIR}")
        java_files = list(BACKEND_DIR.rglob('*.java'))
        java_files = [f for f in java_files if not should_exclude_file(f)]
        print(f"[INFO] Backend 파일 수: {len(java_files)}")
        
        for file_path in java_files:
            if process_java_file(file_path):
                modified_count += 1
                print(f"[MODIFIED] {file_path.relative_to(BACKEND_DIR)}")
    
    print(f"\n[COMPLETE] 완료: {modified_count}개 파일 수정됨")
    print("[NOTE] 백업 파일은 .backup 확장자로 저장되었습니다.")
    print("[NOTE] 주석을 확인하고 실제 공통코드 시스템으로 변경하세요.")

if __name__ == "__main__":
    main()

