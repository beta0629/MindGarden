#!/usr/bin/env python3
"""
Service 계층의 branchCode 파라미터 처리 스크립트
branchCode 파라미터를 받는 메서드에 @Deprecated 추가 및 무시 로직 추가

작성일: 2025-12-07
"""

import os
import re
import sys
from pathlib import Path

def fix_service_method(file_path: Path) -> int:
    """Service 메서드의 branchCode 파라미터 처리"""
    modified = 0
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
        
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # 메서드 시그니처에서 branchCode 파라미터 찾기
            if re.search(r'\b(branchCode|branchId)\s+[a-zA-Z]', line) and '(' in line:
                # 이미 @Deprecated가 있으면 스킵
                if '@Deprecated' in line or 'Deprecated' in line:
                    i += 1
                    continue
                
                # 메서드 시작 부분 찾기
                method_start = i
                while method_start > 0:
                    prev_line = lines[method_start - 1].strip()
                    if prev_line.startswith(('public', 'private', 'protected')):
                        break
                    if prev_line.startswith('@') or prev_line.startswith('//'):
                        method_start -= 1
                        continue
                    break
                
                # @Deprecated 주석 추가
                indent = len(lines[method_start]) - len(lines[method_start].lstrip())
                
                # 기존 주석이 있는지 확인
                has_comment = False
                if method_start > 0:
                    for j in range(method_start - 1, max(0, method_start - 5), -1):
                        if '*/' in lines[j]:
                            # 기존 주석에 추가
                            lines[j] = lines[j].replace(
                                '*/',
                                ' * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용\n */'
                            )
                            has_comment = True
                            break
                        elif lines[j].strip().startswith('//'):
                            break
                
                if not has_comment:
                    # 새로운 주석 블록 추가
                    deprecation = ' ' * indent + '/**\n'
                    deprecation += ' ' * indent + ' * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용\n'
                    deprecation += ' ' * indent + ' */\n'
                    deprecation += ' ' * indent + '@Deprecated\n'
                    lines.insert(method_start, deprecation.rstrip())
                    i += 5  # 주석 추가로 인한 오프셋
                
                # 메서드 본문 시작 부분 찾기
                body_start = i
                while body_start < len(lines) and '{' not in lines[body_start]:
                    body_start += 1
                
                if body_start < len(lines):
                    # 다음 줄의 들여쓰기 확인
                    next_line_idx = body_start + 1
                    if next_line_idx < len(lines):
                        indent = len(lines[next_line_idx]) - len(lines[next_line_idx].lstrip())
                        
                        # branchCode 변수명 추출
                        var_match = re.search(r'\b(branchCode|branchId)\s+([a-zA-Z_][a-zA-Z0-9_]*)', line)
                        if var_match:
                            var_name = var_match.group(2)
                            
                            # 이미 무시 로직이 있는지 확인
                            check_lines = ''.join(lines[body_start:body_start+5])
                            if 'branchCode' in check_lines and ('무시' in check_lines or 'Deprecated' in check_lines):
                                i += 1
                                continue
                            
                            # 무시 로직 추가
                            warning = ' ' * indent + '// 표준화 2025-12-07: branchCode 무시\n'
                            warning += ' ' * indent + f'if ({var_name} != null && !{var_name}.trim().isEmpty()) {{\n'
                            warning += ' ' * indent + f'    log.warn("Deprecated 파라미터: {var_name}는 더 이상 사용하지 않음. {var_name}={{}}", {var_name});\n'
                            warning += ' ' * indent + '}\n'
                            
                            # String이 아닌 경우 (Long, Integer 등)
                            if 'Long' in line or 'Integer' in line:
                                warning = ' ' * indent + '// 표준화 2025-12-07: branchId 무시\n'
                                warning += ' ' * indent + f'if ({var_name} != null) {{\n'
                                warning += ' ' * indent + f'    log.warn("Deprecated 파라미터: {var_name}는 더 이상 사용하지 않음. {var_name}={{}}", {var_name});\n'
                                warning += ' ' * indent + '}\n'
                            
                            lines.insert(next_line_idx, warning.rstrip())
                            modified += 1
            
            i += 1
        
        if modified > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(lines))
        
        return modified
    except Exception as e:
        print(f"[WARN] {file_path} - {e}")
        return 0

def main():
    if len(sys.argv) < 2:
        print("사용법: python fix_service_branchcode.py <프로젝트_루트> [--yes]")
        sys.exit(1)
    
    root_dir = Path(sys.argv[1])
    auto_yes = '--yes' in sys.argv
    
    if not root_dir.exists():
        print(f"[ERROR] 디렉토리를 찾을 수 없습니다: {root_dir}")
        sys.exit(1)
    
    print("=" * 80)
    print("Service 계층 branchCode 파라미터 처리 스크립트")
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
        modified = fix_service_method(service_file)
        if modified > 0:
            total_modified += modified
            print(f"[OK] {service_file.relative_to(root_dir)} - {modified}개 메서드 수정")
    
    print(f"\n[COMPLETE] 총 {total_modified}개 메서드 수정 완료")

if __name__ == "__main__":
    main()

