#!/usr/bin/env python3
"""
Frontend 브랜치 코드 제거 스크립트
표준화 2025-12-05: 브랜치 개념 제거에 따른 Frontend 코드 정리

작업 내용:
1. branchCode, branch_code, branchId 사용을 주석 처리 또는 제거
2. 브랜치 관련 함수 호출에 Deprecated 주석 추가
3. 테넌트 기반 시스템으로 전환 안내 주석 추가
"""

import os
import re
import sys
from pathlib import Path

# 작업 대상 디렉토리
FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend" / "src"

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
    "*_backup.jsx"
]

# 브랜치 관련 패턴
BRANCH_PATTERNS = [
    (r'\bbranchCode\b', 'branchCode'),
    (r'\bbranch_code\b', 'branch_code'),
    (r'\bbranchId\b', 'branchId'),
    (r'\bBRANCH\b', 'BRANCH'),
    (r'getBranchNameByCode', 'getBranchNameByCode'),
    (r'normalizeBranchData', 'normalizeBranchData'),
    (r'normalizeBranchList', 'normalizeBranchList'),
    (r'isValidBranchCode', 'isValidBranchCode'),
    (r'getBranchTypeName', 'getBranchTypeName'),
    (r'getBranchStatusName', 'getBranchStatusName'),
]

def should_exclude_file(file_path):
    """파일이 제외 대상인지 확인"""
    file_str = str(file_path)
    for pattern in EXCLUDE_PATTERNS:
        if pattern in file_str:
            return True
    return False

def add_deprecated_comment(content, pattern_name, line_num):
    """Deprecated 주석 추가"""
    deprecated_comment = f"    // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념이 제거되었습니다. 테넌트 기반 시스템을 사용하세요.\n"
    return deprecated_comment

def process_file(file_path):
    """파일 처리"""
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
            
            # 브랜치 관련 패턴 검색
            for pattern, pattern_name in BRANCH_PATTERNS:
                if re.search(pattern, line):
                    # 이미 주석 처리된 경우 스킵
                    if '표준화 2025-12-05' in line or 'Deprecated' in line:
                        continue
                    
                    # import 문인 경우 주석 추가
                    if 'import' in line and pattern_name in line:
                        indent = len(line) - len(line.lstrip())
                        new_line = f"{' ' * indent}// ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거\n{line}"
                        modified = True
                    
                    # 변수 선언인 경우 주석 추가
                    elif re.search(rf'\b{pattern_name}\s*[:=]', line):
                        indent = len(line) - len(line.lstrip())
                        new_line = f"{' ' * indent}// ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거\n{line}"
                        modified = True
                    
                    # 함수 호출인 경우 주석 추가
                    elif re.search(rf'{pattern_name}\s*\(', line):
                        indent = len(line) - len(line.lstrip())
                        new_line = f"{' ' * indent}// ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거\n{line}"
                        modified = True
            
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
    
    print("[START] Frontend 브랜치 코드 제거 스크립트 시작")
    print(f"[INFO] 작업 디렉토리: {FRONTEND_DIR}")
    
    if not FRONTEND_DIR.exists():
        print(f"[ERROR] 디렉토리가 존재하지 않습니다: {FRONTEND_DIR}")
        sys.exit(1)
    
    # JavaScript/JSX 파일 찾기
    js_files = []
    for ext in ['*.js', '*.jsx', '*.ts', '*.tsx']:
        js_files.extend(FRONTEND_DIR.rglob(ext))
    
    # 제외 파일 필터링
    js_files = [f for f in js_files if not should_exclude_file(f)]
    
    print(f"[INFO] 발견된 파일 수: {len(js_files)}")
    
    # 파일 처리
    modified_count = 0
    for file_path in js_files:
        if process_file(file_path):
            modified_count += 1
            print(f"[MODIFIED] {file_path.relative_to(FRONTEND_DIR)}")
    
    print(f"\n[COMPLETE] 완료: {modified_count}개 파일 수정됨")
    print("[NOTE] 백업 파일은 .backup 확장자로 저장되었습니다.")

if __name__ == "__main__":
    main()

