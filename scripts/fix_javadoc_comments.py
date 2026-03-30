#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JavaDoc 주석 구문 오류 수정 스크립트
누락된 /** 구문을 자동으로 추가합니다.
"""

import re
import sys

def fix_javadoc_comments(file_path):
    """JavaDoc 주석 구문 오류 수정"""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    fixed_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # 패턴: 공백으로 시작하고 " * "로 시작하지만 "/**"로 시작하지 않는 경우
        if re.match(r'^\s+\*\s+[가-힣]', line):
            # 이전 줄이 비어있거나 코드인지 확인
            if i > 0:
                prev_line = lines[i-1].strip()
                # 이전 줄이 빈 줄이거나 "}" 또는 코드인 경우
                if prev_line == "" or prev_line == "}" or not prev_line.startswith("*"):
                    # /** 주석 시작 추가
                    indent = len(line) - len(line.lstrip())
                    fixed_lines.append(" " * indent + "/**\n")
        
        fixed_lines.append(line)
        i += 1
    
    # 파일에 쓰기
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)
    
    print(f"✅ 수정 완료: {file_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python fix_javadoc_comments.py <파일경로>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    fix_javadoc_comments(file_path)

