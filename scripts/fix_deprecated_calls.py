#!/usr/bin/env python3
"""
Deprecated 메서드 호출 자동 수정 스크립트

목적: Service Layer에서 @Deprecated 메서드 호출을 tenantId-aware 메서드로 변경
- findAll() -> findByTenantId(tenantId)
- findById(id) -> findByTenantIdAndId(tenantId, id) (필요 시)
- save(entity) -> save(entity) (tenantId 설정 확인)
"""

import os
import re
import sys
from pathlib import Path

# 수정할 파일 패턴
SERVICE_IMPL_DIR = "src/main/java/com/coresolution/consultation/service/impl"

# 통계
stats = {
    'files_processed': 0,
    'files_modified': 0,
    'findAll_fixed': 0,
    'findById_checked': 0,
    'save_checked': 0,
    'errors': []
}

def has_tenant_context_import(content):
    """TenantContextHolder import 확인"""
    return 'import com.coresolution.core.context.TenantContextHolder;' in content

def add_tenant_context_import(content):
    """TenantContextHolder import 추가"""
    if has_tenant_context_import(content):
        return content
    
    # package 선언 다음에 import 추가
    package_pattern = r'(package\s+[\w.]+;\s*\n)'
    replacement = r'\1\nimport com.coresolution.core.context.TenantContextHolder;\n'
    return re.sub(package_pattern, replacement, content, count=1)

def fix_findAll_calls(content, filename):
    """findAll() 호출을 findByTenantId(tenantId)로 변경"""
    modified = False
    lines = content.split('\n')
    new_lines = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # findAll() 호출 찾기 (주석 제외)
        if '.findAll()' in line and not line.strip().startswith('//'):
            # 이미 tenantId가 있는지 확인
            if 'tenantId' in line:
                new_lines.append(line)
                i += 1
                continue
            
            # Repository 이름 추출
            match = re.search(r'(\w+Repository)\.findAll\(\)', line)
            if match:
                repo_name = match.group(1)
                
                # tenantId 변수 선언이 메서드 내에 있는지 확인
                method_start = i
                while method_start > 0 and '{' not in lines[method_start]:
                    method_start -= 1
                
                has_tenant_id = False
                for j in range(method_start, i):
                    if 'String tenantId' in lines[j] or 'tenantId =' in lines[j]:
                        has_tenant_id = True
                        break
                
                # tenantId 선언 추가 (필요 시)
                if not has_tenant_id:
                    indent = len(line) - len(line.lstrip())
                    tenant_line = ' ' * indent + 'String tenantId = TenantContextHolder.getRequiredTenantId();'
                    new_lines.append(tenant_line)
                    stats['findAll_fixed'] += 1
                
                # findAll() -> findByTenantId(tenantId)로 변경
                new_line = line.replace(f'{repo_name}.findAll()', f'{repo_name}.findByTenantId(tenantId)')
                new_lines.append(new_line)
                modified = True
                print(f"  [OK] Fixed findAll() in {filename}:{i+1}")
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
        
        i += 1
    
    return '\n'.join(new_lines), modified

def process_file(filepath):
    """파일 처리"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # TenantContextHolder import 추가
        content = add_tenant_context_import(content)
        
        # findAll() 호출 수정
        content, modified = fix_findAll_calls(content, filepath.name)
        
        # 파일이 수정되었으면 저장
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            stats['files_modified'] += 1
            print(f"[OK] Modified: {filepath.name}")
            return True
        
        return False
        
    except Exception as e:
        error_msg = f"Error processing {filepath}: {str(e)}"
        stats['errors'].append(error_msg)
        print(f"[ERROR] {error_msg}")
        return False

def main():
    """메인 함수"""
    print("=" * 80)
    print("Deprecated Method Call Auto-Fix Started")
    print("=" * 80)
    print()
    
    # Service Impl 디렉토리 찾기
    base_dir = Path(__file__).parent.parent
    service_dir = base_dir / SERVICE_IMPL_DIR
    
    if not service_dir.exists():
        print(f"[ERROR] Directory not found: {service_dir}")
        sys.exit(1)
    
    print(f"Target directory: {service_dir}")
    print()
    
    # 모든 Java 파일 처리
    java_files = list(service_dir.glob("*.java"))
    print(f"Total {len(java_files)} files found")
    print()
    
    for java_file in java_files:
        stats['files_processed'] += 1
        process_file(java_file)
    
    # 결과 출력
    print()
    print("=" * 80)
    print("Fix Complete Statistics")
    print("=" * 80)
    print(f"Files processed: {stats['files_processed']}")
    print(f"Files modified: {stats['files_modified']}")
    print(f"findAll() fixed: {stats['findAll_fixed']}")
    print()
    
    if stats['errors']:
        print("Errors occurred:")
        for error in stats['errors']:
            print(f"  - {error}")
        print()
    
    if stats['files_modified'] > 0:
        print("Fix completed! Please run: mvn clean compile -DskipTests")
    else:
        print("No changes needed.")
    
    print("=" * 80)

if __name__ == "__main__":
    main()

