#!/usr/bin/env python3
"""
Service Layer에 TenantId 필터링 자동 추가 스크립트

작성자: MindGarden AI
날짜: 2025-11-30
목적: 모든 Service 파일에 TenantContextHolder import 및 tenantId 사용 자동 추가
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple, Set

class TenantFilteringAutomation:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.service_impl_path = self.base_path / "src/main/java/com/coresolution/consultation/service/impl"
        self.modified_files = []
        self.error_files = []
        
        # Repository 메서드 패턴 (deprecated 메서드들)
        self.repository_patterns = [
            # UserRepository
            (r'userRepository\.findByUsername\(', r'userRepository.findByTenantIdAndUsername(tenantId, '),
            (r'userRepository\.findByEmail\(', r'userRepository.findByTenantIdAndEmail(tenantId, '),
            (r'userRepository\.existsByUsername\(', r'userRepository.existsByTenantIdAndUsername(tenantId, '),
            (r'userRepository\.existsByEmail\(', r'userRepository.existsByTenantIdAndEmail(tenantId, '),
            (r'userRepository\.findByRole\(', r'userRepository.findByTenantIdAndRole(tenantId, '),
            (r'userRepository\.findByIsActive\(', r'userRepository.findByTenantIdAndIsActive(tenantId, '),
            (r'userRepository\.findByBranchCode\(', r'userRepository.findByTenantIdAndBranchCode(tenantId, '),
            (r'userRepository\.countByRole\(', r'userRepository.countByTenantIdAndRole(tenantId, '),
            
            # UserSocialAccountRepository
            (r'userSocialAccountRepository\.findByProviderAndProviderUserIdAndIsDeletedFalse\(', 
             r'userSocialAccountRepository.findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(tenantId, '),
            (r'userSocialAccountRepository\.findByUserIdAndIsDeletedFalse\(', 
             r'userSocialAccountRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, '),
            
            # PasswordResetTokenRepository
            (r'passwordResetTokenRepository\.findByToken\(', 
             r'passwordResetTokenRepository.findByTenantIdAndToken(tenantId, '),
            (r'passwordResetTokenRepository\.findByUserIdAndIsUsedFalse\(', 
             r'passwordResetTokenRepository.findByTenantIdAndUserIdAndIsUsedFalse(tenantId, '),
            
            # UserPasskeyRepository
            (r'userPasskeyRepository\.findByCredentialIdAndIsDeletedFalse\(', 
             r'userPasskeyRepository.findByTenantIdAndCredentialIdAndIsDeletedFalse(tenantId, '),
            (r'userPasskeyRepository\.findByUserIdAndIsDeletedFalse\(', 
             r'userPasskeyRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, '),
            
            # AccountRepository
            (r'accountRepository\.findByAccountNumberAndIsDeletedFalse\(', 
             r'accountRepository.findByTenantIdAndAccountNumberAndIsDeletedFalse(tenantId, '),
            (r'accountRepository\.findByIsActiveTrueAndIsDeletedFalse\(', 
             r'accountRepository.findByTenantIdAndIsActiveTrueAndIsDeletedFalse(tenantId, '),
            
            # ConsultantAvailabilityRepository
            (r'consultantAvailabilityRepository\.findByConsultantIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc\(', 
             r'consultantAvailabilityRepository.findByTenantIdAndConsultantIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(tenantId, '),
            
            # SystemConfigRepository
            (r'systemConfigRepository\.findByConfigKeyAndIsActiveTrue\(', 
             r'systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(tenantId, '),
            
            # PermissionRepository
            (r'permissionRepository\.findByPermissionCode\(', 
             r'permissionRepository.findByTenantIdAndPermissionCode(tenantId, '),
        ]
    
    def check_has_tenant_context_holder(self, content: str) -> bool:
        """TenantContextHolder import가 있는지 확인"""
        return 'import com.coresolution.core.context.TenantContextHolder;' in content
    
    def add_tenant_context_holder_import(self, content: str) -> str:
        """TenantContextHolder import 추가"""
        if self.check_has_tenant_context_holder(content):
            return content
        
        # import 섹션 찾기
        import_pattern = r'(import com\.coresolution\.consultation\..*?;\n)'
        matches = list(re.finditer(import_pattern, content))
        
        if matches:
            # 마지막 consultation import 뒤에 추가
            last_match = matches[-1]
            insert_pos = last_match.end()
            new_content = (
                content[:insert_pos] + 
                'import com.coresolution.core.context.TenantContextHolder;\n' +
                content[insert_pos:]
            )
            return new_content
        
        return content
    
    def add_tenant_id_to_method(self, content: str, method_start: int) -> Tuple[str, int]:
        """메서드 시작 부분에 tenantId 선언 추가"""
        # 메서드 시작 후 첫 번째 중괄호 찾기
        brace_pos = content.find('{', method_start)
        if brace_pos == -1:
            return content, 0
        
        # 이미 tenantId가 선언되어 있는지 확인
        method_end = self.find_method_end(content, brace_pos)
        method_body = content[brace_pos:method_end]
        
        if 'String tenantId = TenantContextHolder.get' in method_body:
            return content, 0
        
        # tenantId 선언 추가
        indent = self.get_indent_level(content, brace_pos)
        tenant_id_declaration = f'\n{indent}    String tenantId = TenantContextHolder.getRequiredTenantId();\n'
        
        new_content = content[:brace_pos + 1] + tenant_id_declaration + content[brace_pos + 1:]
        return new_content, len(tenant_id_declaration)
    
    def find_method_end(self, content: str, start: int) -> int:
        """메서드의 끝 위치 찾기 (중괄호 매칭)"""
        brace_count = 0
        in_string = False
        escape = False
        
        for i in range(start, len(content)):
            char = content[i]
            
            if escape:
                escape = False
                continue
            
            if char == '\\':
                escape = True
                continue
            
            if char == '"':
                in_string = not in_string
                continue
            
            if in_string:
                continue
            
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    return i
        
        return len(content)
    
    def get_indent_level(self, content: str, pos: int) -> str:
        """현재 위치의 들여쓰기 레벨 가져오기"""
        line_start = content.rfind('\n', 0, pos)
        if line_start == -1:
            line_start = 0
        
        line = content[line_start:pos]
        indent = ''
        for char in line:
            if char in ' \t':
                indent += char
            else:
                break
        
        return indent
    
    def apply_repository_patterns(self, content: str) -> Tuple[str, int]:
        """Repository 호출 패턴 적용"""
        changes = 0
        
        for pattern, replacement in self.repository_patterns:
            new_content = re.sub(pattern, replacement, content)
            if new_content != content:
                changes += content.count(pattern[:20])  # 대략적인 변경 횟수
                content = new_content
        
        return content, changes
    
    def find_methods_needing_tenant_id(self, content: str) -> List[int]:
        """tenantId가 필요한 메서드 위치 찾기"""
        method_positions = []
        
        # Repository 호출이 있는 메서드 찾기
        for pattern, _ in self.repository_patterns:
            for match in re.finditer(pattern, content):
                # 메서드 시작 위치 찾기
                method_start = content.rfind('@Override', 0, match.start())
                if method_start == -1:
                    method_start = content.rfind('public ', 0, match.start())
                if method_start == -1:
                    method_start = content.rfind('private ', 0, match.start())
                
                if method_start != -1 and method_start not in method_positions:
                    method_positions.append(method_start)
        
        return sorted(method_positions)
    
    def process_file(self, file_path: Path) -> bool:
        """파일 처리"""
        try:
            print(f"\n[FILE] 처리 중: {file_path.name}")
            
            # 파일 읽기
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            content = original_content
            total_changes = 0
            
            # 1. TenantContextHolder import 추가
            if not self.check_has_tenant_context_holder(content):
                content = self.add_tenant_context_holder_import(content)
                if content != original_content:
                    print(f"  [OK] TenantContextHolder import 추가")
                    total_changes += 1
            else:
                print(f"  ℹ TenantContextHolder import 이미 존재")
            
            # 2. Repository 패턴 적용
            content, pattern_changes = self.apply_repository_patterns(content)
            if pattern_changes > 0:
                print(f"  [OK] Repository 호출 {pattern_changes}개 수정")
                total_changes += pattern_changes
            
            # 3. 메서드에 tenantId 선언 추가
            method_positions = self.find_methods_needing_tenant_id(content)
            if method_positions:
                offset = 0
                for method_pos in method_positions:
                    adjusted_pos = method_pos + offset
                    content, added_length = self.add_tenant_id_to_method(content, adjusted_pos)
                    offset += added_length
                
                if offset > 0:
                    print(f"  [OK] {len(method_positions)}개 메서드에 tenantId 선언 추가")
                    total_changes += len(method_positions)
            
            # 변경사항이 있으면 파일 저장
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                self.modified_files.append(file_path.name)
                print(f"  [SUCCESS] 완료: {total_changes}개 변경사항 적용")
                return True
            else:
                print(f"  ℹ 변경사항 없음")
                return False
            
        except Exception as e:
            print(f"  [ERROR] 오류: {str(e)}")
            self.error_files.append((file_path.name, str(e)))
            return False
    
    def process_all_services(self) -> None:
        """모든 Service 파일 처리"""
        print("=" * 80)
        print("[START] Service Layer TenantId 필터링 자동화 시작")
        print("=" * 80)
        
        # Service 파일 목록 가져오기
        service_files = list(self.service_impl_path.glob("*ServiceImpl.java"))
        print(f"\n[INFO] 총 {len(service_files)}개 파일 발견")
        
        # 각 파일 처리
        success_count = 0
        for file_path in sorted(service_files):
            if self.process_file(file_path):
                success_count += 1
        
        # 결과 출력
        print("\n" + "=" * 80)
        print("[INFO] 처리 결과")
        print("=" * 80)
        print(f"[SUCCESS] 성공: {success_count}개")
        print(f"[INFO]  변경 없음: {len(service_files) - success_count - len(self.error_files)}개")
        print(f"[ERROR] 실패: {len(self.error_files)}개")
        
        if self.modified_files:
            print(f"\n[SUCCESS] 수정된 파일 ({len(self.modified_files)}개):")
            for file_name in sorted(self.modified_files):
                print(f"  - {file_name}")
        
        if self.error_files:
            print(f"\n[ERROR] 오류 발생 파일 ({len(self.error_files)}개):")
            for file_name, error in self.error_files:
                print(f"  - {file_name}: {error}")
        
        print("\n" + "=" * 80)
        print("[DONE] 자동화 완료!")
        print("=" * 80)

def main():
    # 프로젝트 루트 경로
    if len(sys.argv) > 1:
        base_path = sys.argv[1]
    else:
        # 기본 경로 (스크립트가 MindGarden/scripts에 있다고 가정)
        base_path = Path(__file__).parent.parent
    
    automation = TenantFilteringAutomation(str(base_path))
    automation.process_all_services()

if __name__ == "__main__":
    main()

