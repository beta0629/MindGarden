#!/usr/bin/env python3
"""
Repository 파일 문법 오류 수정 스크립트

작성일: 2025-12-07
목적: 중복된 @Deprecated 주석과 어노테이션 제거, package 선언 정리
"""

import os
import re
import sys
from pathlib import Path

def fix_repository_file(file_path: Path) -> bool:
    """Repository 파일의 문법 오류 수정"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 패턴 1: 파일 시작 부분의 중복된 @Deprecated 주석 제거
        # @Deprecatedpackage 또는 @Deprecatedpublic 같은 패턴 제거
        content = re.sub(
            r'^(\s*/\*\*\s*\n\s*\*\s*@Deprecated[^\n]*\n\s*\*/\s*\n)*@Deprecatedpackage',
            'package',
            content,
            flags=re.MULTILINE
        )
        
        # 패턴 2: @Deprecatedpublic, @Deprecatedpublic interface 같은 패턴 수정
        content = re.sub(
            r'@Deprecatedpublic\s+interface',
            'public interface',
            content
        )
        
        # 패턴 3: @Repository 다음의 불필요한 @Deprecated 제거
        content = re.sub(
            r'@Repository\s+/\*\*\s*\n\s*\*\s*@Deprecated[^\n]*\n\s*\*/\s*\n\s*@Deprecatedpublic',
            '@Repository\npublic',
            content
        )
        
        # 패턴 4: 여러 줄에 걸친 중복 @Deprecated 주석 블록 제거
        # 파일 시작 부분의 반복되는 주석 패턴 제거
        lines = content.split('\n')
        new_lines = []
        skip_deprecated_block = False
        i = 0
        
        while i < len(lines):
            line = lines[i]
            
            # 중복된 @Deprecated 주석 블록 시작 감지
            if re.match(r'^\s*/\*\*\s*$', line) and i + 1 < len(lines):
                next_line = lines[i + 1]
                if '@Deprecated' in next_line:
                    # 이 블록이 package 선언 바로 앞에 있는지 확인
                    j = i + 1
                    while j < len(lines) and j < i + 10:  # 최대 10줄 확인
                        if '@Deprecatedpackage' in lines[j] or '@Deprecatedpublic' in lines[j]:
                            # package 선언 바로 앞이므로 이 블록들을 모두 건너뛰기
                            while j < len(lines) and ('@Deprecated' in lines[j] or 
                                                      re.match(r'^\s*/\*\*', lines[j]) or
                                                      re.match(r'^\s*\*/', lines[j]) or
                                                      re.match(r'^\s*\*', lines[j])):
                                j += 1
                            if '@Deprecatedpackage' in lines[j]:
                                # package 선언 줄로 교체
                                new_lines.append(lines[j].replace('@Deprecatedpackage', 'package'))
                                i = j + 1
                                skip_deprecated_block = True
                                break
                            elif '@Deprecatedpublic' in lines[j]:
                                # public interface 줄로 교체
                                new_lines.append(lines[j].replace('@Deprecatedpublic', 'public'))
                                i = j + 1
                                skip_deprecated_block = True
                                break
                        j += 1
                    
                    if skip_deprecated_block:
                        skip_deprecated_block = False
                        continue
            
            # 일반적인 경우: 줄 추가
            if not skip_deprecated_block:
                new_lines.append(line)
            i += 1
        
        content = '\n'.join(new_lines)
        
        # 최종 정리: 남아있는 @Deprecatedpackage, @Deprecatedpublic 패턴 수정
        content = content.replace('@Deprecatedpackage', 'package')
        content = re.sub(r'@Deprecatedpublic\s+interface', 'public interface', content)
        content = re.sub(r'@Deprecatedpublic\s+class', 'public class', content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"[ERROR] {file_path}: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("사용법: python fix_repository_syntax.py <프로젝트_루트>")
        sys.exit(1)
    
    root_dir = Path(sys.argv[1])
    
    if not root_dir.exists():
        print(f"[ERROR] 디렉토리를 찾을 수 없습니다: {root_dir}")
        sys.exit(1)
    
    print("=" * 80)
    print("Repository 파일 문법 오류 수정 스크립트")
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

