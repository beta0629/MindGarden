#!/usr/bin/env python3
"""
사용하지 않는 import 정리 스크립트

작성일: 2025-12-07
"""

import os
import re
import sys
from pathlib import Path
from typing import Set, List

def find_unused_imports(file_path: Path) -> List[str]:
    """사용하지 않는 import 찾기"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # import 문 추출
        imports = []
        import_line_map = {}
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith('import ') and not stripped.startswith('import static'):
                # import com.example.Class; 또는 import com.example.*;
                match = re.match(r'import\s+([^;]+);', stripped)
                if match:
                    import_path = match.group(1)
                    # 클래스명 추출 (마지막 부분)
                    if '.' in import_path:
                        class_name = import_path.split('.')[-1]
                        # 와일드카드 import 처리
                        if class_name == '*':
                            package = import_path[:-2]  # .* 제거
                            imports.append((i, import_path, package, True))  # True = wildcard
                        else:
                            imports.append((i, import_path, class_name, False))
                    else:
                        imports.append((i, import_path, import_path, False))
                    import_line_map[import_path] = i
        
        # 파일 내용에서 실제 사용 여부 확인
        content = ''.join(lines)
        unused = []
        
        for line_num, import_path, identifier, is_wildcard in imports:
            # 와일드카드 import는 정확히 확인하기 어려우므로 스킵
            if is_wildcard:
                continue
            
            # import 라인 자체는 제외
            import_line = lines[line_num]
            content_without_import = content.replace(import_line, '', 1)
            
            # 클래스명이 실제로 사용되는지 확인
            # 단순 문자열 매칭이 아닌, 실제 클래스 사용 패턴 확인
            patterns = [
                rf'\b{re.escape(identifier)}\b',  # 클래스명 직접 사용
                rf'<{re.escape(identifier)}>',  # 제네릭 타입
                rf'extends\s+{re.escape(identifier)}',  # 상속
                rf'implements\s+[^{{]*{re.escape(identifier)}',  # 구현
            ]
            
            used = False
            for pattern in patterns:
                if re.search(pattern, content_without_import):
                    used = True
                    break
            
            if not used:
                unused.append((line_num, import_path, identifier))
        
        return unused
    except Exception as e:
        print(f"[WARN] {file_path} - {e}")
        return []

def remove_unused_imports(file_path: Path, unused_imports: List[tuple]) -> int:
    """사용하지 않는 import 제거"""
    if not unused_imports:
        return 0
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # 역순으로 정렬하여 뒤에서부터 제거 (인덱스 유지)
        unused_imports.sort(reverse=True, key=lambda x: x[0])
        
        removed_count = 0
        for line_num, import_path, identifier in unused_imports:
            # 빈 줄도 함께 제거 (import 블록 정리)
            if line_num < len(lines):
                removed_line = lines[line_num]
                lines.pop(line_num)
                removed_count += 1
                
                # 다음 줄이 빈 줄이면 함께 제거
                if line_num < len(lines) and lines[line_num].strip() == '':
                    lines.pop(line_num)
        
        if removed_count > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(lines)
        
        return removed_count
    except Exception as e:
        print(f"[WARN] {file_path} - {e}")
        return 0

def main():
    if len(sys.argv) < 2:
        print("사용법: python cleanup_unused_imports.py <프로젝트_루트> [--dry-run]")
        sys.exit(1)
    
    root_dir = Path(sys.argv[1])
    dry_run = '--dry-run' in sys.argv
    
    if not root_dir.exists():
        print(f"[ERROR] 디렉토리를 찾을 수 없습니다: {root_dir}")
        sys.exit(1)
    
    print("=" * 80)
    print("사용하지 않는 import 정리 스크립트")
    print("=" * 80)
    
    # Java 파일 찾기
    java_files = []
    for java_file in root_dir.rglob("*.java"):
        if ".backup" not in str(java_file) and "target" not in str(java_file):
            java_files.append(java_file)
    
    print(f"[INFO] {len(java_files)}개 Java 파일 발견")
    
    total_unused = 0
    total_removed = 0
    
    for java_file in java_files:
        unused = find_unused_imports(java_file)
        if unused:
            total_unused += len(unused)
            if not dry_run:
                removed = remove_unused_imports(java_file, unused)
                total_removed += removed
                if removed > 0:
                    print(f"[OK] {java_file.relative_to(root_dir)} - {removed}개 import 제거")
            else:
                print(f"[DRY-RUN] {java_file.relative_to(root_dir)} - {len(unused)}개 미사용 import 발견")
                for line_num, import_path, identifier in unused[:5]:  # 최대 5개만 표시
                    print(f"  - {import_path} (라인 {line_num + 1})")
    
    if dry_run:
        print(f"\n[DRY-RUN] 총 {total_unused}개 미사용 import 발견")
        print("실제 제거하려면 --dry-run 옵션을 제거하세요.")
    else:
        print(f"\n[COMPLETE] 총 {total_removed}개 import 제거 완료")

if __name__ == "__main__":
    main()

