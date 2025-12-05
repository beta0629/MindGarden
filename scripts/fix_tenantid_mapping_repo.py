#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ConsultantClientMappingRepository의 deprecated 메서드 사용처를 tenantId 버전으로 변경
"""

import os
import re
import sys
from pathlib import Path

# 인코딩 설정
if sys.platform == 'win32':
    sys.stdout = open(sys.stdout.buffer.fileno(), 'w', encoding='utf-8', errors='replace')
    sys.stderr = open(sys.stderr.buffer.fileno(), 'w', encoding='utf-8', errors='replace')

def fix_tenantid_in_file(file_path):
    """파일에서 deprecated 메서드를 tenantId 버전으로 변경"""
    try:
        file_path_str = str(file_path)
        with open(file_path_str, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 1. findByStatus(status) → findByTenantIdAndStatus(tenantId, status)
        pattern1 = r'\.findByStatus\(([^)]+)\)'
        def replace1(m):
            status = m.group(1)
            return f'.findByTenantIdAndStatus(tenantId, {status})'
        content = re.sub(pattern1, replace1, content)
        
        # 2. findAllWithDetails() → findAllWithDetailsByTenantId(tenantId)
        pattern2 = r'\.findAllWithDetails\(\)'
        def replace2(m):
            return '.findAllWithDetailsByTenantId(tenantId)'
        content = re.sub(pattern2, replace2, content)
        
        # 3. findActiveMappingsWithDetails() → findActiveMappingsWithDetailsByTenantId(tenantId)
        pattern3 = r'\.findActiveMappingsWithDetails\(\)'
        def replace3(m):
            return '.findActiveMappingsWithDetailsByTenantId(tenantId)'
        content = re.sub(pattern3, replace3, content)
        
        # 4. countByPaymentStatus(status) → countByTenantIdAndPaymentStatus(tenantId, status)
        pattern4 = r'\.countByPaymentStatus\(([^)]+)\)'
        def replace4(m):
            status = m.group(1)
            return f'.countByTenantIdAndPaymentStatus(tenantId, {status})'
        content = re.sub(pattern4, replace4, content)
        
        # 5. findByPaymentStatus(status) → findByTenantIdAndPaymentStatus(tenantId, status)
        pattern5 = r'\.findByPaymentStatus\(([^)]+)\)'
        def replace5(m):
            status = m.group(1)
            return f'.findByTenantIdAndPaymentStatus(tenantId, {status})'
        content = re.sub(pattern5, replace5, content)
        
        # 6. existsByConsultantAndClientAndStatus(...) → existsByTenantIdAndConsultantAndClientAndStatus(tenantId, ...)
        pattern6 = r'\.existsByConsultantAndClientAndStatus\(([^,]+),\s*([^,]+),\s*([^)]+)\)'
        def replace6(m):
            consultant = m.group(1)
            client = m.group(2)
            status = m.group(3)
            return f'.existsByTenantIdAndConsultantAndClientAndStatus(tenantId, {consultant}, {client}, {status})'
        content = re.sub(pattern6, replace6, content)
        
        # tenantId 변수 선언 추가 (메서드 시작 부분에)
        # 이미 있는지 확인
        if 'TenantContextHolder.getTenantId()' not in content and 'TenantContextHolder.getRequiredTenantId()' not in content:
            # 메서드 시작 부분에 tenantId 선언 추가
            # 이 부분은 수동으로 확인이 필요할 수 있음
            pass
        
        # 변경사항이 있으면 파일 저장
        if content != original_content:
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
        'src/main/java/com/coresolution/consultation/service/impl/FinancialTransactionServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/ConsultationServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/SessionSyncServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/AlertServiceImpl.java',
    ]
    
    fixed_count = 0
    
    for rel_path in target_files:
        file_path = base_dir / rel_path
        if file_path.exists():
            print(f"수정 중: {rel_path}")
            if fix_tenantid_in_file(file_path):
                fixed_count += 1
                print(f"✅ 수정 완료: {rel_path}")
            else:
                print(f"ℹ️  변경사항 없음: {rel_path}")
        else:
            print(f"⚠️  파일 없음: {rel_path}")
    
    print(f"\n✅ 수정 완료: {fixed_count}개 파일")
    print("\n⚠️  주의: tenantId 변수 선언이 필요한 경우 수동으로 추가해야 할 수 있습니다.")

if __name__ == '__main__':
    main()

