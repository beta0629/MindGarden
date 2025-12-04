#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
브랜치 코드 제거 자동화 스크립트
표준화 작업: 브랜치 코드 완전 제거

작성일: 2025-12-04
"""

import os
import re
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple, Optional

class BranchCodeRemover:
    """브랜치 코드 제거 클래스"""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
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
            'V2__',       # 브랜치 마이그레이션 파일
            'V3__',       # 브랜치 마이그레이션 파일
            '.class',
            '.jar',
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
            }
        }
    
    def should_exclude(self, file_path: Path) -> bool:
        """파일이 제외 대상인지 확인"""
        path_str = str(file_path)
        return any(pattern in path_str for pattern in self.exclude_patterns)
    
    def analyze_file(self, file_path: Path) -> Optional[Dict]:
        """파일에서 브랜치 코드 사용 분석"""
        if self.should_exclude(file_path):
            return None
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            occurrences = []
            for line_num, line in enumerate(lines, 1):
                # 주석 라인 제외
                stripped = line.strip()
                if stripped.startswith('//') or stripped.startswith('*') or stripped.startswith('/*'):
                    continue
                
                # 각 패턴 검사
                for pattern, name in self.branch_patterns:
                    matches = list(re.finditer(pattern, line))
                    if matches:
                        for match in matches:
                            occurrences.append({
                                'pattern': name,
                                'line': line_num,
                                'column': match.start(),
                                'content': line.strip()[:100],  # 최대 100자만
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
    
    def scan_directory(self, directory: Path, relative_path: str = '') -> None:
        """디렉토리 재귀 검색"""
        if not directory.exists():
            return
        
        try:
            for item in directory.iterdir():
                if self.should_exclude(item):
                    continue
                
                if item.is_dir():
                    self.scan_directory(item, str(item.relative_to(self.project_root)))
                elif item.is_file():
                    result = self.analyze_file(item)
                    if result:
                        self.results['analyzed'].append(result)
                        self.results['summary']['total_files'] += 1
                        self.results['summary']['total_occurrences'] += result['count']
        except PermissionError:
            pass  # 권한 없음 무시
    
    def backup_file(self, file_path: Path) -> bool:
        """파일 백업"""
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
    
    def remove_branch_code_from_file(self, file_path: Path, dry_run: bool = True) -> Dict:
        """파일에서 브랜치 코드 제거"""
        result = {
            'file': str(file_path.relative_to(self.project_root)),
            'modified': False,
            'changes': [],
            'removed_count': 0,
        }
        
        if self.should_exclude(file_path):
            return result
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                original_lines = content.split('\n')
            
            new_lines = []
            removed_count = 0
            
            for line_num, line in enumerate(original_lines, 1):
                original_line = line
                modified_line = line
                
                # 브랜치 코드 제거 (간단한 패턴만)
                # 실제 제거는 파일 타입별로 다르게 처리해야 함
                if file_path.suffix == '.java':
                    # Java 파일 처리
                    modified_line = self._process_java_line(line)
                elif file_path.suffix in ['.js', '.jsx']:
                    # JavaScript 파일 처리
                    modified_line = self._process_js_line(line)
                
                if modified_line != original_line:
                    result['changes'].append({
                        'line': line_num,
                        'original': original_line.strip()[:80],
                        'modified': modified_line.strip()[:80],
                    })
                    removed_count += 1
                
                new_lines.append(modified_line)
            
            if removed_count > 0:
                result['modified'] = True
                result['removed_count'] = removed_count
                
                if not dry_run:
                    # 백업
                    if self.backup_file(file_path):
                        # 파일 수정
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write('\n'.join(new_lines))
                        
                        self.results['modified'].append(result)
                        self.results['summary']['modified_files'] += 1
            
        except Exception as e:
            self.results['errors'].append({
                'file': str(file_path),
                'operation': 'remove',
                'error': str(e)
            })
        
        return result
    
    def _process_java_line(self, line: str) -> str:
        """Java 라인에서 브랜치 코드 제거"""
        # 주석은 건드리지 않음
        if line.strip().startswith('//') or line.strip().startswith('*'):
            return line
        
        # 간단한 패턴 제거 (실제로는 더 정교하게 처리해야 함)
        # 이 부분은 실제 제거 로직에 따라 달라짐
        return line
    
    def _process_js_line(self, line: str) -> str:
        """JavaScript 라인에서 브랜치 코드 제거"""
        # 주석은 건드리지 않음
        if line.strip().startswith('//') or line.strip().startswith('*'):
            return line
        
        # 간단한 패턴 제거
        return line
    
    def generate_report(self, output_file: str) -> None:
        """분석 결과 보고서 생성"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': self.results['summary'],
            'files_analyzed': len(self.results['analyzed']),
            'files_modified': len(self.results['modified']),
            'files_backed_up': len(self.results['backed_up']),
            'errors': len(self.results['errors']),
            'analyzed_files': self.results['analyzed'],
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
    import sys
    
    project_root_str = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
    project_root = Path(project_root_str)
    
    print("=" * 60)
    print("🚀 브랜치 코드 제거 자동화 스크립트")
    print("=" * 60)
    print(f"프로젝트 루트: {project_root}\n")
    
    remover = BranchCodeRemover(str(project_root))
    
    # 1단계: 분석
    print("📋 1단계: 브랜치 코드 사용 현황 분석")
    print("-" * 60)
    
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
    
    # 결과 출력
    backend_files = [f for f in remover.results['analyzed'] if f['file_type'] == 'backend']
    frontend_files = [f for f in remover.results['analyzed'] if f['file_type'] == 'frontend']
    
    print(f"\n   - Backend: {len(backend_files)}개 파일")
    print(f"   - Frontend: {len(frontend_files)}개 파일")
    
    # 보고서 생성
    report_file = 'docs/project-management/2025-12-04/BRANCH_CODE_ANALYSIS_REPORT.json'
    remover.generate_report(report_file)
    
    # 요약 파일 생성
    summary_file = project_root / 'docs/project-management/2025-12-04/BRANCH_CODE_ANALYSIS_SUMMARY.md'
    summary_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write(f"# 브랜치 코드 사용 현황 분석 결과\n\n")
        f.write(f"**분석 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"## 📊 전체 현황\n\n")
        f.write(f"- **총 파일 수**: {len(remover.results['analyzed'])}개\n")
        f.write(f"- **총 사용 횟수**: {remover.results['summary']['total_occurrences']}개\n")
        f.write(f"- **Backend 파일**: {len(backend_files)}개\n")
        f.write(f"- **Frontend 파일**: {len(frontend_files)}개\n\n")
        
        f.write(f"## 📁 Backend 파일 상세 (상위 20개)\n\n")
        for i, file_info in enumerate(sorted(backend_files, key=lambda x: x['count'], reverse=True)[:20], 1):
            f.write(f"{i}. `{file_info['file']}` - {file_info['count']}개 사용\n")
        
        f.write(f"\n## 📁 Frontend 파일 상세 (상위 20개)\n\n")
        for i, file_info in enumerate(sorted(frontend_files, key=lambda x: x['count'], reverse=True)[:20], 1):
            f.write(f"{i}. `{file_info['file']}` - {file_info['count']}개 사용\n")
        
        f.write(f"\n---\n\n")
        f.write(f"**상세 내용**: `BRANCH_CODE_ANALYSIS_REPORT.json` 참조\n")
    
    print(f"📄 요약 파일 저장: {summary_file}")
    
    print("\n" + "=" * 60)
    print("✅ 분석 완료!")
    print("=" * 60)

if __name__ == '__main__':
    main()

