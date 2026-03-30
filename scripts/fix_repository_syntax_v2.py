#!/usr/bin/env python3
"""
Repository 파일 문법 오류 수정 스크립트 v2

작성일: 2025-12-07
목적: 파일 시작 부분의 중복된 @Deprecated 주석과 어노테이션 완전 제거
"""

import os
import re
import sys
from pathlib import Path

def fix_repository_file(file_path: Path) -> bool:
    """Repository 파일의 문법 오류 수정"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        if not lines:
            return False
        
        original_lines = lines.copy()
        new_lines = []
        i = 0
        
        # 파일 시작 부분의 중복된 @Deprecated 주석 블록 건너뛰기
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # package 선언을 찾을 때까지 중복 주석 건너뛰기
            if stripped.startswith('package '):
                new_lines.append(line)
                i += 1
                break
            
            # @Deprecatedpackage 또는 @Deprecatedpublic 패턴 발견
            if '@Deprecatedpackage' in line:
                new_lines.append(line.replace('@Deprecatedpackage', 'package'))
                i += 1
                break
            elif '@Deprecatedpublic' in line:
                new_lines.append(line.replace('@Deprecatedpublic', 'public'))
                i += 1
                break
            
            # 중복된 @Deprecated 주석 블록 건너뛰기
            if stripped.startswith('/**') or stripped.startswith('*') or stripped.startswith('*/') or stripped.startswith('@Deprecated'):
                # 이 줄이 package 선언 바로 앞의 주석인지 확인
                j = i + 1
                found_package = False
                while j < len(lines) and j < i + 15:  # 최대 15줄 확인
                    if 'package ' in lines[j] or '@Deprecatedpackage' in lines[j] or '@Deprecatedpublic' in lines[j]:
                        found_package = True
                        break
                    j += 1
                
                if found_package:
                    # package 선언 바로 앞의 중복 주석이므로 건너뛰기
                    i += 1
                    continue
                else:
                    # 일반 주석이므로 유지
                    new_lines.append(line)
                    i += 1
            else:
                # 일반 코드 줄
                new_lines.append(line)
                i += 1
        
        # 나머지 줄 추가
        while i < len(lines):
            line = lines[i]
            # @Deprecatedpublic 패턴 수정
            if '@Deprecatedpublic' in line:
                new_lines.append(line.replace('@Deprecatedpublic', 'public'))
            else:
                new_lines.append(line)
            i += 1
        
        new_content = ''.join(new_lines)
        
        # 최종 정리: 남아있는 패턴 수정
        new_content = new_content.replace('@Deprecatedpackage', 'package')
        new_content = re.sub(r'@Deprecatedpublic\s+interface', 'public interface', new_content)
        new_content = re.sub(r'@Deprecatedpublic\s+class', 'public class', new_content)
        
        if new_content != ''.join(original_lines):
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False
    except Exception as e:
        print(f"[ERROR] {file_path}: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("사용법: python fix_repository_syntax_v2.py <프로젝트_루트>")
        sys.exit(1)
    
    root_dir = Path(sys.argv[1])
    
    if not root_dir.exists():
        print(f"[ERROR] 디렉토리를 찾을 수 없습니다: {root_dir}")
        sys.exit(1)
    
    print("=" * 80)
    print("Repository 파일 문법 오류 수정 스크립트 v2")
    print("=" * 80)
    
    # Repository 파일 찾기
    repository_files = []
    for repo_file in root_dir.rglob("*Repository.java"):
        if ".backup" not in str(repo_file) and "target" not in str(repo_file):
            repository_files.append(repo_file)
    
    print(f"[INFO] {len(repository_files)}개 Repository 파일 발견")
    
    fixed_count = 0
    for repo_file in repository_files:
        if fix_repository_file(repo_file):
            fixed_count += 1
            print(f"[OK] {repo_file.relative_to(root_dir)} - 수정 완료")
    
    print(f"\n[COMPLETE] 총 {fixed_count}개 파일 수정 완료")

if __name__ == "__main__":
    main()

