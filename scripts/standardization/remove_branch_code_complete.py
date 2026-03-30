#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
브랜치 코드 완전 제거 스크립트
표준화 작업: 브랜치 코드 완전 제거 (깔끔하게)

작성일: 2025-12-04
"""

import os
import re
import json
import shutil
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Set

class BranchCodeCompleteRemover:
    """브랜치 코드 완전 제거 클래스"""
    
    def __init__(self, project_root: str, dry_run: bool = True):
        self.project_root = Path(project_root)
        self.dry_run = dry_run
        self.backup_dir = None
        
        if not dry_run:
            self.backup_dir = self.project_root / f"backup-branch-complete-removal-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
            self.backup_dir.mkdir(exist_ok=True)
        
        # 제거할 패턴들
        self.removal_patterns = {
            # Repository 메서드에서 브랜치 필터링 제거
            'repository_branch_query': [
                (r'@Query\s*\(\s*["\']([^"\']*branchCode[^"\']*)["\']\s*\)', self._remove_branch_from_query),
                (r'@Query\s*\(\s*["\']([^"\']*branchId[^"\']*)["\']\s*\)', self._remove_branch_from_query),
            ],
            # 메서드 파라미터에서 브랜치 제거
            'method_params': [
                (r'@Param\s*\(\s*["\']branchCode["\']\s*\)\s+String\s+\w+', ''),
                (r'@Param\s*\(\s*["\']branchId["\']\s*\)\s+(String|Long)\s+\w+', ''),
            ],
        }
        
        # 제외할 파일/디렉토리
        self.exclude_patterns = [
            'node_modules', 'target', '.git', 'backup', '.backup',
            'migration', 'V2__', 'V3__', '.class', '.jar',
            'BranchCode.java',  # 브랜치 코드 Enum 자체
            'Branch.java',      # Branch 엔티티 자체
        ]
        
        self.results = {
            'removed_methods': [],
            'removed_queries': [],
            'modified_files': [],
            'backed_up': [],
            'errors': [],
            'summary': {
                'files_processed': 0,
                'methods_removed': 0,
                'queries_modified': 0,
            }
        }
    
    def should_exclude(self, file_path: Path) -> bool:
        """파일이 제외 대상인지 확인"""
        path_str = str(file_path)
        name = file_path.name
        return any(pattern in path_str or pattern in name for pattern in self.exclude_patterns)
    
    def _remove_branch_from_query(self, match) -> str:
        """쿼리에서 브랜치 조건 제거"""
        query = match.group(1)
        # AND/WHERE 절에서 branchCode, branchId 조건 제거
        query = re.sub(r'\s+AND\s+[^\s]+\s*\.?\s*branchCode\s*=\s*:?\w+', '', query, flags=re.IGNORECASE)
        query = re.sub(r'\s+AND\s+[^\s]+\s*\.?\s*branchId\s*=\s*:?\w+', '', query, flags=re.IGNORECASE)
        query = re.sub(r'\s+WHERE\s+[^\s]+\s*\.?\s*branchCode\s*=\s*:?\w+', '', query, flags=re.IGNORECASE)
        return f'@Query("{query}")'
    
    def remove_deprecated_methods(self, file_path: Path) -> Dict:
        """Deprecated 브랜치 관련 메서드 완전 제거"""
        result = {
            'file': str(file_path.relative_to(self.project_root)),
            'modified': False,
            'removed_methods': [],
            'removed_queries': [],
        }
        
        if self.should_exclude(file_path):
            return result
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
            
            new_lines = []
            i = 0
            skip_next = False
            in_method = False
            method_lines = []
            method_indent = 0
            
            while i < len(lines):
                line = lines[i]
                stripped = line.strip()
                
                # Deprecated 메서드 시작 감지
                if '@Deprecated' in line or 'Deprecated' in stripped:
                    # 다음 줄이 브랜치 관련 메서드인지 확인
                    if i + 1 < len(lines):
                        next_line = lines[i + 1]
                        if re.search(r'branchCode|branchId', next_line, re.IGNORECASE):
                            # Deprecated 주석과 메서드 전체 제거
                            # 주석 블록 찾기
                            j = i
                            while j > 0 and (lines[j].strip().startswith('*') or lines[j].strip().startswith('/**')):
                                j -= 1
                            
                            # 메서드 끝 찾기
                            method_start = j if j < i else i
                            method_end = self._find_method_end(lines, i + 1)
                            
                            result['removed_methods'].append({
                                'start': method_start + 1,
                                'end': method_end + 1,
                                'content': '\n'.join(lines[method_start:method_end + 1])
                            })
                            
                            i = method_end + 1
                            result['modified'] = True
                            continue
                
                new_lines.append(line)
                i += 1
            
            if result['modified']:
                result['new_content'] = '\n'.join(new_lines)
                
                if not self.dry_run:
                    if self.backup_file(file_path):
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(result['new_content'])
                        
                        self.results['modified_files'].append(result)
                        self.results['summary']['methods_removed'] += len(result['removed_methods'])
                        self.results['summary']['files_processed'] += 1
        
        except Exception as e:
            self.results['errors'].append({
                'file': str(file_path),
                'error': str(e)
            })
        
        return result
    
    def _find_method_end(self, lines: List[str], start_idx: int) -> int:
        """메서드의 끝 라인 찾기"""
        brace_count = 0
        in_method = False
        
        for i in range(start_idx, len(lines)):
            line = lines[i]
            stripped = line.strip()
            
            # 빈 줄이나 주석만 있으면 계속
            if not stripped or stripped.startswith('//'):
                continue
            
            # 중괄호 카운트
            brace_count += line.count('{') - line.count('}')
            
            if '{' in line:
                in_method = True
            
            if in_method and brace_count == 0:
                return i
        
        return len(lines) - 1
    
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
    
    def process_repository_files(self) -> None:
        """Repository 파일에서 Deprecated 메서드 제거"""
        print("\n📋 Repository 파일에서 Deprecated 브랜치 메서드 제거")
        print("-" * 70)
        
        repository_dir = self.project_root / 'src/main/java'
        repository_files = list(repository_dir.rglob('*Repository.java'))
        
        print(f"발견된 Repository 파일: {len(repository_files)}개\n")
        
        for file_path in repository_files:
            if self.should_exclude(file_path):
                continue
            
            print(f"  📝 처리 중: {file_path.relative_to(self.project_root)}")
            result = self.remove_deprecated_methods(file_path)
            
            if result['modified']:
                print(f"     ✅ {len(result['removed_methods'])}개 메서드 제거")
            else:
                print(f"     ⏭️  변경사항 없음")
    
    def generate_report(self, output_file: str) -> None:
        """결과 보고서 생성"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'dry_run': self.dry_run,
            'summary': self.results['summary'],
            'modified_files': len(self.results['modified_files']),
            'backed_up': len(self.results['backed_up']),
            'errors': len(self.results['errors']),
            'modified_files_detail': self.results['modified_files'],
            'errors': self.results['errors'],
        }
        
        output_path = self.project_root / output_file
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 보고서 저장: {output_path}")

