#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
역할 이름 하드코딩 제거 스크립트
표준화 작업: 역할 이름 하드코딩을 UserRole enum 및 공통코드로 변환

작성일: 2025-12-04
"""

import os
import re
import json
import shutil
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Set, Tuple

class RoleHardcodingRemover:
    """역할 이름 하드코딩 제거 클래스"""
    
    def __init__(self, project_root: str, dry_run: bool = True):
        self.project_root = Path(project_root)
        self.dry_run = dry_run
        self.backup_dir = None
        
        if not dry_run:
            self.backup_dir = self.project_root / f"backup-role-hardcoding-removal-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
            self.backup_dir.mkdir(exist_ok=True)
        
        # 역할 이름 매핑 (문자열 -> UserRole enum)
        self.role_mapping = {
            'ADMIN': 'UserRole.ADMIN',
            'CLIENT': 'UserRole.CLIENT',
            'CONSULTANT': 'UserRole.CONSULTANT',
            'STAFF': 'UserRole.STAFF',
            'BRANCH_SUPER_ADMIN': 'UserRole.BRANCH_SUPER_ADMIN',
            'BRANCH_ADMIN': 'UserRole.BRANCH_ADMIN',
            'BRANCH_MANAGER': 'UserRole.BRANCH_MANAGER',
            'HQ_ADMIN': 'UserRole.HQ_ADMIN',
            'SUPER_HQ_ADMIN': 'UserRole.SUPER_HQ_ADMIN',
            'HQ_MASTER': 'UserRole.HQ_MASTER',
            'HQ_SUPER_ADMIN': 'UserRole.HQ_SUPER_ADMIN',
            'DIRECTOR': 'UserRole.ADMIN',  # DIRECTOR는 ADMIN으로 매핑
            'COUNSELOR': 'UserRole.CONSULTANT',  # COUNSELOR는 CONSULTANT로 매핑
        }
        
        # 제외할 파일/디렉토리
        self.exclude_patterns = [
            'node_modules', 'target', '.git', 'backup', '.backup',
            'migration', 'V2__', 'V3__', '.class', '.jar',
            'UserRole.java',  # UserRole enum 자체
            'UserRoles.java',  # UserRoles 상수 클래스
            'CommonCodeConstants.java',  # 공통코드 상수 클래스
            'DashboardConstants.java',  # 대시보드 상수 클래스
            'SecurityRoleConstants.java',  # 보안 역할 상수 클래스
            '.backup.', '.backup', 'backup-',  # 백업 파일
        ]
        
        self.results = {
            'modified_files': [],
            'replacements': [],
            'backed_up': [],
            'errors': [],
            'summary': {
                'files_processed': 0,
                'replacements_made': 0,
                'backend_files': 0,
                'frontend_files': 0,
            }
        }
    
    def should_exclude(self, file_path: Path) -> bool:
        """파일이 제외 대상인지 확인"""
        path_str = str(file_path)
        name = file_path.name
        return any(pattern in path_str or pattern in name for pattern in self.exclude_patterns)
    
    def is_java_file(self, file_path: Path) -> bool:
        """Java 파일인지 확인"""
        return file_path.suffix == '.java' and 'src/main/java' in str(file_path)
    
    def is_js_file(self, file_path: Path) -> bool:
        """JavaScript 파일인지 확인"""
        return file_path.suffix in ['.js', '.jsx'] and 'frontend/src' in str(file_path)
    
    def backup_file(self, file_path: Path) -> bool:
        """파일 백업"""
        if self.dry_run or self.backup_dir is None:
            return True
        
        try:
            relative_path = file_path.relative_to(self.project_root)
            backup_path = self.backup_dir / relative_path
            backup_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(file_path, backup_path)
            self.results['backed_up'].append(str(relative_path))
            return True
        except Exception as e:
            self.results['errors'].append({
                'file': str(file_path),
                'operation': 'backup',
                'error': str(e)
            })
            return False
    
    def replace_role_hardcoding_java(self, content: str, file_path: Path) -> Tuple[str, List[Dict]]:
        """Java 파일에서 역할 하드코딩을 enum으로 변환"""
        replacements = []
        new_content = content
        imports_added = set()
        
        # 패턴 1: .equals("ROLE_NAME") -> == UserRole.ROLE_NAME
        pattern1 = re.compile(r'\.equals\(["\']([A-Z_]+)["\']\)')
        def replace_equals(match):
            role_str = match.group(1)
            if role_str in self.role_mapping:
                enum_value = self.role_mapping[role_str]
                replacements.append({
                    'type': 'equals_to_enum',
                    'original': match.group(0),
                    'replacement': f'== {enum_value}',
                    'role': role_str
                })
                imports_added.add('com.coresolution.consultation.constant.UserRole')
                return f'== {enum_value}'
            return match.group(0)
        
        # 패턴 2: .name().equals("ROLE_NAME") -> == UserRole.ROLE_NAME
        pattern2 = re.compile(r'\.name\(\)\s*\.equals\(["\']([A-Z_]+)["\']\)')
        def replace_name_equals(match):
            role_str = match.group(1)
            if role_str in self.role_mapping:
                enum_value = self.role_mapping[role_str]
                replacements.append({
                    'type': 'name_equals_to_enum',
                    'original': match.group(0),
                    'replacement': f'== {enum_value}',
                    'role': role_str
                })
                imports_added.add('com.coresolution.consultation.constant.UserRole')
                return f'== {enum_value}'
            return match.group(0)
        
        # 패턴 3: role.equals("ROLE_NAME") -> UserRole.ROLE_NAME.name().equals(role) 또는 enum 사용
        # 주의: 이건 컨텍스트에 따라 다르게 처리해야 함
        pattern3 = re.compile(r'(\w+)\s*\.equals\(["\']([A-Z_]+)["\']\)')
        def replace_role_equals(match):
            var_name = match.group(1)
            role_str = match.group(2)
            if role_str in self.role_mapping and var_name.lower() in ['role', 'userrole', 'senderType', 'receiverType']:
                enum_value = self.role_mapping[role_str]
                replacements.append({
                    'type': 'role_equals',
                    'original': match.group(0),
                    'replacement': f'{enum_value}.name().equals({var_name})',
                    'role': role_str
                })
                imports_added.add('com.coresolution.consultation.constant.UserRole')
                return f'{enum_value}.name().equals({var_name})'
            return match.group(0)
        
        # 패턴 4: "ROLE_NAME" -> UserRole.ROLE_NAME.name() (문자열 리터럴)
        pattern4 = re.compile(r'["\']([A-Z_]+)["\']')
        def replace_string_literal(match):
            role_str = match.group(1)
            if role_str in self.role_mapping and role_str in ['ADMIN', 'CLIENT', 'CONSULTANT', 'STAFF']:
                # 컨텍스트 확인: 이미 equals 패턴에 걸린 건 제외
                context = content[max(0, match.start()-20):match.end()+20]
                if '.equals(' not in context and '.name()' not in context:
                    enum_value = self.role_mapping[role_str]
                    replacements.append({
                        'type': 'string_literal_to_enum',
                        'original': match.group(0),
                        'replacement': f'{enum_value}.name()',
                        'role': role_str
                    })
                    imports_added.add('com.coresolution.consultation.constant.UserRole')
                    return f'{enum_value}.name()'
            return match.group(0)
        
        # 패턴 5: roleCode.equals("ROLE") -> UserRole.ROLE.name().equals(roleCode)
        pattern5 = re.compile(r'(\w+Code|\w+Role)\s*\.equals\(["\']([A-Z_]+)["\']\)')
        def replace_code_equals(match):
            var_name = match.group(1)
            role_str = match.group(2)
            if role_str in self.role_mapping:
                enum_value = self.role_mapping[role_str]
                replacements.append({
                    'type': 'code_equals',
                    'original': match.group(0),
                    'replacement': f'{enum_value}.name().equals({var_name})',
                    'role': role_str
                })
                imports_added.add('com.coresolution.consultation.constant.UserRole')
                return f'{enum_value}.name().equals({var_name})'
            return match.group(0)
        
        # 패턴 6: 여러 역할 체크 (role.equals("A") || role.equals("B"))
        pattern6 = re.compile(r'(\w+)\s*\.equals\(["\']([A-Z_]+)["\']\)\s*\|\|')
        def replace_multiple_equals(match):
            var_name = match.group(1)
            role_str = match.group(2)
            if role_str in self.role_mapping and var_name.lower() in ['role']:
                enum_value = self.role_mapping[role_str]
                replacements.append({
                    'type': 'multiple_equals',
                    'original': match.group(0),
                    'replacement': f'{enum_value}.name().equals({var_name}) ||',
                    'role': role_str
                })
                imports_added.add('com.coresolution.consultation.constant.UserRole')
                return f'{enum_value}.name().equals({var_name}) ||'
            return match.group(0)
        
        # 순차적으로 패턴 적용
        new_content = pattern2.sub(replace_name_equals, new_content)
        new_content = pattern1.sub(replace_equals, new_content)
        new_content = pattern5.sub(replace_code_equals, new_content)
        new_content = pattern3.sub(replace_role_equals, new_content)
        new_content = pattern6.sub(replace_multiple_equals, new_content)
        
        # import 추가
        if imports_added:
            import_line = 'import com.coresolution.consultation.constant.UserRole;'
            # 이미 import가 있는지 확인
            if 'import com.coresolution.consultation.constant.UserRole' not in new_content:
                # package 선언 다음에 import 추가
                package_match = re.search(r'package\s+[^;]+;', new_content)
                if package_match:
                    insert_pos = package_match.end()
                    new_content = new_content[:insert_pos] + '\n\n' + import_line + new_content[insert_pos:]
                    replacements.append({
                        'type': 'import_added',
                        'original': '',
                        'replacement': import_line,
                        'role': 'UserRole'
                    })
        
        return new_content, replacements
    
    def replace_role_hardcoding_js(self, content: str, file_path: Path) -> Tuple[str, List[Dict]]:
        """JavaScript 파일에서 역할 하드코딩을 공통코드 조회로 변환"""
        replacements = []
        new_content = content
        
        # JavaScript는 나중에 처리 (더 복잡함)
        # 일단은 백업 파일 제외하고 실제 파일만 처리
        if '.backup' in str(file_path):
            return new_content, replacements
        
        # 패턴 1: user?.role === 'ROLE_NAME' -> 권한 시스템 활용 (나중에)
        # 패턴 2: role === 'ROLE_NAME' -> 공통코드 조회 (나중에)
        
        return new_content, replacements
    
    def process_file(self, file_path: Path) -> Dict:
        """파일 처리"""
        result = {
            'file': str(file_path.relative_to(self.project_root)),
            'modified': False,
            'replacements': [],
            'error': None
        }
        
        if self.should_exclude(file_path):
            return result
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            replacements = []
            
            # Java 파일 처리
            if self.is_java_file(file_path):
                content, replacements = self.replace_role_hardcoding_java(content, file_path)
                if replacements:
                    result['replacements'] = replacements
                    result['modified'] = True
                    self.results['summary']['backend_files'] += 1
            
            # JavaScript 파일 처리 (일단 스킵, 나중에)
            # elif self.is_js_file(file_path):
            #     content, replacements = self.replace_role_hardcoding_js(content, file_path)
            
            # 변경 사항이 있으면 파일 저장
            if result['modified'] and content != original_content:
                if not self.dry_run:
                    # 백업
                    if not self.backup_file(file_path):
                        result['error'] = 'Backup failed'
                        return result
                    
                    # 파일 저장
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                
                self.results['replacements'].extend([{
                    'file': result['file'],
                    **repl
                } for repl in replacements])
                self.results['summary']['replacements_made'] += len(replacements)
        
        except Exception as e:
            result['error'] = str(e)
            self.results['errors'].append({
                'file': str(file_path),
                'error': str(e)
            })
        
        return result
    
    def find_java_files(self) -> List[Path]:
        """Java 파일 찾기"""
        java_files = []
        java_dir = self.project_root / 'src' / 'main' / 'java'
        
        if java_dir.exists():
            for file_path in java_dir.rglob('*.java'):
                if not self.should_exclude(file_path):
                    java_files.append(file_path)
        
        return java_files
    
    def run(self):
        """스크립트 실행"""
        print(f"{'🔍 DRY RUN 모드' if self.dry_run else '🚀 실행 모드'}")
        print(f"프로젝트 루트: {self.project_root}")
        print(f"백업 디렉토리: {self.backup_dir if self.backup_dir else '없음 (DRY RUN)'}\n")
        
        # Java 파일 찾기
        java_files = self.find_java_files()
        print(f"📁 발견된 Java 파일: {len(java_files)}개\n")
        
        # 파일 처리
        for file_path in java_files:
            result = self.process_file(file_path)
            if result['modified']:
                self.results['modified_files'].append(result)
                self.results['summary']['files_processed'] += 1
                print(f"✅ {result['file']}: {len(result['replacements'])}개 변경")
        
        # 결과 출력
        print(f"\n{'='*60}")
        print("📊 작업 결과 요약")
        print(f"{'='*60}")
        print(f"처리된 파일: {self.results['summary']['files_processed']}개")
        print(f"총 변경 사항: {self.results['summary']['replacements_made']}개")
        print(f"Backend 파일: {self.results['summary']['backend_files']}개")
        print(f"에러: {len(self.results['errors'])}개")
        
        if self.results['errors']:
            print(f"\n❌ 에러 목록:")
            for error in self.results['errors']:
                print(f"  - {error['file']}: {error.get('error', 'Unknown error')}")
        
        # 결과를 JSON으로 저장
        if not self.dry_run:
            results_file = self.project_root / 'docs' / 'project-management' / '2025-12-04' / 'role_hardcoding_removal_results.json'
            results_file.parent.mkdir(parents=True, exist_ok=True)
            with open(results_file, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, ensure_ascii=False, indent=2)
            print(f"\n📄 결과 파일 저장: {results_file}")


def main():
    parser = argparse.ArgumentParser(description='역할 이름 하드코딩 제거 스크립트')
    parser.add_argument('--project-root', type=str, default='.',
                        help='프로젝트 루트 디렉토리 (기본값: 현재 디렉토리)')
    parser.add_argument('--execute', action='store_true',
                        help='실제로 파일을 수정합니다 (기본값: DRY RUN)')
    
    args = parser.parse_args()
    
    project_root = Path(args.project_root).resolve()
    if not project_root.exists():
        print(f"❌ 오류: 프로젝트 루트를 찾을 수 없습니다: {project_root}")
        return
    
    remover = RoleHardcodingRemover(str(project_root), dry_run=not args.execute)
    remover.run()


if __name__ == '__main__':
    main()

