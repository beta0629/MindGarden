#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
헬퍼 메서드 위치 수정 스크립트
잘못된 위치(상수 클래스, enum)에 추가된 헬퍼 메서드를 제거

헬퍼 메서드는 다음 위치에만 있어야 함:
- Controller 클래스 (private 메서드)
- Service 클래스 (private 메서드)
- Utils 클래스 (public static 메서드)
"""

import os
import re
import sys
import io
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

PROJECT_ROOT = Path(__file__).parent.parent.parent
JAVA_SRC = PROJECT_ROOT / "src" / "main" / "java" / "com" / "coresolution" / "consultation"

# 헬퍼 메서드가 있으면 안 되는 파일들 (상수 클래스, enum)
FORBIDDEN_FILES = [
    'CommonCodeConstants.java',
    'UserRole.java',
    'UserRoles.java',
    'ScheduleConstants.java',
]

def remove_helper_methods(content, file_path):
    """헬퍼 메서드 제거"""
    original_content = content
    modified = False
    
    # isAdminRoleFromCommonCode 메서드 제거
    pattern1 = r'/\*\*[\s\S]*?공통코드에서 관리자 역할인지 확인[\s\S]*?\*/\s*private\s+boolean\s+isAdminRoleFromCommonCode\([^)]+\)\s*\{[\s\S]*?\n\s*\}'
    if re.search(pattern1, content):
        content = re.sub(pattern1, '', content)
        modified = True
    
    # isStaffRoleFromCommonCode 메서드 제거
    pattern2 = r'/\*\*[\s\S]*?공통코드에서 사무원 역할인지 확인[\s\S]*?\*/\s*private\s+boolean\s+isStaffRoleFromCommonCode\([^)]+\)\s*\{[\s\S]*?\n\s*\}'
    if re.search(pattern2, content):
        content = re.sub(pattern2, '', content)
        modified = True
    
    # 관련 import 제거 (CommonCode, List 등이 더 이상 사용되지 않는 경우)
    if modified:
        # CommonCode import가 사용되지 않으면 제거
        if 'CommonCode' not in content and 'import.*CommonCode' in content:
            content = re.sub(r'import\s+com\.coresolution\.consultation\.entity\.CommonCode;\s*\n', '', content)
        
        # List import가 사용되지 않으면 제거
        if 'List<' not in content and 'import java.util.List;' in content:
            content = re.sub(r'import\s+java\.util\.List;\s*\n', '', content)
    
    return content, modified

def process_file(file_path):
    """파일 처리"""
    file_name = os.path.basename(file_path)
    
    # 금지된 파일만 처리
    if file_name not in FORBIDDEN_FILES:
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        print(f"[WARN] 인코딩 오류: {file_path}")
        return False
    
    content, modified = remove_helper_methods(content, file_path)
    
    if modified:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"[ERROR] 파일 쓰기 실패: {file_path}, 오류: {e}")
            return False
    
    return False

def main():
    """메인 함수"""
    print("=" * 60)
    print("헬퍼 메서드 위치 수정 스크립트")
    print("=" * 60)
    print("잘못된 위치(상수 클래스, enum)에 추가된 헬퍼 메서드 제거")
    print()
    
    all_files = []
    
    # util 디렉토리
    util_dir = JAVA_SRC / "util"
    if util_dir.exists():
        for root, dirs, files in os.walk(util_dir):
            for file in files:
                if file in FORBIDDEN_FILES:
                    all_files.append(os.path.join(root, file))
    
    # constant 디렉토리
    constant_dir = JAVA_SRC / "constant"
    if constant_dir.exists():
        for root, dirs, files in os.walk(constant_dir):
            for file in files:
                if file in FORBIDDEN_FILES:
                    all_files.append(os.path.join(root, file))
    
    print(f"총 {len(all_files)}개 파일 발견")
    print()
    
    modified_count = 0
    error_count = 0
    
    for file_path in all_files:
        try:
            if process_file(file_path):
                print(f"[OK] 수정: {file_path}")
                modified_count += 1
        except Exception as e:
            print(f"[ERROR] 오류: {file_path}, {e}")
            error_count += 1
    
    print()
    print("=" * 60)
    print("작업 완료")
    print("=" * 60)
    print(f"수정된 파일: {modified_count}개")
    print(f"오류 발생: {error_count}개")

if __name__ == "__main__":
    main()

