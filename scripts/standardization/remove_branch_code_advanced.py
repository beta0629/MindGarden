#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
브랜치 코드 제거 자동화 스크립트 (확장판)
표준화 작업: 브랜치 코드 완전 제거

작성일: 2025-12-04
"""

import os
import re
import json
import shutil
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple, Optional

class BranchCodeRemoverAdvanced:
    """브랜치 코드 제거 클래스 (확장판)"""
    
    def __init__(self, project_root: str, dry_run: bool = True):
        self.project_root = Path(project_root)
        self.dry_run = dry_run
        self.backup_dir = None
        
        if not dry_run:
            self.backup_dir = self.project_root / f"backup-branch-removal-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
            self.backup_dir.mkdir(exist_ok=True)
        
        # 브랜치 코드 패턴
        self.branch_patterns = [
            (r'\bbranchCode\b', 'branchCode'),
            (r'\bbranchId\b', 'branchId'),
            (r'\bbranch_code\b', 'branch_code'),
            (r'\bbranch_id\b', 'branch_id'),
            (r'\bBranchCode\b', 'BranchCode'),
            (r'\bBranchId\b', 'BranchId'),
            (r'\bBRANCH_CODE\b', 'BRANCH_CODE'),
            (r'\bBRANCH_ID\b', 'BRANCH_ID'),
        ]
        
        # 제외할 파일/디렉토리
        self.exclude_patterns = [
            'node_modules',
            'target',
            '.git',
            'backup',
            '.backup',
            'migration',  # 마이그레이션 파일은 제외
            'V2__',
            'V3__',
            '.class',
            '.jar',
            'BranchCode.java',  # 브랜치 코드 Enum 자체
        ]
        
        self.results = {
            'analyzed': [],
            'modified': [],
            'backed_up': [],
            'errors': [],
            'summary': {
                'total_files': 0,
                'total_occurrences': 0,
                'modified_files': 0,
                'removed_occurrences': 0,
            }
        }
    
    def should_exclude(self, file_path: Path) -> bool:
        """파일이 제외 대상인지 확인"""
        path_str = str(file_path)
        name = file_path.name
        return any(pattern in path_str or pattern in name for pattern in self.exclude_patterns)
    
    def analyze_file(self, file_path: Path) -> Optional[Dict]:
        """파일에서 브랜치 코드 사용 분석"""
        if self.should_exclude(file_path):
            return None
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            occurrences = []
            for line_num, line in enumerate(lines, 1):
                stripped = line.strip()
                # 주석 라인 제외
                if stripped.startswith('//') or stripped.startswith('*') or stripped.startswith('/*'):
                    continue
                
                for pattern, name in self.branch_patterns:
                    if re.search(pattern, line):
                        occurrences.append({
                            'pattern': name,
                            'line': line_num,
                            'content': line.strip()[:100],
                        })
            
            if occurrences:
                return {
                    'file': str(file_path.relative_to(self.project_root)),
                    'occurrences': occurrences,
                    'count': len(occurrences),
                    'file_type': self._get_file_type(file_path),
                }
        except Exception as e:
            self.results['errors'].append({
                'file': str(file_path),
                'error': str(e)
            })
        
        return None
    
    def _get_file_type(self, file_path: Path) -> str:
        """파일 타입 판단"""
        suffix = file_path.suffix
        if suffix == '.java':
            return 'backend'
        elif suffix in ['.js', '.jsx', '.ts', '.tsx']:
            return 'frontend'
        elif suffix == '.sql':
            return 'migration'
        else:
            return 'other'
    
    def scan_directory(self, directory: Path) -> None:
        """디렉토리 재귀 검색"""
        if not directory.exists():
            return
        
        try:
            for item in directory.rglob('*'):
                if item.is_file() and not self.should_exclude(item):
                    result = self.analyze_file(item)
                    if result:
                        self.results['analyzed'].append(result)
                        self.results['summary']['total_files'] += 1
                        self.results['summary']['total_occurrences'] += result['count']
        except PermissionError:
            pass
    
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
    
    def process_repository_file(self, file_path: Path, file_info: Dict) -> Dict:
        """Repository 파일 처리: Deprecated 주석 추가"""
        result = {
            'file': str(file_path.relative_to(self.project_root)),
            'modified': False,
            'changes': [],
            'added_deprecated': 0,
        }
        
        if self.should_exclude(file_path):
            return result
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            new_lines = []
            i = 0
            while i < len(lines):
                line = lines[i]
                new_lines.append(line)
                
                # Repository 메서드 패턴 찾기
                # @Query 또는 메서드 정의 라인 찾기
                if re.search(r'@Query.*branchCode|@Query.*branchId', line, re.IGNORECASE):
                    # 다음 몇 줄 확인하여 메서드 정의 찾기
                    method_start = i
                    method_lines = [line]
                    
                    # Deprecated 주석이 이미 있는지 확인
                    has_deprecated = False
                    for j in range(max(0, i-5), i):
                        if '@Deprecated' in lines[j] or 'Deprecated' in lines[j]:
                            has_deprecated = True
                            break
                    
                    # Deprecated 주석이 없으면 추가
                    if not has_deprecated:
                        # 메서드 위에 Deprecated 주석 추가
                        indent = len(line) - len(line.lstrip())
                        deprecation_comment = ' ' * indent + '/**\n'
                        deprecation_comment += ' ' * indent + ' * @Deprecated - 🚨 브랜치 개념 제거: 브랜치 코드 기반 필터링 사용 금지\n'
                        deprecation_comment += ' ' * indent + ' * 새로운 코드에서는 tenantId만 사용하여 조회하세요.\n'
                        deprecation_comment += ' ' * indent + ' */\n'
                        deprecation_comment += ' ' * indent + '@Deprecated\n'
                        
                        # 이전 라인에 주석 삽입
                        new_lines.pop()  # 마지막에 추가한 라인 제거
                        new_lines.append(deprecation_comment)
                        new_lines.append(line)
                        
                        result['modified'] = True
                        result['added_deprecated'] += 1
                        result['changes'].append({
                            'line': i + 1,
                            'action': 'added_deprecated',
                            'content': 'Deprecated 주석 추가'
                        })
                
                i += 1
            
            if result['modified']:
                result['new_content'] = ''.join(new_lines)
                
                if not self.dry_run:
                    if self.backup_file(file_path):
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(result['new_content'])
                        
                        self.results['modified'].append(result)
                        self.results['summary']['modified_files'] += 1
        
        except Exception as e:
            self.results['errors'].append({
                'file': str(file_path),
                'operation': 'process_repository',
                'error': str(e)
            })
        
        return result
    
    def generate_report(self, output_file: str) -> None:
        """분석 결과 보고서 생성"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'dry_run': self.dry_run,
            'summary': self.results['summary'],
            'files_analyzed': len(self.results['analyzed']),
            'files_modified': len(self.results['modified']),
            'files_backed_up': len(self.results['backed_up']),
            'errors': len(self.results['errors']),
            'analyzed_files': self.results['analyzed'][:100],  # 처음 100개만
            'modified_files': self.results['modified'],
            'errors': self.results['errors'],
        }
        
        output_path = self.project_root / output_file
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 보고서 저장: {output_path}")

