#!/usr/bin/env python3
"""
색상 하드코딩 제거 스크립트
표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경

작업 내용:
1. 하드코딩된 색상값 (#hex, rgb, rgba) 검색
2. CSS 변수로 변경 제안 주석 추가
3. 인라인 스타일 색상값을 CSS 변수로 변경
"""

import os
import re
import sys
from pathlib import Path

# 작업 대상 디렉토리
FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend" / "src"

# 제외할 파일/디렉토리
EXCLUDE_PATTERNS = [
    "node_modules",
    ".git",
    "build",
    "dist",
    "__pycache__",
    "*.pyc",
    "*.backup",
    "*_backup.js",
    "*_backup.jsx",
    "css-variables.js",  # CSS 변수 정의 파일은 제외
    "colorThemes.js",    # 테마 파일은 제외
]

# 색상 패턴
COLOR_PATTERNS = [
    (r'#[0-9a-fA-F]{3,6}\b', 'hex'),  # #fff, #ffffff
    (r'rgb\s*\([^)]+\)', 'rgb'),      # rgb(255, 255, 255)
    (r'rgba\s*\([^)]+\)', 'rgba'),    # rgba(255, 255, 255, 0.5)
    (r'color:\s*["\']?#[0-9a-fA-F]{3,6}', 'inline-hex'),
    (r'color:\s*["\']?rgb', 'inline-rgb'),
]

# CSS 변수 매핑 (일반적인 색상)
COLOR_MAPPING = {
    '#ffffff': 'var(--mg-white)',
    '#000000': 'var(--mg-black)',
    '#f5f5f5': 'var(--mg-gray-100)',
    '#e0e0e0': 'var(--mg-gray-200)',
    '#bdbdbd': 'var(--mg-gray-300)',
    '#9e9e9e': 'var(--mg-gray-400)',
    '#757575': 'var(--mg-gray-500)',
    '#616161': 'var(--mg-gray-600)',
    '#424242': 'var(--mg-gray-700)',
    '#212121': 'var(--mg-gray-800)',
    '#000000': 'var(--mg-gray-900)',
}

def should_exclude_file(file_path):
    """파일이 제외 대상인지 확인"""
    file_str = str(file_path)
    for pattern in EXCLUDE_PATTERNS:
        if pattern in file_str:
            return True
    return False

def get_css_variable_suggestion(color_value):
    """CSS 변수 제안"""
    color_lower = color_value.lower()
    
    # 매핑 테이블에서 찾기
    if color_lower in COLOR_MAPPING:
        return COLOR_MAPPING[color_lower]
    
    # hex 색상인 경우
    if re.match(r'^#[0-9a-fA-F]{3,6}$', color_value):
        return f'var(--mg-custom-{color_value[1:]})'  # #ffffff -> var(--mg-custom-ffffff)
    
    # rgb/rgba인 경우
    if 'rgb' in color_value.lower():
        return 'var(--mg-custom-color)'  # 일반적인 변수명 제안
    
    return None

def process_file(file_path):
    """파일 처리"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        modified = False
        lines = content.split('\n')
        new_lines = []
        
        for i, line in enumerate(lines):
            original_line = line
            new_line = line
            
            # 색상 패턴 검색
            for pattern, pattern_type in COLOR_PATTERNS:
                matches = re.finditer(pattern, line)
                for match in matches:
                    color_value = match.group(0)
                    
                    # 이미 CSS 변수인 경우 스킵
                    if 'var(--' in line or '표준화 2025-12-05' in line:
                        continue
                    
                    # 주석 처리된 경우 스킵
                    if line.strip().startswith('//') or line.strip().startswith('/*'):
                        continue
                    
                    # CSS 변수 제안
                    css_var = get_css_variable_suggestion(color_value)
                    if css_var:
                        indent = len(line) - len(line.lstrip())
                        # 주석 추가
                        comment = f"{' ' * indent}// ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: {color_value} -> {css_var}\n"
                        new_line = comment + new_line
                        modified = True
            
            new_lines.append(new_line)
        
        if modified:
            new_content = '\n'.join(new_lines)
            # 백업 파일 생성
            backup_path = file_path.with_suffix(file_path.suffix + '.backup')
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(original_content)
            
            # 원본 파일 수정
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            return True
        
        return False
    
    except Exception as e:
        print(f"[ERROR] 오류 발생 ({file_path}): {e}")
        return False

def main():
    """메인 함수"""
    # Windows 호환성을 위한 인코딩 설정
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    
    print("[START] 색상 하드코딩 제거 스크립트 시작")
    print(f"[INFO] 작업 디렉토리: {FRONTEND_DIR}")
    
    if not FRONTEND_DIR.exists():
        print(f"[ERROR] 디렉토리가 존재하지 않습니다: {FRONTEND_DIR}")
        sys.exit(1)
    
    # JavaScript/JSX 파일 찾기
    js_files = []
    for ext in ['*.js', '*.jsx', '*.ts', '*.tsx']:
        js_files.extend(FRONTEND_DIR.rglob(ext))
    
    # 제외 파일 필터링
    js_files = [f for f in js_files if not should_exclude_file(f)]
    
    print(f"[INFO] 발견된 파일 수: {len(js_files)}")
    
    # 파일 처리
    modified_count = 0
    for file_path in js_files:
        if process_file(file_path):
            modified_count += 1
            print(f"[MODIFIED] {file_path.relative_to(FRONTEND_DIR)}")
    
    print(f"\n[COMPLETE] 완료: {modified_count}개 파일 수정됨")
    print("[NOTE] 백업 파일은 .backup 확장자로 저장되었습니다.")
    print("[NOTE] 주석을 확인하고 실제 CSS 변수로 변경하세요.")

if __name__ == "__main__":
    main()

