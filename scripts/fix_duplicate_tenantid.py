#!/usr/bin/env python3
"""
중복 tenantId 선언 제거 스크립트
"""

import os
import re
import sys
from pathlib import Path

SERVICE_IMPL_DIR = "src/main/java/com/coresolution/consultation/service/impl"

stats = {
    'files_processed': 0,
    'files_modified': 0,
    'duplicates_removed': 0
}

def remove_duplicate_tenant_declarations(content, filename):
    """중복 tenantId 선언 제거"""
    lines = content.split('\n')
    new_lines = []
    modified = False
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # tenantId 선언 찾기
        if 'String tenantId = TenantContextHolder.getRequiredTenantId();' in line:
            # 이전에 이미 선언되었는지 확인
            method_start = i
            while method_start > 0 and not ('{' in lines[method_start] and ('public' in lines[method_start] or 'private' in lines[method_start] or 'protected' in lines[method_start])):
                method_start -= 1
            
            has_previous_declaration = False
            for j in range(method_start, i):
                if 'String tenantId' in lines[j] and '=' in lines[j]:
                    has_previous_declaration = True
                    break
            
            if has_previous_declaration:
                # 중복 선언이므로 제거
                print(f"  [REMOVE] Duplicate tenantId at {filename}:{i+1}")
                stats['duplicates_removed'] += 1
                modified = True
                i += 1
                continue
        
        new_lines.append(line)
        i += 1
    
    return '\n'.join(new_lines), modified

def process_file(filepath):
    """파일 처리"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 중복 선언 제거
        content, modified = remove_duplicate_tenant_declarations(content, filepath.name)
        
        # 파일이 수정되었으면 저장
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            stats['files_modified'] += 1
            print(f"[OK] Modified: {filepath.name}")
            return True
        
        return False
        
    except Exception as e:
        print(f"[ERROR] {filepath}: {str(e)}")
        return False

def main():
    """메인 함수"""
    print("=" * 80)
    print("Remove Duplicate tenantId Declarations")
    print("=" * 80)
    print()
    
    base_dir = Path(__file__).parent.parent
    service_dir = base_dir / SERVICE_IMPL_DIR
    
    if not service_dir.exists():
        print(f"[ERROR] Directory not found: {service_dir}")
        sys.exit(1)
    
    print(f"Target directory: {service_dir}")
    print()
    
    java_files = list(service_dir.glob("*.java"))
    print(f"Total {len(java_files)} files found")
    print()
    
    for java_file in java_files:
        stats['files_processed'] += 1
        process_file(java_file)
    
    print()
    print("=" * 80)
    print("Fix Complete Statistics")
    print("=" * 80)
    print(f"Files processed: {stats['files_processed']}")
    print(f"Files modified: {stats['files_modified']}")
    print(f"Duplicates removed: {stats['duplicates_removed']}")
    print()
    
    if stats['files_modified'] > 0:
        print("Fix completed! Please run: mvn clean compile -DskipTests")
    else:
        print("No changes needed.")
    
    print("=" * 80)

if __name__ == "__main__":
    main()

