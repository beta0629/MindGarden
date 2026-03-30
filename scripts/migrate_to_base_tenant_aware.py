#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BaseTenantAwareService 상속으로 마이그레이션
TenantContextHolder 호출을 BaseTenantAwareService 메서드로 변경
"""

import os
import re
import sys
from pathlib import Path

# 인코딩 설정
if sys.platform == 'win32':
    sys.stdout = open(sys.stdout.buffer.fileno(), 'w', encoding='utf-8', errors='replace')
    sys.stderr = open(sys.stderr.buffer.fileno(), 'w', encoding='utf-8', errors='replace')

def migrate_file(file_path):
    """파일을 BaseTenantAwareService 사용으로 마이그레이션"""
    try:
        file_path_str = str(file_path)
        with open(file_path_str, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 1. 클래스 선언에 BaseTenantAwareService 상속 추가
        # public class XxxServiceImpl implements XxxService
        # -> public class XxxServiceImpl extends BaseTenantAwareService implements XxxService
        if 'extends BaseTenantAwareService' not in content:
            pattern1 = r'(public class (\w+ServiceImpl) implements)'
            def replace1(m):
                class_name = m.group(2)
                # 이미 다른 클래스를 상속받고 있는지 확인
                if f'extends ' in content[:content.find(m.group(0)) + 100]:
                    return m.group(0)  # 이미 상속받고 있으면 변경하지 않음
                return f'public class {class_name} extends BaseTenantAwareService implements'
            content = re.sub(pattern1, replace1, content)
        
        # 2. import 추가
        if 'import com.coresolution.core.service.impl.BaseTenantAwareService;' not in content:
            # import 섹션 찾기
            import_pattern = r'(import com\.coresolution\.core\.context\.TenantContextHolder;)'
            if re.search(import_pattern, content):
                content = re.sub(
                    import_pattern,
                    r'\1\nimport com.coresolution.core.service.impl.BaseTenantAwareService;',
                    content
                )
        
        # 3. TenantContextHolder.getRequiredTenantId() -> getTenantId()
        content = re.sub(
            r'TenantContextHolder\.getRequiredTenantId\(\)',
            'getTenantId()',
            content
        )
        
        # 4. TenantContextHolder.getTenantId() -> getTenantIdOrNull()
        content = re.sub(
            r'TenantContextHolder\.getTenantId\(\)',
            'getTenantIdOrNull()',
            content
        )
        
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
        'src/main/java/com/coresolution/consultation/service/impl/StatisticsServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/ErpServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/FinancialTransactionServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/ConsultationServiceImpl.java',
        'src/main/java/com/coresolution/consultation/service/impl/SessionSyncServiceImpl.java',
    ]
    
    fixed_count = 0
    
    for rel_path in target_files:
        file_path = base_dir / rel_path
        if file_path.exists():
            print(f"마이그레이션 중: {rel_path}")
            if migrate_file(file_path):
                fixed_count += 1
                print(f"✅ 마이그레이션 완료: {rel_path}")
            else:
                print(f"ℹ️  변경사항 없음: {rel_path}")
        else:
            print(f"⚠️  파일 없음: {rel_path}")
    
    print(f"\n✅ 마이그레이션 완료: {fixed_count}개 파일")

if __name__ == '__main__':
    main()

