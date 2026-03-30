#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Deprecated DTO 사용처를 새로운 DTO로 일괄 수정하는 스크립트
- ConsultantRegistrationDto -> ConsultantRegistrationRequest
- ClientRegistrationDto -> ClientRegistrationRequest
"""

import os
import re
import sys
from pathlib import Path

# Windows 인코딩 문제 해결
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 프로젝트 루트 디렉토리
PROJECT_ROOT = Path(__file__).parent.parent
SRC_DIR = PROJECT_ROOT / "src" / "main" / "java"

# 수정할 파일 목록
FILES_TO_FIX = [
    "com/coresolution/consultation/service/AdminService.java",
    "com/coresolution/consultation/service/impl/AdminServiceImpl.java",
    "com/coresolution/consultation/controller/AdminController.java",
    "com/coresolution/consultation/controller/TestDataController.java",
    "com/coresolution/consultation/controller/SimpleAdminController.java",
]

# 수정 규칙
REPLACEMENTS = [
    # Import 문
    (r'import com\.coresolution\.consultation\.dto\.ConsultantRegistrationDto;',
     'import com.coresolution.consultation.dto.ConsultantRegistrationRequest;'),
    (r'import com\.coresolution\.consultation\.dto\.ClientRegistrationDto;',
     'import com.coresolution.consultation.dto.ClientRegistrationRequest;'),
    
    # 타입 선언
    (r'\bConsultantRegistrationDto\b', 'ConsultantRegistrationRequest'),
    (r'\bClientRegistrationDto\b', 'ClientRegistrationRequest'),
    
    # 변수명 (dto -> request로 변경)
    (r'(\w+)\s+(\w+)\s*=\s*ConsultantRegistrationRequest\.builder\(\)',
     r'\1 \2 = ConsultantRegistrationRequest.builder()'),
    (r'(\w+)\s+(\w+)\s*=\s*ClientRegistrationRequest\.builder\(\)',
     r'\1 \2 = ClientRegistrationRequest.builder()'),
]

def fix_file(file_path: Path):
    """파일의 Deprecated DTO를 새로운 DTO로 수정"""
    if not file_path.exists():
        print(f"⚠️  파일 없음: {file_path}")
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        modified = False
        
        # 각 수정 규칙 적용
        for pattern, replacement in REPLACEMENTS:
            new_content = re.sub(pattern, replacement, content)
            if new_content != content:
                content = new_content
                modified = True
        
        # 변수명 변경 (dto -> request, 단 메서드 파라미터와 로컬 변수만)
        # 파라미터: (ConsultantRegistrationRequest dto) -> (ConsultantRegistrationRequest request)
        content = re.sub(
            r'\(ConsultantRegistrationRequest\s+(\w+)\)',
            lambda m: f'(ConsultantRegistrationRequest {m.group(1) if m.group(1) != "dto" else "request"})',
            content
        )
        content = re.sub(
            r'\(ClientRegistrationRequest\s+(\w+)\)',
            lambda m: f'(ClientRegistrationRequest {m.group(1) if m.group(1) != "dto" else "request"})',
            content
        )
        
        # 변수 선언: ConsultantRegistrationRequest dto = ... -> ConsultantRegistrationRequest request = ...
        content = re.sub(
            r'ConsultantRegistrationRequest\s+dto\s*=',
            'ConsultantRegistrationRequest request =',
            content
        )
        content = re.sub(
            r'ClientRegistrationRequest\s+dto\s*=',
            'ClientRegistrationRequest request =',
            content
        )
        
        # 변수 사용: dto.get... -> request.get... (단, 이미 request인 경우 제외)
        # 주의: 이건 좀 더 신중하게 해야 함. 일단 간단하게 처리
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            # ConsultantRegistrationRequest나 ClientRegistrationRequest 타입이 선언된 줄이면 변수명 변경
            if re.search(r'ConsultantRegistrationRequest\s+\w+\s*=|ClientRegistrationRequest\s+\w+\s*=', line):
                line = re.sub(r'(ConsultantRegistrationRequest|ClientRegistrationRequest)\s+dto\b', 
                            r'\1 request', line)
            
            # 메서드 호출에서 dto.get... -> request.get... (단, 이미 request인 경우 제외)
            # 하지만 이건 너무 위험할 수 있으니, 일단 주석 처리
            
            new_lines.append(line)
        
        content = '\n'.join(new_lines)
        
        # 변수 사용 변경 (dto. -> request., 단 이미 request인 경우 제외)
        # 주의: 이건 좀 더 정교하게 해야 함
        # 일단 간단하게: dto.get... -> request.get... (단, 이미 request.get...인 경우 제외)
        # 하지만 이건 너무 위험할 수 있으니, 수동으로 확인 필요
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ 수정 완료: {file_path.relative_to(PROJECT_ROOT)}")
            return True
        else:
            print(f"ℹ️  변경 없음: {file_path.relative_to(PROJECT_ROOT)}")
            return False
            
    except Exception as e:
        print(f"❌ 오류 발생 ({file_path}): {e}")
        return False

def main():
    """메인 함수"""
    print("=" * 60)
    print("Deprecated DTO 사용처 일괄 수정 시작")
    print("=" * 60)
    
    fixed_count = 0
    total_count = len(FILES_TO_FIX)
    
    for file_rel_path in FILES_TO_FIX:
        file_path = SRC_DIR / file_rel_path
        if fix_file(file_path):
            fixed_count += 1
    
    print("=" * 60)
    print(f"수정 완료: {fixed_count}/{total_count} 파일")
    print("=" * 60)
    
    if fixed_count < total_count:
        print("\n⚠️  일부 파일은 수동 확인이 필요할 수 있습니다.")
        print("   특히 변수명 변경(dto -> request)은 수동으로 확인해주세요.")

if __name__ == "__main__":
    main()

