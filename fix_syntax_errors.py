#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
자동화 스크립트로 인한 문법 오류 수정
"""

import os
import re
from pathlib import Path

def fix_syntax_errors():
    """문법 오류 수정"""
    
    src_dir = Path("src/main/java")
    if not src_dir.exists():
        print("src/main/java 디렉토리를 찾을 수 없습니다.")
        return
    
    fixed_count = 0
    
    # Java 파일 순회
    for java_file in src_dir.rglob("*.java"):
        if fix_file_syntax(java_file):
            fixed_count += 1
    
    print(f"총 {fixed_count}개 파일의 문법 오류를 수정했습니다.")

def fix_file_syntax(file_path):
    """개별 파일의 문법 오류 수정"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 패턴 1: = // TODO: tenantId 추가 필요\n        String tenantId = 
        pattern1 = r'= // TODO: tenantId 추가 필요\s*\n\s*String tenantId = TenantContextHolder\.getRequiredTenantId\(\);\s*\n\s*(\w+Repository)\.findByTenantId\(tenantId\);'
        replacement1 = r'= \1.findByTenantId(TenantContextHolder.getRequiredTenantId());'
        content = re.sub(pattern1, replacement1, content, flags=re.MULTILINE)
        
        # 패턴 2: 잘못된 줄바꿈 수정
        pattern2 = r'(\w+)\s*=\s*// TODO: tenantId 추가 필요\s*\n\s*String tenantId = TenantContextHolder\.getRequiredTenantId\(\);\s*\n\s*(\w+Repository)\.findByTenantId\(tenantId\);'
        replacement2 = r'// TODO: tenantId 추가 필요\n        String tenantId = TenantContextHolder.getRequiredTenantId();\n        \1 = \2.findByTenantId(tenantId);'
        content = re.sub(pattern2, replacement2, content, flags=re.MULTILINE)
        
        # 패턴 3: List<Type> var = // TODO 형태 수정
        pattern3 = r'(List<[^>]+>\s+\w+)\s*=\s*// TODO: tenantId 추가 필요\s*\n\s*String tenantId = TenantContextHolder\.getRequiredTenantId\(\);\s*\n\s*(\w+Repository)\.findByTenantId\(tenantId\);'
        replacement3 = r'// TODO: tenantId 추가 필요\n        String tenantId = TenantContextHolder.getRequiredTenantId();\n        \1 = \2.findByTenantId(tenantId);'
        content = re.sub(pattern3, replacement3, content, flags=re.MULTILINE)
        
        # 패턴 4: 기타 잘못된 형태들
        pattern4 = r'(\w+)\s*=\s*// TODO: tenantId 추가 필요\s*\n\s*String tenantId = TenantContextHolder\.getRequiredTenantId\(\);\s*\n\s*(\w+Repository)\.(\w+)\(([^)]*)\);'
        replacement4 = r'// TODO: tenantId 추가 필요\n        String tenantId = TenantContextHolder.getRequiredTenantId();\n        \1 = \2.\3(\4);'
        content = re.sub(pattern4, replacement4, content, flags=re.MULTILINE)
        
        # 변경사항이 있으면 파일 저장
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"수정: {file_path}")
            return True
            
    except Exception as e:
        print(f"오류 ({file_path}): {e}")
    
    return False

if __name__ == "__main__":
    print("문법 오류 수정 시작...")
    fix_syntax_errors()
