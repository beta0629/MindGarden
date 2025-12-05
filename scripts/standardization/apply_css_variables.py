#!/usr/bin/env python3
"""
CSS 변수 적용 스크립트
표준화 2025-12-05: 주석으로 제안된 색상값을 실제 CSS 변수로 변경

작업 내용:
1. 주석으로 제안된 색상값 찾기
2. CSS 변수로 실제 변경
3. CSS_VARIABLES 상수 사용
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
    "cssConstants.js",   # CSS 상수 파일은 제외
]

# 색상 매핑 (일반적인 색상값 -> CSS 변수)
COLOR_MAPPING = {
    '#ffffff': 'var(--mg-white)',
    '#fff': 'var(--mg-white)',
    '#000000': 'var(--mg-black)',
    '#000': 'var(--mg-black)',
    '#f5f5f5': 'var(--mg-gray-100)',
    '#e0e0e0': 'var(--mg-gray-200)',
    '#bdbdbd': 'var(--mg-gray-300)',
    '#9e9e9e': 'var(--mg-gray-400)',
    '#757575': 'var(--mg-gray-500)',
    '#616161': 'var(--mg-gray-600)',
    '#424242': 'var(--mg-gray-700)',
    '#212121': 'var(--mg-gray-800)',
    '#2c3e50': 'var(--mg-gray-900)',
    '#495057': 'var(--mg-gray-600)',
    '#e9ecef': 'var(--mg-gray-200)',
}

def should_exclude_file(file_path):
    """파일이 제외 대상인지 확인"""
    file_str = str(file_path)
    for pattern in EXCLUDE_PATTERNS:
        if pattern in file_str:
            return True
    return False

def process_file(file_path):
    """파일 처리"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        modified = False
        lines = content.split('\n')
        new_lines = []
        
        i = 0
        while i < len(lines):
            line = lines[i]
            new_line = line
            
            # 주석으로 제안된 색상값 찾기
            if '⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요' in line:
                # 다음 줄에서 색상값 찾기
                if i + 1 < len(lines):
                    next_line = lines[i + 1]
                    # hex 색상 찾기
                    hex_match = re.search(r'#([0-9a-fA-F]{3,6})', next_line)
                    if hex_match:
                        hex_color = '#' + hex_match.group(1)
                        if hex_color in COLOR_MAPPING:
                            # 주석 제거하고 색상값 변경
                            css_var = COLOR_MAPPING[hex_color]
                            # 다음 줄의 색상값을 CSS 변수로 변경
                            new_next_line = re.sub(
                                rf'{re.escape(hex_color)}\b',
                                css_var,
                                next_line
                            )
                            new_lines.append(new_line.replace('⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요', '// 표준화 2025-12-05: CSS 변수로 변경 완료'))
                            new_lines.append(new_next_line)
                            modified = True
                            i += 2
                            continue
            
            new_lines.append(new_line)
            i += 1
        
        if modified:
            new_content = '\n'.join(new_lines)
            # 백업 파일 생성
            backup_path = file_path.with_suffix(file_path.suffix + '.backup2')
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
    
    print("[START] CSS 변수 적용 스크립트 시작")
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
    print("[NOTE] 백업 파일은 .backup2 확장자로 저장되었습니다.")

if __name__ == "__main__":
    main()

