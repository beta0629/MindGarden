#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
모든 Deprecated DTO 사용처를 일괄 수정하는 스크립트
- ScheduleDto -> ScheduleResponse
- ScheduleResponseDto -> ScheduleResponse
- ScheduleCreateDto -> ScheduleCreateRequest
- ConsultantClientMappingDto -> ConsultantClientMappingCreateRequest
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
    "com/coresolution/consultation/controller/ScheduleController.java",
    "com/coresolution/consultation/service/ScheduleService.java",
    "com/coresolution/consultation/service/impl/ScheduleServiceImpl.java",
    "com/coresolution/consultation/service/impl/PaymentServiceImpl.java",
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
        
        # Import 문 수정
        replacements = [
            # Import
            (r'import com\.coresolution\.consultation\.dto\.ScheduleDto;',
             'import com.coresolution.consultation.dto.ScheduleResponse;'),
            (r'import com\.coresolution\.consultation\.dto\.ScheduleResponseDto;',
             'import com.coresolution.consultation.dto.ScheduleResponse;'),
            (r'import com\.coresolution\.consultation\.dto\.ScheduleCreateDto;',
             'import com.coresolution.consultation.dto.ScheduleCreateRequest;'),
            (r'import com\.coresolution\.consultation\.dto\.ConsultantClientMappingDto;',
             'import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;'),
            
            # 타입 선언 (단, 변수명은 유지)
            (r'\bScheduleDto\b', 'ScheduleResponse'),
            (r'\bScheduleResponseDto\b', 'ScheduleResponse'),
            (r'\bScheduleCreateDto\b', 'ScheduleCreateRequest'),
            (r'\bConsultantClientMappingDto\b', 'ConsultantClientMappingCreateRequest'),
            
            # Builder 패턴
            (r'ScheduleDto\.builder\(\)', 'ScheduleResponse.builder()'),
            (r'ScheduleResponseDto\.builder\(\)', 'ScheduleResponse.builder()'),
            (r'ScheduleCreateDto\.builder\(\)', 'ScheduleCreateRequest.builder()'),
            (r'ConsultantClientMappingDto\.builder\(\)', 'ConsultantClientMappingCreateRequest.builder()'),
            
            # from 메서드 호출
            (r'ScheduleResponseDto\.from\(', 'ScheduleResponse.from('),
        ]
        
        for pattern, replacement in replacements:
            new_content = re.sub(pattern, replacement, content)
            if new_content != content:
                content = new_content
                modified = True
        
        # 변수명 변경 (dto -> request, 단 이미 request인 경우 제외)
        # 파라미터: (ScheduleResponse dto) -> (ScheduleResponse request)
        content = re.sub(
            r'\(ScheduleResponse\s+(\w+)\)',
            lambda m: f'(ScheduleResponse {m.group(1) if m.group(1) != "dto" else "request"})',
            content
        )
        content = re.sub(
            r'\(ScheduleCreateRequest\s+(\w+)\)',
            lambda m: f'(ScheduleCreateRequest {m.group(1) if m.group(1) != "dto" else "request"})',
            content
        )
        content = re.sub(
            r'\(ConsultantClientMappingCreateRequest\s+(\w+)\)',
            lambda m: f'(ConsultantClientMappingCreateRequest {m.group(1) if m.group(1) != "dto" else "request"})',
            content
        )
        
        # 변수 선언: ScheduleResponse dto = ... -> ScheduleResponse request = ...
        content = re.sub(
            r'ScheduleResponse\s+dto\s*=',
            'ScheduleResponse request =',
            content
        )
        content = re.sub(
            r'ScheduleCreateRequest\s+dto\s*=',
            'ScheduleCreateRequest request =',
            content
        )
        content = re.sub(
            r'ConsultantClientMappingCreateRequest\s+dto\s*=',
            'ConsultantClientMappingCreateRequest request =',
            content
        )
        content = re.sub(
            r'ConsultantClientMappingCreateRequest\s+mappingDto\s*=',
            'ConsultantClientMappingCreateRequest mappingRequest =',
            content
        )
        
        # 변수 사용: dto. -> request. (단, 이미 request인 경우 제외)
        # 주의: 이건 좀 더 신중하게 해야 함
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            # 변수명 변경 (dto -> request, mappingDto -> mappingRequest)
            if 'mappingDto' in line and 'ConsultantClientMappingCreateRequest' not in line:
                line = line.replace('mappingDto', 'mappingRequest')
            elif 'dto.' in line and 'request.' not in line and 'ScheduleResponse' in line:
                # ScheduleResponse 관련 변수명 변경
                line = re.sub(r'(\w+)\.dto\.', r'\1.request.', line)
            elif 'dto.' in line and 'request.' not in line and 'ScheduleCreateRequest' in line:
                line = re.sub(r'(\w+)\.dto\.', r'\1.request.', line)
            elif 'dto.' in line and 'request.' not in line:
                # 일반적인 경우: dto -> request
                line = re.sub(r'\bdto\.', 'request.', line)
            
            new_lines.append(line)
        
        content = '\n'.join(new_lines)
        
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
        import traceback
        traceback.print_exc()
        return False

def main():
    """메인 함수"""
    print("=" * 60)
    print("모든 Deprecated DTO 사용처 일괄 수정 시작")
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

