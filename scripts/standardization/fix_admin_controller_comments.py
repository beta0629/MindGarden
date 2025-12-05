#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AdminController 주석 오류 수정 스크립트
/** 가 빠진 주석들을 수정
"""

import os
import re
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

PROJECT_ROOT = Path(__file__).parent.parent.parent
ADMIN_CONTROLLER = PROJECT_ROOT / "src" / "main" / "java" / "com" / "coresolution" / "consultation" / "controller" / "AdminController.java"

def fix_comments(content):
    """주석 오류 수정"""
    modified = False
    
    # 패턴: 공백 + * 로 시작하는 주석 (/** 가 빠진 경우)
    # 예: "    * 상담사 통계 정보 조회" -> "/**\n     * 상담사 통계 정보 조회"
    pattern = r'(\n\s+)\*\s+([가-힣].*?)\n\s+\*\s+(GET|POST|PUT|DELETE|PATCH)'
    
    def replace_comment(match):
        indent = match.group(1)
        comment_text = match.group(2)
        http_method = match.group(3)
        return f'{indent}/**\n{indent} * {comment_text}\n{indent} * {http_method}'
    
    if re.search(pattern, content):
        content = re.sub(pattern, replace_comment, content)
        modified = True
    
    # 다른 패턴: 단순히 * 로 시작하는 주석
    # 예: "     * 내담자 통계 정보 조회" -> "    /**\n     * 내담자 통계 정보 조회"
    pattern2 = r'(\n\s{4,})\*\s+([가-힣].*?조회|.*?목록|.*?통계|.*?정보)'
    
    def replace_comment2(match):
        indent = match.group(1)
        comment_text = match.group(2)
        # 이미 /** 가 있는지 확인
        lines_before = content[:match.start()].split('\n')
        if len(lines_before) > 0 and '/**' in lines_before[-1]:
            return match.group(0)  # 이미 /** 가 있으면 변경하지 않음
        return f'{indent}/**\n{indent} * {comment_text}'
    
    # 더 정확한 패턴: @GetMapping, @PostMapping 등 앞에 주석이 없는 경우
    pattern3 = r'(\n\s{4,})\*\s+([^\n]+)\n\s+\*\s+([^\n]+)\n\s+(@(?:Get|Post|Put|Delete|Patch)Mapping)'
    
    def replace_comment3(match):
        indent = match.group(1)
        line1 = match.group(2)
        line2 = match.group(3)
        annotation = match.group(4)
        # 이전 줄에 /** 가 있는지 확인
        before_text = content[:match.start()]
        if '/**' not in before_text[-50:]:  # 최근 50자 내에 /** 가 없으면
            return f'{indent}/**\n{indent} * {line1}\n{indent} * {line2}\n{indent} {annotation}'
        return match.group(0)
    
    if re.search(pattern3, content):
        content = re.sub(pattern3, replace_comment3, content)
        modified = True
    
    return content, modified

def main():
    """메인 함수"""
    print("=" * 60)
    print("AdminController 주석 오류 수정 스크립트")
    print("=" * 60)
    print()
    
    if not ADMIN_CONTROLLER.exists():
        print(f"[ERROR] 파일을 찾을 수 없습니다: {ADMIN_CONTROLLER}")
        return
    
    try:
        with open(ADMIN_CONTROLLER, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"[ERROR] 파일 읽기 실패: {e}")
        return
    
    original_content = content
    content, modified = fix_comments(content)
    
    # 수동으로 명확한 패턴 수정
    fixes = [
        (r'(\n\s{4,})\*\s+내담자 통계 정보 조회', r'\1/**\n\1 * 내담자 통계 정보 조회'),
        (r'(\n\s{4,})\*\s+전체 내담자 통계 정보 조회', r'\1/**\n\1 * 전체 내담자 통계 정보 조회'),
        (r'(\n\s{4,})\*\s+회기관리 통계 조회', r'\1/**\n\1 * 회기관리 통계 조회'),
        (r'(\n\s{4,})\*\s+회기관리 목록 조회', r'\1/**\n\1 * 회기관리 목록 조회'),
        (r'(\n\s{4,})\*\s+상담사 목록 조회', r'\1/**\n\1 * 상담사 목록 조회'),
        (r'(\n\s{4,})\*\s+휴무 정보를 포함한 상담사 목록 조회', r'\1/**\n\1 * 휴무 정보를 포함한 상담사 목록 조회'),
        (r'(\n\s{4,})\*\s+상담사별 휴가 통계 조회', r'\1/**\n\1 * 상담사별 휴가 통계 조회'),
        (r'(\n\s{4,})\*\s+내담자 목록 조회', r'\1/**\n\1 * 내담자 목록 조회'),
        (r'(\n\s{4,})\*\s+통합 내담자 데이터 조회', r'\1/**\n\1 * 통합 내담자 데이터 조회'),
        (r'(\n\s{4,})\*\s+상담사별 매칭된 내담자 목록 조회', r'\1/**\n\1 * 상담사별 매칭된 내담자 목록 조회'),
        (r'(\n\s{4,})\*\s+내담자별 매칭 조회', r'\1/**\n\1 * 내담자별 매칭 조회'),
        (r'(\n\s{4,})\*\s+매칭 통계 정보 조회', r'\1/**\n\1 * 매칭 통계 정보 조회'),
        (r'(\n\s{4,})\*\s+오늘의 통계 조회', r'\1/**\n\1 * 오늘의 통계 조회'),
        (r'(\n\s{4,})\*\s+입금 대기 통계 조회', r'\1/**\n\1 * 입금 대기 통계 조회'),
        (r'(\n\s{4,})\*\s+오늘의 스케줄 조회', r'\1/**\n\1 * 오늘의 스케줄 조회'),
        (r'(\n\s{4,})\*\s+중복 매칭 조회', r'\1/**\n\1 * 중복 매칭 조회'),
        (r'(\n\s{4,})\*\s+중복 매칭 통합', r'\1/**\n\1 * 중복 매칭 통합'),
    ]
    
    for pattern, replacement in fixes:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True
    
    if modified and content != original_content:
        try:
            with open(ADMIN_CONTROLLER, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[OK] 수정 완료: {ADMIN_CONTROLLER}")
        except Exception as e:
            print(f"[ERROR] 파일 쓰기 실패: {e}")
    else:
        print("[INFO] 수정할 내용이 없습니다.")

if __name__ == "__main__":
    from pathlib import Path
    PROJECT_ROOT = Path(__file__).parent.parent.parent
    ADMIN_CONTROLLER = PROJECT_ROOT / "src" / "main" / "java" / "com" / "coresolution" / "consultation" / "controller" / "AdminController.java"
    main()

