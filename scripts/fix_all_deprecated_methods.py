#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
모든 Deprecated 메서드 사용처를 tenantId 버전으로 일괄 수정
"""

import os
import re
import sys
from pathlib import Path

# 인코딩 설정
if sys.platform == 'win32':
    sys.stdout = open(sys.stdout.buffer.fileno(), 'w', encoding='utf-8', errors='replace')
    sys.stderr = open(sys.stderr.buffer.fileno(), 'w', encoding='utf-8', errors='replace')

# Deprecated 메서드 -> tenantId 버전 매핑
DEPRECATED_METHODS = {
    # ConsultantRepository
    r'consultantRepository\.findActiveConsultants\(\)': {
        'replacement': 'consultantRepository.findActiveConsultantsByTenantId(tenantId)',
        'tenant_id_needed': True,
        'import_check': 'BaseTenantAwareService'
    },
    
    # PurchaseOrderRepository
    r'purchaseOrderRepository\.findByStatus\(([^)]+)\)': {
        'replacement': r'purchaseOrderRepository.findByTenantIdAndStatus(tenantId, \1)',
        'tenant_id_needed': True,
        'import_check': 'BaseTenantAwareService'
    },
    
    # ConsultationRepository
    r'consultationRepository\.findByStatus\(([^)]+)\)': {
        'replacement': r'consultationRepository.findByTenantIdAndStatus(tenantId, \1)',
        'tenant_id_needed': True,
        'import_check': 'BaseTenantAwareService'
    },
    
    # AlertRepository
    r'alertRepository\.findByStatus\(([^)]+)\)': {
        'replacement': r'alertRepository.findByTenantIdAndStatus(tenantId, \1)',
        'tenant_id_needed': True,
        'import_check': 'BaseTenantAwareService'
    },
}

def ensure_base_tenant_aware_service(file_path, content):
    """BaseTenantAwareService 상속 및 import 확인"""
    modified = False
    
    # 클래스 선언 확인
    if 'extends BaseTenantAwareService' not in content:
        # public class XxxServiceImpl implements XxxService 패턴 찾기
        pattern = r'(public class (\w+ServiceImpl)\s+implements)'
        match = re.search(pattern, content)
        if match:
            class_decl = match.group(0)
            if 'extends' not in class_decl:
                new_decl = f'public class {match.group(2)} extends BaseTenantAwareService implements'
                content = content.replace(class_decl, new_decl, 1)
                modified = True
    
    # import 확인
    if 'import com.coresolution.core.service.impl.BaseTenantAwareService;' not in content:
        # import 섹션 찾기
        import_pattern = r'(import com\.coresolution\.core\.context\.TenantContextHolder;)'
        if re.search(import_pattern, content):
            content = re.sub(
                import_pattern,
                r'\1\nimport com.coresolution.core.service.impl.BaseTenantAwareService;',
                content
            )
            modified = True
        else:
            # 파일 끝에 import 추가
            package_match = re.search(r'^package .+;', content, re.MULTILINE)
            if package_match:
                insert_pos = package_match.end()
                content = content[:insert_pos] + '\n\nimport com.coresolution.core.service.impl.BaseTenantAwareService;' + content[insert_pos:]
                modified = True
    
    return content, modified

def fix_deprecated_methods_in_file(file_path):
    """파일에서 deprecated 메서드를 tenantId 버전으로 변경"""
    try:
        file_path_str = str(file_path)
        with open(file_path_str, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # BaseTenantAwareService 상속 확인
        content, base_modified = ensure_base_tenant_aware_service(file_path, content)
        
        # 각 deprecated 메서드 패턴에 대해 수정
        for pattern, config in DEPRECATED_METHODS.items():
            replacement = config['replacement']
            tenant_id_needed = config.get('tenant_id_needed', False)
            
            # 패턴 매칭
            matches = list(re.finditer(pattern, content))
            if matches:
                # 역순으로 처리 (인덱스 변경 방지)
                for match in reversed(matches):
                    start = match.start()
                    end = match.end()
                    
                    # 해당 위치 앞에 tenantId 선언이 있는지 확인
                    before_text = content[:start]
                    if tenant_id_needed:
                        # tenantId 변수가 이미 선언되어 있는지 확인 (메서드 내에서)
                        method_start = before_text.rfind('{', max(0, before_text.rfind('\n    ')))
                        method_text = content[method_start:end] if method_start >= 0 else before_text
                        
                        if 'String tenantId =' not in method_text and 'tenantId =' not in method_text:
                            # tenantId 선언 추가
                            indent = len(before_text) - len(before_text.rstrip('\n'))
                            indent_str = ' ' * (indent + 4)  # 4칸 들여쓰기
                            tenant_decl = f'\n{indent_str}// 표준화 2025-12-05: tenantId 필터링 필수\n{indent_str}String tenantId = getTenantId();'
                            
                            # 적절한 위치에 삽입 (메서드 시작 부분 또는 변수 선언 직전)
                            insert_pos = start
                            # 이전 줄의 끝 찾기
                            line_start = before_text.rfind('\n', max(0, start - 200))
                            if line_start >= 0:
                                insert_pos = line_start + 1
                            
                            content = content[:insert_pos] + tenant_decl + '\n' + content[insert_pos:]
                            # 인덱스 조정
                            start += len(tenant_decl) + 1
                            end += len(tenant_decl) + 1
                    
                    # 메서드 호출 교체
                    matched_text = content[start:end]
                    if isinstance(replacement, str) and '\\1' in replacement:
                        # 그룹 참조가 있는 경우
                        new_text = match.expand(replacement)
                    else:
                        new_text = replacement
                    
                    content = content[:start] + new_text + content[end:]
        
        # TenantContextHolder.getRequiredTenantId() -> getTenantId() 변경
        content = re.sub(
            r'TenantContextHolder\.getRequiredTenantId\(\)',
            'getTenantId()',
            content
        )
        
        # TenantContextHolder.getTenantId() -> getTenantIdOrNull() 변경 (null 체크가 있는 경우만)
        # 단, BaseTenantAwareService를 상속받은 경우에만
        if 'extends BaseTenantAwareService' in content:
            # null 체크 패턴이 있는 경우는 getTenantIdOrNull()로, 없으면 getTenantId()로
            pattern = r'String tenantId = TenantContextHolder\.getTenantId\(\);\s*if \(tenantId == null\)'
            if re.search(pattern, content):
                content = re.sub(
                    r'TenantContextHolder\.getTenantId\(\)',
                    'getTenantIdOrNull()',
                    content
                )
            else:
                # null 체크 없이 사용하는 경우는 getTenantId()로 변경
                content = re.sub(
                    r'TenantContextHolder\.getTenantId\(\)(?!\s*;)',
                    'getTenantId()',
                    content
                )
        
        # 변경사항이 있으면 파일 저장
        if content != original_content or base_modified:
            with open(file_path_str, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"❌ 오류 발생 ({file_path_str}): {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False

def main():
    """메인 함수"""
    base_dir = Path(__file__).parent.parent
    
    # 수정할 파일 목록
    target_files = [
        'src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/ErpServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/ConsultationServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/AlertServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/FinancialTransactionServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/SessionSyncServiceImpl.java',
    ]
    
    fixed_count = 0
    
    for rel_path in target_files:
        file_path = base_dir / rel_path
        if file_path.exists():
            print(f"수정 중: {rel_path}")
            if fix_deprecated_methods_in_file(file_path):
                fixed_count += 1
                print(f"✅ 수정 완료: {rel_path}")
            else:
                print(f"ℹ️  변경사항 없음: {rel_path}")
        else:
            print(f"⚠️  파일 없음: {rel_path}")
    
    print(f"\n✅ 수정 완료: {fixed_count}개 파일")

if __name__ == '__main__':
    main()

