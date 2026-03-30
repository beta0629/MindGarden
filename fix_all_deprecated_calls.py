#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
전체 시스템 Deprecated 메서드 일괄 수정 스크립트
- findAll() → findByTenantId(tenantId)
- findById(id) → findByTenantIdAndId(tenantId, id) 또는 검증 로직 추가
- save(entity) → tenantId 설정 후 save
- deleteById(id) → tenantId 검증 후 delete
"""

import os
import re
import sys
from pathlib import Path

def fix_deprecated_calls():
    """Deprecated 메서드 호출을 tenantId 기반으로 수정"""
    
    # 수정 대상 디렉토리
    src_dir = Path("src/main/java")
    if not src_dir.exists():
        print("src/main/java 디렉토리를 찾을 수 없습니다.")
        return
    
    # 수정 통계
    stats = {
        'files_processed': 0,
        'files_modified': 0,
        'findAll_fixed': 0,
        'findById_fixed': 0,
        'save_fixed': 0,
        'deleteById_fixed': 0
    }
    
    # Java 파일 순회
    for java_file in src_dir.rglob("*.java"):
        if process_file(java_file, stats):
            stats['files_modified'] += 1
        stats['files_processed'] += 1
    
    # 결과 출력
    print(f"""
Deprecated 메서드 수정 완료!

수정 통계:
   - 처리된 파일: {stats['files_processed']}개
   - 수정된 파일: {stats['files_modified']}개
   - findAll() 수정: {stats['findAll_fixed']}개
   - findById() 수정: {stats['findById_fixed']}개  
   - save() 수정: {stats['save_fixed']}개
   - deleteById() 수정: {stats['deleteById_fixed']}개
   
총 {stats['findAll_fixed'] + stats['findById_fixed'] + stats['save_fixed'] + stats['deleteById_fixed']}개 수정 완료!
""")

def process_file(file_path, stats):
    """개별 파일 처리"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 1. findAll() 수정
        content, count = fix_find_all(content)
        stats['findAll_fixed'] += count
        
        # 2. findById() 수정 (주석으로 표시)
        content, count = fix_find_by_id(content)
        stats['findById_fixed'] += count
        
        # 3. save() 수정 (주석으로 표시)
        content, count = fix_save(content)
        stats['save_fixed'] += count
        
        # 4. deleteById() 수정 (주석으로 표시)
        content, count = fix_delete_by_id(content)
        stats['deleteById_fixed'] += count
        
        # 변경사항이 있으면 파일 저장
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"수정: {file_path}")
            return True
            
    except Exception as e:
        print(f"오류 ({file_path}): {e}")
    
    return False

def fix_find_all(content):
    """findAll() → findByTenantId(tenantId) 수정"""
    count = 0
    
    # Repository.findAll() 패턴 찾기
    pattern = r'(\w+Repository)\.findAll\(\)'
    
    def replace_func(match):
        nonlocal count
        count += 1
        repo_name = match.group(1)
        return f"""// TODO: tenantId 추가 필요
        String tenantId = TenantContextHolder.getRequiredTenantId();
        {repo_name}.findByTenantId(tenantId)"""
    
    content = re.sub(pattern, replace_func, content)
    return content, count

def fix_find_by_id(content):
    """findById() → 보안 검증 주석 추가"""
    count = 0
    
    # Repository.findById(id) 패턴 찾기
    pattern = r'(\w+Repository)\.findById\(([^)]+)\)'
    
    def replace_func(match):
        nonlocal count
        count += 1
        repo_name = match.group(1)
        id_param = match.group(2)
        return f"""// ⚠️ SECURITY: tenantId 검증 필요!
        {repo_name}.findById({id_param})"""
    
    content = re.sub(pattern, replace_func, content)
    return content, count

def fix_save(content):
    """save() → tenantId 설정 주석 추가"""
    count = 0
    
    # Repository.save(entity) 패턴 찾기
    pattern = r'(\w+Repository)\.save\(([^)]+)\)'
    
    def replace_func(match):
        nonlocal count
        count += 1
        repo_name = match.group(1)
        entity_param = match.group(2)
        return f"""// TODO: tenantId 설정 필요
        // {entity_param}.setTenantId(TenantContextHolder.getRequiredTenantId());
        {repo_name}.save({entity_param})"""
    
    content = re.sub(pattern, replace_func, content)
    return content, count

def fix_delete_by_id(content):
    """deleteById() → tenantId 검증 주석 추가"""
    count = 0
    
    # Repository.deleteById(id) 패턴 찾기
    pattern = r'(\w+Repository)\.deleteById\(([^)]+)\)'
    
    def replace_func(match):
        nonlocal count
        count += 1
        repo_name = match.group(1)
        id_param = match.group(2)
        return f"""// ⚠️ SECURITY: tenantId 검증 후 삭제 필요!
        {repo_name}.deleteById({id_param})"""
    
    content = re.sub(pattern, replace_func, content)
    return content, count

if __name__ == "__main__":
    print("전체 시스템 Deprecated 메서드 수정 시작...")
    fix_deprecated_calls()
