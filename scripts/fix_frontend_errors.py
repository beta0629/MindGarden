#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
프론트엔드 컴파일 오류 일괄 수정 스크립트
- JSDoc 주석 형식 오류 수정
- Button import 오류 수정
- JSX 구조 오류 수정
"""

import os
import re
from pathlib import Path

FRONTEND_DIR = Path("frontend/src")

def fix_jsdoc_comments(content):
    """JSDoc 주석 형식 오류 수정: `* 설명` -> `/** 설명`"""
    lines = content.split('\n')
    fixed_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # 파일 첫 줄이 `* 설명` 형식인 경우
        if i == 0 and re.match(r'^\s*\*\s+', line):
            fixed_lines.append('/**')
            fixed_lines.append(line)
            i += 1
            continue
        
        # import 문 다음에 바로 `* 설명` 형식이 오는 경우
        if i > 0 and lines[i-1].strip().startswith('import') and re.match(r'^\s*\*\s+', line):
            fixed_lines.append('/**')
            fixed_lines.append(line)
            i += 1
            continue
        
        # 빈 줄 다음에 `* 설명` 형식이 오는 경우 (import나 다른 문 다음)
        if i > 0 and lines[i-1].strip() == '' and re.match(r'^\s*\*\s+', line):
            # 이전 줄들을 확인하여 import나 다른 문이 있는지 확인
            prev_idx = i - 2
            while prev_idx >= 0 and lines[prev_idx].strip() == '':
                prev_idx -= 1
            if prev_idx >= 0 and (lines[prev_idx].strip().startswith('import') or 
                                  lines[prev_idx].strip().startswith('export') or
                                  lines[prev_idx].strip().endswith(';') or
                                  lines[prev_idx].strip().endswith(')')):
                fixed_lines.append('/**')
                fixed_lines.append(line)
                i += 1
                continue
        
        # 함수 내부에서 `* 설명` 다음에 `*/`가 오는 경우 (잘못된 JSDoc)
        if re.match(r'^\s*\*\s+', line) and i < len(lines) - 1:
            # 다음 몇 줄을 확인하여 `*/`가 있는지 확인
            found_closing = False
            for j in range(i + 1, min(i + 10, len(lines))):
                if '*/' in lines[j]:
                    found_closing = True
                    break
                if not re.match(r'^\s*\*', lines[j]) and lines[j].strip() != '':
                    break
            if found_closing:
                # 이전 줄이 `/**`로 시작하지 않으면 추가
                if i == 0 or not lines[i-1].strip().startswith('/**'):
                    fixed_lines.append('/**')
                    fixed_lines.append(line)
                    i += 1
                    continue
        
        fixed_lines.append(line)
        i += 1
    
    return '\n'.join(fixed_lines)

def fix_button_imports(content):
    """Button import 오류 수정: `import { Button }` -> `import Button`"""
    # `import { Button } from` -> `import Button from`
    content = re.sub(
        r'import\s+\{\s*Button\s*\}\s+from',
        'import Button from',
        content
    )
    return content

def fix_jsx_structure(content, filepath):
    """JSX 구조 오류 수정"""
    lines = content.split('\n')
    fixed_lines = []
    i = 0
    
    # PermissionManagement.js: JSX 구조 오류 수정
    if 'PermissionManagement.js' in str(filepath):
        while i < len(lines):
            line = lines[i]
            # 514번째 줄 근처에서 중복된 </div> 제거
            if 510 <= i <= 520 and '</div>' in line:
                # 다음 줄이 </SimpleLayout>이면 이 </div>는 제거
                if i + 1 < len(lines) and '</SimpleLayout>' in lines[i + 1]:
                    # 이전 줄들을 확인하여 실제로 중복인지 확인
                    prev_idx = i - 1
                    div_count = 0
                    while prev_idx >= 0 and prev_idx >= i - 10:
                        if '<div' in lines[prev_idx] and not lines[prev_idx].strip().endswith('/>'):
                            div_count += 1
                        elif '</div>' in lines[prev_idx]:
                            div_count -= 1
                        prev_idx -= 1
                    if div_count > 0:
                        # 중복된 </div> 제거
                        i += 1
                        continue
            fixed_lines.append(line)
            i += 1
        return '\n'.join(fixed_lines)
    
    # TaxManagement.js: JSX 구조 오류 수정
    if 'TaxManagement.js' in str(filepath):
        while i < len(lines):
            line = lines[i]
            # 368-373번째 줄: JSX 구조 수정
            if '{loading && (' in line:
                fixed_lines.append(line)
                i += 1
                if i < len(lines) and '<>' in lines[i]:
                    # 이미 Fragment로 감싸져 있음
                    fixed_lines.append(lines[i])
                    i += 1
                    if i < len(lines) and '<UnifiedLoading' in lines[i]:
                        fixed_lines.append(lines[i])
                        i += 1
                        if i < len(lines) and '<p>' in lines[i]:
                            fixed_lines.append(lines[i])
                            i += 1
                            if i < len(lines) and '</>' in lines[i]:
                                fixed_lines.append(lines[i])
                                i += 1
                                if i < len(lines) and '</div>' in lines[i]:
                                    fixed_lines.append(lines[i])
                                    i += 1
                                    continue
            fixed_lines.append(line)
            i += 1
        return '\n'.join(fixed_lines)
    
    return content

def process_file(filepath):
    """파일 처리"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 1. JSDoc 주석 형식 수정
        content = fix_jsdoc_comments(content)
        
        # 2. Button import 수정
        content = fix_button_imports(content)
        
        # 3. JSX 구조 오류 수정
        content = fix_jsx_structure(content, filepath)
        
        # 변경사항이 있으면 파일 저장
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    except Exception as e:
        print(f"오류 발생 ({filepath}): {e}")
        return False

def main():
    """메인 함수"""
    if not FRONTEND_DIR.exists():
        print(f"오류: {FRONTEND_DIR} 디렉토리를 찾을 수 없습니다.")
        return
    
    print("프론트엔드 오류 일괄 수정 시작...")
    print(f"대상 디렉토리: {FRONTEND_DIR}")
    
    # .js 파일 찾기
    js_files = list(FRONTEND_DIR.rglob("*.js"))
    print(f"총 {len(js_files)}개 파일 발견")
    
    fixed_count = 0
    for js_file in js_files:
        if process_file(js_file):
            fixed_count += 1
            print(f"수정됨: {js_file.relative_to(FRONTEND_DIR)}")
    
    print(f"\n완료: {fixed_count}개 파일 수정됨")

if __name__ == "__main__":
    main()

