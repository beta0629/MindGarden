#!/usr/bin/env python3
"""
브랜치 코드 제거 자동화 스크립트 (간소화 버전)
파라미터와 필드에 @Deprecated 추가

작성일: 2025-12-07
"""

import os
import re
import sys
from pathlib import Path

def add_deprecated_to_parameter(file_path: Path, line_num: int, line: str) -> bool:
    """파라미터에 @Deprecated 추가"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        line_idx = line_num - 1
        if line_idx >= len(lines):
            return False
        
        # 이미 @Deprecated가 있으면 스킵
        if '@Deprecated' in lines[line_idx] or 'Deprecated' in lines[line_idx]:
            return False
        
        # 메서드 시작 부분 찾기
        method_start = line_idx
        while method_start > 0:
            current_line = lines[method_start].strip()
            if current_line.startswith(('public', 'private', 'protected')):
                # 주석 블록이 있는지 확인
                if method_start > 0 and lines[method_start - 1].strip().startswith('*/'):
                    method_start -= 1
                break
            method_start -= 1
        
        if method_start < 0:
            return False
        
        # @Deprecated 주석 추가
        indent = len(lines[method_start]) - len(lines[method_start].lstrip())
        
        # 이미 주석이 있으면 추가만
        if method_start > 0 and '*/' in lines[method_start - 1]:
            # 기존 주석에 추가
            comment_end = method_start - 1
            if '*/' in lines[comment_end]:
                lines[comment_end] = lines[comment_end].replace(
                    '*/',
                    ' * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용\n */'
                )
        else:
            # 새로운 주석 블록 추가
            deprecation = ' ' * indent + '/**\n'
            deprecation += ' ' * indent + ' * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용\n'
            deprecation += ' ' * indent + ' */\n'
            deprecation += ' ' * indent + '@Deprecated\n'
            lines.insert(method_start, deprecation.rstrip())
        
        # 메서드 본문에 경고 로직 추가
        body_start = line_idx + (5 if method_start < line_idx else 0)
        while body_start < len(lines) and '{' not in lines[body_start]:
            body_start += 1
        
        if body_start < len(lines):
            # 다음 줄의 들여쓰기 확인
            next_line_idx = body_start + 1
            if next_line_idx < len(lines):
                indent = len(lines[next_line_idx]) - len(lines[next_line_idx].lstrip())
                warning = ' ' * indent + '// 표준화 2025-12-07: branchCode 무시\n'
                
                # branchCode 변수명 추출
                var_match = re.search(r'\b(branchCode|branchId)\b', line)
                if var_match:
                    var_name = var_match.group(1)
                    warning += ' ' * indent + f'if ({var_name} != null) {{\n'
                    warning += ' ' * indent + f'    log.warn("Deprecated 파라미터: {var_name}는 더 이상 사용하지 않음");\n'
                    warning += ' ' * indent + '}\n'
                    lines.insert(next_line_idx, warning.rstrip())
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        return True
    except Exception as e:
        print(f"[WARN] {file_path}:{line_num} - {e}")
        return False

def add_deprecated_to_field(file_path: Path, line_num: int, line: str) -> bool:
    """필드에 @Deprecated 추가"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        line_idx = line_num - 1
        if line_idx >= len(lines):
            return False
        
        # 이미 @Deprecated가 있으면 스킵
        if '@Deprecated' in lines[line_idx]:
            return False
        
        # 필드 위에 주석 찾기
        comment_start = line_idx - 1
        while comment_start >= 0:
            stripped = lines[comment_start].strip()
            if stripped.startswith('*') or stripped.startswith('/**'):
                comment_start -= 1
            elif stripped.startswith('//'):
                break
            else:
                break
        
        indent = len(lines[line_idx]) - len(lines[line_idx].lstrip())
        
        # 주석이 있으면 주석에 추가
        if comment_start >= 0 and comment_start < line_idx - 1:
            for i in range(comment_start, line_idx):
                if '*/' in lines[i]:
                    lines[i] = lines[i].replace(
                        '*/',
                        ' * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨\n */'
                    )
                    break
        else:
            # 새로운 주석 추가
            deprecation = ' ' * indent + '/**\n'
            deprecation += ' ' * indent + ' * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨\n'
            deprecation += ' ' * indent + ' */\n'
            deprecation += ' ' * indent + '@Deprecated\n'
            lines.insert(line_idx, deprecation.rstrip())
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        return True
    except Exception as e:
        print(f"[WARN] {file_path}:{line_num} - {e}")
        return False

def process_file(file_path: Path, dry_run: bool = False) -> int:
    """파일 처리"""
    patterns = [
        (r'\b(branchCode|branchId)\s+[a-zA-Z]', 'parameter'),
        (r'private\s+(String|Long|Integer)\s+(branchCode|branchId)', 'field'),
        (r'@Column.*branch_code', 'field'),
        (r'@Column.*branch_id', 'field'),
    ]
    
    modified = 0
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        for line_num, line in enumerate(lines, 1):
            # 주석이나 이미 deprecated 처리된 것은 스킵
            stripped = line.strip()
            if stripped.startswith('//') or stripped.startswith('*') or '@Deprecated' in line:
                continue
            
            for pattern, usage_type in patterns:
                if re.search(pattern, line):
                    if not dry_run:
                        if usage_type == 'parameter':
                            if add_deprecated_to_parameter(file_path, line_num, line):
                                modified += 1
                        elif usage_type == 'field':
                            if add_deprecated_to_field(file_path, line_num, line):
                                modified += 1
                    else:
                        print(f"  [DRY RUN] {file_path}:{line_num} - {usage_type}: {line.strip()[:80]}")
                    break
        
        return modified
    except Exception as e:
        print(f"[ERROR] {file_path} - {e}")
        return 0

def main():
    if len(sys.argv) < 2:
        print("사용법: python remove_branch_code_simple.py <프로젝트_루트> [--dry-run]")
        sys.exit(1)
    
    root_dir = Path(sys.argv[1])
    dry_run = '--dry-run' in sys.argv
    auto_yes = '--yes' in sys.argv
    
    if not root_dir.exists():
        print(f"[ERROR] 디렉토리를 찾을 수 없습니다: {root_dir}")
        sys.exit(1)
    
    print("=" * 80)
    print("브랜치 코드 제거 자동화 스크립트 (간소화 버전)")
    print("=" * 80)
    
    # Java 파일 찾기
    java_files = []
    for java_file in root_dir.rglob("*.java"):
        if ".backup" not in str(java_file) and "target" not in str(java_file):
            java_files.append(java_file)
    
    print(f"[INFO] {len(java_files)}개 Java 파일 발견")
    
    if not dry_run:
        if not auto_yes:
            response = input("\n[WARN] 실제 파일을 수정하시겠습니까? (yes/no): ")
            if response.lower() != 'yes':
                print("취소되었습니다.")
                return
        else:
            print("\n[AUTO] 자동 모드: 파일 수정 진행...")
    
    total_modified = 0
    for java_file in java_files:
        modified = process_file(java_file, dry_run)
        if modified > 0:
            total_modified += modified
            print(f"[OK] {java_file.relative_to(root_dir)} - {modified}개 수정")
    
    print(f"\n[COMPLETE] 총 {total_modified}개 수정 완료")

if __name__ == "__main__":
    main()