def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description='브랜치 코드 제거 자동화 스크립트')
    parser.add_argument('--dry-run', action='store_true', default=True,
                       help='Dry-run 모드 (기본값: True, 실제 수정하지 않음)')
    parser.add_argument('--execute', action='store_true',
                       help='실제 실행 모드 (Dry-run 비활성화)')
    parser.add_argument('--phase', type=int, default=1, choices=[1, 2, 3, 4],
                       help='실행할 Phase (1: 분석, 2: Repository, 3: Service, 4: Frontend)')
    
    args = parser.parse_args()
    
    dry_run = not args.execute
    
    project_root_str = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
    project_root = Path(project_root_str)
    
    print("=" * 70)
    print("🚀 브랜치 코드 제거 자동화 스크립트 (확장판)")
    print("=" * 70)
    print(f"프로젝트 루트: {project_root}")
    print(f"모드: {'🔍 DRY-RUN (수정 안함)' if dry_run else '⚠️  EXECUTE (실제 수정)'}")
    print(f"Phase: {args.phase}\n")
    
    remover = BranchCodeRemoverAdvanced(str(project_root), dry_run=dry_run)
    
    # Phase 1: 분석
    if args.phase >= 1:
        print("📋 Phase 1: 브랜치 코드 사용 현황 분석")
        print("-" * 70)
        
        backend_dir = project_root / 'src/main/java'
        frontend_dir = project_root / 'frontend/src'
        
        if backend_dir.exists():
            print(f"📂 Backend 검색 중: {backend_dir}")
            remover.scan_directory(backend_dir)
        
        if frontend_dir.exists():
            print(f"📂 Frontend 검색 중: {frontend_dir}")
            remover.scan_directory(frontend_dir)
        
        print(f"\n✅ 분석 완료!")
        print(f"   - 분석된 파일: {len(remover.results['analyzed'])}개")
        print(f"   - 총 사용 횟수: {remover.results['summary']['total_occurrences']}개")
        
        backend_files = [f for f in remover.results['analyzed'] if f['file_type'] == 'backend']
        frontend_files = [f for f in remover.results['analyzed'] if f['file_type'] == 'frontend']
        
        print(f"   - Backend: {len(backend_files)}개 파일")
        print(f"   - Frontend: {len(frontend_files)}개 파일")
    
    # Phase 2: Repository 파일 처리
    if args.phase >= 2:
        print("\n📋 Phase 2: Repository 파일 처리 (Deprecated 주석 추가)")
        print("-" * 70)
        
        repository_files = [
            f for f in remover.results['analyzed'] 
            if f['file_type'] == 'backend' and 'Repository' in f['file']
        ]
        
        print(f"처리할 Repository 파일: {len(repository_files)}개\n")
        
        for file_info in repository_files[:5]:  # 처음 5개만 테스트
            file_path = project_root / file_info['file']
            print(f"  📝 처리 중: {file_info['file']}")
            result = remover.process_repository_file(file_path, file_info)
            
            if result['modified']:
                print(f"     ✅ Deprecated 주석 {result['added_deprecated']}개 추가")
            else:
                print(f"     ⏭️  변경사항 없음")
        
        if len(repository_files) > 5:
            print(f"\n  ⚠️  나머지 {len(repository_files) - 5}개 파일은 생략했습니다.")
    
    # 보고서 생성
    report_file = 'docs/project-management/2025-12-04/BRANCH_CODE_REMOVAL_REPORT.json'
    remover.generate_report(report_file)
    
    print("\n" + "=" * 70)
    print("✅ 작업 완료!")
    print("=" * 70)
    
    if dry_run:
        print("\n💡 실제 수정하려면 --execute 옵션을 추가하세요.")
        print("   예: python3 scripts/standardization/remove_branch_code_advanced.py --execute")

if __name__ == '__main__':
    main()

