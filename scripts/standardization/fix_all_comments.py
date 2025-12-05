#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AdminController 주석 오류 일괄 수정 스크립트
/** 가 빠진 주석들을 모두 수정
"""

import re
import sys
import io
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

PROJECT_ROOT = Path(__file__).parent.parent.parent
ADMIN_CONTROLLER = PROJECT_ROOT / "src" / "main" / "java" / "com" / "coresolution" / "consultation" / "controller" / "AdminController.java"

def fix_all_comments(content):
    """모든 주석 오류 수정"""
    modified = False
    
    # 패턴 1: 공백 + * 로 시작하는 주석 (/** 가 빠진 경우)
    # 예: "    * 상담사 통계 정보 조회" -> "    /**\n     * 상담사 통계 정보 조회"
    # 이전 줄에 /** 가 없고, 다음 줄에 @GetMapping 등이 있는 경우
    pattern1 = r'(\n\s{4,})\*\s+([^\n]+)\n\s+\*\s+([^\n]+)\n\s+(@(?:Get|Post|Put|Delete|Patch)Mapping)'
    
    def replace1(match):
        indent = match.group(1)
        line1 = match.group(2)
        line2 = match.group(3)
        annotation = match.group(4)
        # 이전 100자 내에 /** 가 있는지 확인
        before_text = content[:match.start()]
        if '/**' not in before_text[-100:]:
            return f'{indent}/**\n{indent} * {line1}\n{indent} * {line2}\n{indent} {annotation}'
        return match.group(0)
    
    if re.search(pattern1, content):
        content = re.sub(pattern1, replace1, content)
        modified = True
    
    # 패턴 2: 단일 줄 주석
    pattern2 = r'(\n\s{4,})\*\s+([가-힣][^\n]+)\n\s+(@(?:Get|Post|Put|Delete|Patch)Mapping)'
    
    def replace2(match):
        indent = match.group(1)
        comment = match.group(2)
        annotation = match.group(3)
        before_text = content[:match.start()]
        if '/**' not in before_text[-100:]:
            return f'{indent}/**\n{indent} * {comment}\n{indent} {annotation}'
        return match.group(0)
    
    if re.search(pattern2, content):
        content = re.sub(pattern2, replace2, content)
        modified = True
    
    return content, modified

def main():
    """메인 함수"""
    print("=" * 60)
    print("AdminController 주석 오류 일괄 수정")
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
    content, modified = fix_all_comments(content)
    
    # 수동 수정 패턴들
    manual_fixes = [
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
    
    for pattern, replacement in manual_fixes:
        if re.search(pattern, content):
            # 이전 줄에 /** 가 있는지 확인
            matches = list(re.finditer(pattern, content))
            for match in reversed(matches):  # 뒤에서부터 수정
                before_text = content[:match.start()]
                if '/**' not in before_text[-100:]:
                    content = content[:match.start()] + replacement + content[match.end():]
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
    main()

