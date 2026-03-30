#!/usr/bin/env python3
"""
로그 출력에서 branchCode/branchId 제거 또는 주석 처리 스크립트

작성일: 2025-12-07
"""

import os
import re
import sys
from pathlib import Path

def fix_log_statements(file_path: Path) -> int:
    """로그 문에서 branchCode/branchId 제거 또는 주석 처리"""
    modified = 0
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 패턴 1: log.info("...", branchCode) 또는 log.info("...", branchCode, ...)
        # branchCode 파라미터를 제거하거나 주석 처리
        patterns = [
            # log.info("...", branchCode) -> log.info("...") 또는 주석 처리
            (r'(log\.(info|debug|warn|error)\("([^"]*)"[^)]*),\s*branchCode[^)]*\))', 
             r'// 표준화 2025-12-07: 브랜치 개념 제거됨\n            // \1'),
            
            # log.info("...", branchCode, ...) -> log.info("...", ...) (branchCode만 제거)
            (r'(log\.(info|debug|warn|error)\("([^"]*)"[^)]*),\s*branchCode\s*,', 
             r'\1 // branchCode 제거됨\n            '),
            
            # log.info("...", ..., branchCode) -> log.info("...", ...) (마지막 branchCode 제거)
            (r'(,\s*branchCode\s*\))', 
             r' // branchCode 제거됨\n            )'),
            
            # log.info("...", branchId) -> log.info("...") 또는 주석 처리
            (r'(log\.(info|debug|warn|error)\("([^"]*)"[^)]*),\s*branchId[^)]*\))', 
             r'// 표준화 2025-12-07: 브랜치 개념 제거됨\n            // \1'),
            
            # log.info("...", branchId, ...) -> log.info("...", ...) (branchId만 제거)
            (r'(log\.(info|debug|warn|error)\("([^"]*)"[^)]*),\s*branchId\s*,', 
             r'\1 // branchId 제거됨\n            '),
            
            # log.info("...", ..., branchId) -> log.info("...", ...) (마지막 branchId 제거)
            (r'(,\s*branchId\s*\))', 
             r' // branchId 제거됨\n            )'),
        ]
        
        for pattern, replacement in patterns:
            content = re.sub(pattern, replacement, content)
        
        # 패턴 2: log.info("... branchCode={}", branchCode) -> log.info("...") (포맷 문자열에서도 제거)
        content = re.sub(
            r'log\.(info|debug|warn|error)\("([^"]*)\{.*branchCode[^}]*\}[^"]*"\)',
            r'log.\1("\2") // 표준화 2025-12-07: branchCode 제거됨',
            content
        )
        
        content = re.sub(
            r'log\.(info|debug|warn|error)\("([^"]*)\{.*branchId[^}]*\}[^"]*"\)',
            r'log.\1("\2") // 표준화 2025-12-07: branchId 제거됨',
            content
        )
        
        # 패턴 3: log.info("...", branchCode, ...) -> log.info("...", ...) (중간에 있는 경우)
        # 더 정교한 패턴으로 처리
        lines = content.split('\n')
        new_lines = []
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # log 문에서 branchCode/branchId 파라미터 제거
            if re.search(r'log\.(info|debug|warn|error)', line) and ('branchCode' in line or 'branchId' in line):
                # 이미 주석 처리된 경우 스킵
                if line.strip().startswith('//'):
                    new_lines.append(line)
                    i += 1
                    continue
                
                # log.info("...", branchCode) 형태
                if re.search(r'log\.(info|debug|warn|error)\([^)]*branchCode[^)]*\)', line):
                    # branchCode 파라미터만 제거
                    line = re.sub(r',\s*branchCode\s*\)', ')', line)
                    line = re.sub(r'\(\s*branchCode\s*\)', '()', line)
                    line = re.sub(r'\(\s*"[^"]*",\s*branchCode\s*\)', r'("\1")', line)
                    if 'branchCode' in line:
                        # 주석 처리
                        line = '            // 표준화 2025-12-07: 브랜치 개념 제거됨\n            // ' + line.lstrip()
                    else:
                        line = line.rstrip() + ' // 표준화 2025-12-07: branchCode 제거됨'
                    modified += 1
                
                # log.info("...", branchId) 형태
                if re.search(r'log\.(info|debug|warn|error)\([^)]*branchId[^)]*\)', line):
                    # branchId 파라미터만 제거
                    line = re.sub(r',\s*branchId\s*\)', ')', line)
                    line = re.sub(r'\(\s*branchId\s*\)', '()', line)
                    line = re.sub(r'\(\s*"[^"]*",\s*branchId\s*\)', r'("\1")', line)
                    if 'branchId' in line:
                        # 주석 처리
                        line = '            // 표준화 2025-12-07: 브랜치 개념 제거됨\n            // ' + line.lstrip()
                    else:
                        line = line.rstrip() + ' // 표준화 2025-12-07: branchId 제거됨'
                    modified += 1
            
            new_lines.append(line)
            i += 1
        
        content = '\n'.join(new_lines)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return 1
        
        return 0
    except Exception as e:
        print(f"[WARN] {file_path} - {e}")
        return 0

def main():
    if len(sys.argv) < 2:
        print("사용법: python fix_log_branchcode.py <프로젝트_루트> [--yes]")
        sys.exit(1)
    
    root_dir = Path(sys.argv[1])
    auto_yes = '--yes' in sys.argv
    
    if not root_dir.exists():
        print(f"[ERROR] 디렉토리를 찾을 수 없습니다: {root_dir}")
        sys.exit(1)
    
    print("=" * 80)
    print("로그 출력에서 branchCode/branchId 제거 스크립트")
    print("=" * 80)
    
    # Java 파일 찾기
    java_files = []
    for java_file in root_dir.rglob("*.java"):
        if ".backup" not in str(java_file) and "target" not in str(java_file):
            java_files.append(java_file)
    
    print(f"[INFO] {len(java_files)}개 Java 파일 발견")
    
    if not auto_yes:
        response = input("\n[WARN] 실제 파일을 수정하시겠습니까? (yes/no): ")
        if response.lower() != 'yes':
            print("취소되었습니다.")
            return
    
    total_modified = 0
    for java_file in java_files:
        modified = fix_log_statements(java_file)
        if modified > 0:
            total_modified += modified
            print(f"[OK] {java_file.relative_to(root_dir)}")
    
    print(f"\n[COMPLETE] 총 {total_modified}개 파일 수정 완료")

if __name__ == "__main__":
    main()

