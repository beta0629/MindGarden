#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AdminServiceImpl의 tenantId 변수 선언 추가
"""

import re

file_path = "MindGarden/src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java"

# 메서드 시그니처 패턴들 (tenantId가 필요한 메서드들)
methods_needing_tenantid = [
    (r'(public void deleteClientWithTransfer\(Long clientId, Long transferToConsultantId, String reason\) \{)\n(\s+log\.info)',
     r'\1\n        String tenantId = TenantContextHolder.getRequiredTenantId();\n\2'),
    
    (r'(public Map<String, Object> checkClientDeletionStatus\(Long clientId\) \{)\n(\s+log\.info)',
     r'\1\n        String tenantId = TenantContextHolder.getRequiredTenantId();\n\2'),
    
    (r'(public Map<String, Object> transferClientMappings\(Long fromClientId, Long toClientId, String reason\) \{)\n(\s+log\.info)',
     r'\1\n        String tenantId = TenantContextHolder.getRequiredTenantId();\n\2'),
    
    (r'(public List<Map<String, Object>> getFinancialSummaryByCategory\([^)]+\) \{)\n(\s+log\.info)',
     r'\1\n        String tenantId = TenantContextHolder.getRequiredTenantId();\n\2'),
    
    (r'(public Map<String, Object> getClientTerminationHistory\(Long clientId\) \{)\n(\s+log\.info)',
     r'\1\n        String tenantId = TenantContextHolder.getRequiredTenantId();\n\2'),
    
    (r'(public Map<String, Object> getConsultantScheduleMap\(Long consultantId\) \{)\n(\s+try \{)',
     r'\1\n        String tenantId = TenantContextHolder.getRequiredTenantId();\n\2'),
    
    (r'(public List<Map<String, Object>> getConsultantWorkload\([^)]+\) \{)\n(\s+try \{)',
     r'\1\n        String tenantId = TenantContextHolder.getRequiredTenantId();\n\2'),
]

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 각 패턴 적용
    for pattern, replacement in methods_needing_tenantid:
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    
    # 변경사항이 있으면 저장
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"수정 완료: {file_path}")
    else:
        print(f"변경 없음: {file_path}")
        
except Exception as e:
    print(f"오류 발생: {e}")

