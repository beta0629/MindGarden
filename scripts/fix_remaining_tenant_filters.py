#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
남은 Repository 메서드 호출에 tenantId 추가하는 스크립트
"""

import re
import os
import sys

# 수정할 패턴들
PATTERNS = [
    # scheduleRepository 패턴들
    (r'scheduleRepository\.findByConsultantIdAndDateGreaterThanEqual\((\w+),', 
     r'scheduleRepository.findByTenantIdAndConsultantIdAndDateGreaterThanEqual(tenantId, \1,'),
    
    (r'scheduleRepository\.findByClientIdAndDateGreaterThanEqual\((\w+),', 
     r'scheduleRepository.findByTenantIdAndClientIdAndDateGreaterThanEqual(tenantId, \1,'),
    
    (r'scheduleRepository\.findByConsultantIdAndClientIdAndDateGreaterThanEqual\(',
     r'scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(tenantId, '),
    
    # mappingRepository 패턴들
    (r'mappingRepository\.findByConsultantAndClient\((\w+),\s*(\w+)\)',
     r'mappingRepository.findByTenantIdAndConsultantAndClient(tenantId, \1, \2)'),
    
    (r'mappingRepository\.countByConsultantIdAndStatusIn\((\w+),',
     r'mappingRepository.countByTenantIdAndConsultantIdAndStatusIn(tenantId, \1,'),
    
    # consultantRepository 패턴들
    (r'consultantRepository\.findByIsDeletedFalse\(\)',
     r'consultantRepository.findByTenantIdAndIsDeletedFalse(tenantId)'),
    
    # financialTransactionRepository 패턴들
    (r'financialTransactionRepository\.findByTransactionTypeAndSubcategoryAndTransactionDateBetweenAndIsDeletedFalse\(',
     r'financialTransactionRepository.findByTenantIdAndTransactionTypeAndSubcategoryAndTransactionDateBetweenAndIsDeletedFalse(tenantId, '),
    
    # commonCodeRepository 패턴들 (CommonCode는 tenantId 불필요할 수 있음 - 일단 스킵)
    
    # userSocialAccountRepository 패턴들
    (r'userSocialAccountRepository\.findByUserAndIsDeletedFalse\((\w+)\)',
     r'userSocialAccountRepository.findByTenantIdAndUserAndIsDeletedFalse(tenantId, \1)'),
    
    # userActivityRepository 패턴들
    (r'userActivityRepository\.findByUserIdAndActivityTypeOrderByCreatedAtDesc\(',
     r'userActivityRepository.findByTenantIdAndUserIdAndActivityTypeOrderByCreatedAtDesc(tenantId, '),
    
    (r'userActivityRepository\.findByUserIdOrderByCreatedAtDesc\(',
     r'userActivityRepository.findByTenantIdAndUserIdOrderByCreatedAtDesc(tenantId, '),
]

def add_tenant_id_declaration(content, file_path):
    """메서드 시작 부분에 tenantId 선언 추가"""
    # 이미 TenantContextHolder가 import되어 있는지 확인
    if 'import com.coresolution.core.context.TenantContextHolder;' not in content:
        # import 추가
        import_pattern = r'(import com\.coresolution\.core\.context\.TenantContext;)'
        if re.search(import_pattern, content):
            content = re.sub(import_pattern, 
                           r'\1\nimport com.coresolution.core.context.TenantContextHolder;', 
                           content)
        else:
            # TenantContext import가 없으면 다른 import 뒤에 추가
            import_pattern = r'(import com\.coresolution\.\w+\.\w+\.\w+;)'
            matches = list(re.finditer(import_pattern, content))
            if matches:
                last_match = matches[-1]
                insert_pos = last_match.end()
                content = content[:insert_pos] + '\nimport com.coresolution.core.context.TenantContextHolder;' + content[insert_pos:]
    
    return content

def process_file(file_path):
    """파일 처리"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # tenantId 선언 추가
        content = add_tenant_id_declaration(content, file_path)
        
        # 패턴 적용
        for pattern, replacement in PATTERNS:
            content = re.sub(pattern, replacement, content)
        
        # 변경사항이 있으면 저장
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"수정 완료: {file_path}")
            return True
        else:
            print(f"변경 없음: {file_path}")
            return False
            
    except Exception as e:
        print(f"오류 발생 ({file_path}): {e}")
        return False

def main():
    # Service 파일들 찾기
    service_dir = "MindGarden/src/main/java/com/coresolution"
    
    modified_count = 0
    
    # AdminServiceImpl만 먼저 처리
    admin_service = os.path.join(service_dir, "consultation/service/impl/AdminServiceImpl.java")
    if os.path.exists(admin_service):
        if process_file(admin_service):
            modified_count += 1
    
    print(f"\n총 {modified_count}개 파일 수정 완료")

if __name__ == "__main__":
    main()