def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description='브랜치 코드 완전 제거 스크립트')
    parser.add_argument('--execute', action='store_true',
                       help='실제 실행 모드 (기본은 Dry-run)')
    
    args = parser.parse_args()
    dry_run = not args.execute
    
    project_root_str = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
    project_root = Path(project_root_str)
    
    print("=" * 70)
    print("🚀 브랜치 코드 완전 제거 스크립트")
    print("=" * 70)
    print(f"프로젝트 루트: {project_root}")
    print(f"모드: {'🔍 DRY-RUN (수정 안함)' if dry_run else '⚠️  EXECUTE (실제 수정)'}\n")
    
    remover = BranchCodeCompleteRemover(str(project_root), dry_run=dry_run)
    
    # Repository 파일 처리
    remover.process_repository_files()
    
    # 보고서 생성
    report_file = 'docs/project-management/2025-12-04/BRANCH_CODE_COMPLETE_REMOVAL_REPORT.json'
    remover.generate_report(report_file)
    
    print("\n" + "=" * 70)
    print("✅ 작업 완료!")
    print("=" * 70)
    
    if dry_run:
        print("\n💡 실제 제거하려면 --execute 옵션을 추가하세요.")
        print("   예: python3 scripts/standardization/remove_branch_code_complete.py --execute")

if __name__ == '__main__':
    main()

