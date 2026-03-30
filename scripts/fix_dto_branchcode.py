#!/usr/bin/env python3
"""
DTO 클래스의 branchCode/branchId 필드 처리 스크립트
@Deprecated 추가 및 주석 처리

작성일: 2025-12-07
"""

import os
import re
import sys
from pathlib import Path

def fix_dto_field(file_path: Path) -> int:
    """DTO 필드에 @Deprecated 추가"""
    modified = 0
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        i = 0
        while i < len(lines):
            line = lines[i]
            original_line = line
            
            # branchCode/branchId 필드 찾기
            if re.search(r'\bprivate\s+(String|Long|Integer)\s+(branchCode|branchId)', line):
                # 이미 @Deprecated가 있으면 스킵
                if '@Deprecated' in line or (i > 0 and '@Deprecated' in lines[i-1]):
                    i += 1
                    continue
                
                # 필드 위에 주석 찾기
                comment_start = i - 1
                while comment_start >= 0:
                    stripped = lines[comment_start].strip()
                    if stripped.startswith('*') or stripped.startswith('/**'):
                        comment_start -= 1
                    elif stripped.startswith('//'):
                        break
                    else:
                        break
                
                indent = len(line) - len(line.lstrip())
                
                # 주석이 있으면 주석에 추가
                if comment_start >= 0 and comment_start < i - 1:
                    for j in range(comment_start, i):
                        if '*/' in lines[j]:
                            lines[j] = lines[j].replace(
                                '*/',
                                ' * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨, tenantId만 사용\n */'
                            )
                            modified += 1
                            break
                else:
                    # 새로운 주석 추가
                    deprecation = ' ' * indent + '/**\n'
                    deprecation += ' ' * indent + ' * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨\n'
                    deprecation += ' ' * indent + ' * 레거시 데이터 호환을 위해 필드 유지 (NULL 허용)\n'
                    deprecation += ' ' * indent + ' */\n'
                    deprecation += ' ' * indent + '@Deprecated\n'
                    lines.insert(i, deprecation.rstrip())
                    i += 5  # 주석 추가로 인한 오프셋
                    modified += 1
            
            # @Column 어노테이션에서 branch_code/branch_id 찾기
            elif re.search(r'@Column.*branch_(code|id)', line):
                if '@Deprecated' not in line and (i == 0 or '@Deprecated' not in lines[i-1]):
                    # 위에 주석 추가
                    indent = len(line) - len(line.lstrip())
                    deprecation = ' ' * indent + '/**\n'
                    deprecation += ' ' * indent + ' * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨\n'
                    deprecation += ' ' * indent + ' */\n'
                    deprecation += ' ' * indent + '@Deprecated\n'
                    lines.insert(i, deprecation.rstrip())
                    i += 5
                    modified += 1
            
            i += 1
        
        # Getter/Setter 메서드에도 @Deprecated 추가
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # Getter 메서드 찾기
            if re.search(r'public\s+(String|Long|Integer)\s+get(BranchCode|BranchId)\(\)', line):
                if '@Deprecated' not in line and (i == 0 or '@Deprecated' not in lines[i-1]):
                    indent = len(line) - len(line.lstrip())
                    deprecation = ' ' * indent + '@Deprecated\n'
                    lines.insert(i, deprecation.rstrip())
                    i += 2
                    modified += 1
            
            # Setter 메서드 찾기
            elif re.search(r'public\s+void\s+set(BranchCode|BranchId)\(', line):
                if '@Deprecated' not in line and (i == 0 or '@Deprecated' not in lines[i-1]):
                    indent = len(line) - len(line.lstrip())
                    deprecation = ' ' * indent + '@Deprecated\n'
                    lines.insert(i, deprecation.rstrip())
                    i += 2
                    modified += 1
            
            i += 1
        
        if modified > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(lines)
        
        return modified
    except Exception as e:
        print(f"[WARN] {file_path} - {e}")
        return 0

def main():
    if len(sys.argv) < 2:
        print("사용법: python fix_dto_branchcode.py <프로젝트_루트> [--yes]")
        sys.exit(1)
    
    root_dir = Path(sys.argv[1])
    auto_yes = '--yes' in sys.argv
    
    if not root_dir.exists():
        print(f"[ERROR] 디렉토리를 찾을 수 없습니다: {root_dir}")
        sys.exit(1)
    
    print("=" * 80)
    print("DTO 클래스 branchCode/branchId 필드 처리 스크립트")
    print("=" * 80)
    
    # DTO 파일 찾기
    dto_files = []
    for java_file in root_dir.rglob("*DTO.java"):
        if ".backup" not in str(java_file) and "target" not in str(java_file):
            dto_files.append(java_file)
    for java_file in root_dir.rglob("*Request.java"):
        if ".backup" not in str(java_file) and "target" not in str(java_file):
            dto_files.append(java_file)
    for java_file in root_dir.rglob("*Response.java"):
        if ".backup" not in str(java_file) and "target" not in str(java_file):
            dto_files.append(java_file)
    
    print(f"[INFO] {len(dto_files)}개 DTO 파일 발견")
    
    if not auto_yes:
        response = input("\n[WARN] 실제 파일을 수정하시겠습니까? (yes/no): ")
        if response.lower() != 'yes':
            print("취소되었습니다.")
            return
    
    total_modified = 0
    for dto_file in dto_files:
        modified = fix_dto_field(dto_file)
        if modified > 0:
            total_modified += modified
            print(f"[OK] {dto_file.relative_to(root_dir)} - {modified}개 수정")
    
    print(f"\n[COMPLETE] 총 {total_modified}개 수정 완료")

if __name__ == "__main__":
    main()

