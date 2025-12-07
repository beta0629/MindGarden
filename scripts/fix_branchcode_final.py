#!/usr/bin/env python3
"""
브랜치 코드 제거 최종 정리 스크립트
남은 branchCode 사용처를 null로 변경하거나 제거

작성일: 2025-12-07
"""

import os
import re
import sys
from pathlib import Path

def fix_remaining_usage(file_path: Path) -> int:
    """남은 branchCode 사용처 수정"""
    modified = 0
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        new_lines = []
        i = 0
        while i < len(lines):
            line = lines[i]
            original_line = line
            
            # .getBranchCode() 호출을 null로 변경
            if re.search(r'\.getBranchCode\(\)', line) and 'put' in line:
                line = re.sub(r'\.getBranchCode\(\)', 'null // 표준화 2025-12-07: 브랜치 개념 제거됨', line)
                if line != original_line:
                    modified += 1
            
            # getCurrentUserBranchCode() 호출을 null로 변경
            if 'getCurrentUserBranchCode()' in line:
                line = line.replace('getCurrentUserBranchCode()', 'null // 표준화 2025-12-07: 브랜치 개념 제거됨')
                if line != original_line:
                    modified += 1
            
            # 불필요한 branchCode null 체크 제거
            if re.search(r'if\s*\(branchCode\s*==\s*null\s*\|\|\s*branchCode\.trim\(\)\.isEmpty\(\)\)', line):
                # 다음 몇 줄을 확인하여 return true 부분 제거
                if i + 1 < len(lines) and 'return true' in lines[i + 1]:
                    # 주석 처리
                    line = '                    // 표준화 2025-12-07: 브랜치 개념 제거됨, 필터링 제거\n'
                    # 다음 return true 줄도 스킵
                    i += 1
                    continue
                else:
                    line = '                    // 표준화 2025-12-07: 브랜치 개념 제거됨\n'
                    if line != original_line:
                        modified += 1
            
            new_lines.append(line)
            i += 1
        
        if modified > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
        
        return modified
    except Exception as e:
        print(f"[WARN] {file_path} - {e}")
        return 0

def main():
    if len(sys.argv) < 2:
        print("사용법: python fix_branchcode_final.py <프로젝트_루트> [--yes]")
        sys.exit(1)
    
    root_dir = Path(sys.argv[1])
    auto_yes = '--yes' in sys.argv
    
    if not root_dir.exists():
        print(f"[ERROR] 디렉토리를 찾을 수 없습니다: {root_dir}")
        sys.exit(1)
    
    print("=" * 80)
    print("브랜치 코드 제거 최종 정리 스크립트")
    print("=" * 80)
    
    # Service 파일 찾기
    service_files = []
    for java_file in root_dir.rglob("*ServiceImpl.java"):
        if ".backup" not in str(java_file) and "target" not in str(java_file):
            service_files.append(java_file)
    
    print(f"[INFO] {len(service_files)}개 Service 파일 발견")
    
    if not auto_yes:
        response = input("\n[WARN] 실제 파일을 수정하시겠습니까? (yes/no): ")
        if response.lower() != 'yes':
            print("취소되었습니다.")
            return
    
    total_modified = 0
    for service_file in service_files:
        modified = fix_remaining_usage(service_file)
        if modified > 0:
            total_modified += modified
            print(f"[OK] {service_file.relative_to(root_dir)} - {modified}개 수정")
    
    print(f"\n[COMPLETE] 총 {total_modified}개 수정 완료")

if __name__ == "__main__":
    main()

