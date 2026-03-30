#!/usr/bin/env python3
"""
브랜치 코드 제거 자동화 스크립트
표준화 원칙에 따라 branchCode/branchId를 tenantId 기반으로 전환

작성일: 2025-12-07
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Tuple
from dataclasses import dataclass

@dataclass
class BranchCodeUsage:
    file_path: str
    line_number: int
    line_content: str
    usage_type: str  # 'parameter', 'field', 'method', 'variable', 'comment'
    context: str

class BranchCodeRemover:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.java_files = []
        self.usages: List[BranchCodeUsage] = []
        self.modified_files = []
        
        # 브랜치 관련 패턴
        self.patterns = [
            r'\bbranchCode\b',
            r'\bbranchId\b',
            r'\bbranch_code\b',
            r'\bbranch_id\b',
            r'\bBranchCode\b',
            r'\bBranchId\b',
        ]
        
    def find_java_files(self):
        """Java 파일 찾기"""
        print("[SEARCH] Java 파일 검색 중...")
        for java_file in self.root_dir.rglob("*.java"):
            # 백업 파일 제외
            if ".backup" in str(java_file) or "target" in str(java_file):
                continue
            self.java_files.append(java_file)
        print(f"[OK] {len(self.java_files)}개 Java 파일 발견")
        
    def analyze_usage(self, file_path: Path) -> List[BranchCodeUsage]:
        """파일에서 브랜치 코드 사용 분석"""
        usages = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
            for line_num, line in enumerate(lines, 1):
                for pattern in self.patterns:
                    if re.search(pattern, line):
                        # 주석인지 확인
                        stripped = line.strip()
                        if stripped.startswith('//') or stripped.startswith('*') or stripped.startswith('/*'):
                            usage_type = 'comment'
                        elif '@Deprecated' in line or 'Deprecated' in line:
                            usage_type = 'comment'  # 이미 deprecated 처리됨
                        elif 'private' in line or 'public' in line or 'protected' in line:
                            if 'String' in line or 'Long' in line or 'Integer' in line:
                                usage_type = 'field'
                            else:
                                usage_type = 'method'
                        elif '(' in line and ')' in line:
                            usage_type = 'parameter'
                        else:
                            usage_type = 'variable'
                            
                        # 컨텍스트 추출 (앞뒤 2줄)
                        start = max(0, line_num - 3)
                        end = min(len(lines), line_num + 2)
                        context = ''.join(lines[start:end])
                        
                        usages.append(BranchCodeUsage(
                            file_path=str(file_path.relative_to(self.root_dir)),
                            line_number=line_num,
                            line_content=line.rstrip(),
                            usage_type=usage_type,
                            context=context
                        ))
        except Exception as e:
            print(f"⚠️ 파일 읽기 오류: {file_path} - {e}")
            
        return usages
    
    def scan_all_files(self):
        """모든 파일 스캔"""
        print("\n[ANALYZE] 브랜치 코드 사용 분석 중...")
        for java_file in self.java_files:
            usages = self.analyze_usage(java_file)
            self.usages.extend(usages)
        
        # 사용 유형별 통계
        stats = {}
        for usage in self.usages:
            stats[usage.usage_type] = stats.get(usage.usage_type, 0) + 1
        
        print(f"\n[STATS] 발견된 사용처: {len(self.usages)}개")
        for usage_type, count in sorted(stats.items()):
            print(f"  - {usage_type}: {count}개")
    
    def safe_modify_parameter(self, file_path: Path, usage: BranchCodeUsage) -> bool:
        """파라미터로 받는 branchCode에 안전하게 @Deprecated 추가"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
            
            line_idx = usage.line_number - 1
            original_line = lines[line_idx]
            
            # 이미 @Deprecated가 있으면 스킵
            if '@Deprecated' in original_line or 'Deprecated' in original_line:
                return False
            
            # 메서드 시그니처 찾기
            if 'String branchCode' in original_line or 'String branchId' in original_line:
                # 메서드 시작 부분 찾기
                method_start = line_idx
                while method_start > 0 and not lines[method_start].strip().startswith(('public', 'private', 'protected')):
                    method_start -= 1
                
                # @Deprecated 주석 추가
                indent = len(lines[method_start]) - len(lines[method_start].lstrip())
                deprecation_comment = ' ' * indent + '/**\n'
                deprecation_comment += ' ' * indent + ' * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음\n'
                deprecation_comment += ' ' * indent + ' */\n'
                deprecation_comment += ' ' * indent + '@Deprecated\n'
                
                # 메서드 선언 앞에 추가
                if method_start < len(lines):
                    lines.insert(method_start, deprecation_comment.rstrip())
                    
                    # 메서드 본문 시작 부분에 경고 로직 추가
                    body_start = line_idx + 5  # 주석 추가로 인한 오프셋
                    while body_start < len(lines) and lines[body_start].strip() != '{':
                        body_start += 1
                    
                    if body_start < len(lines):
                        indent = len(lines[body_start + 1]) - len(lines[body_start + 1].lstrip())
                        warning_code = ' ' * indent + '// 표준화 2025-12-07: branchCode 무시\n'
                        warning_code += ' ' * indent + f'if ({usage.line_content.split()[usage.line_content.split().index("branchCode" if "branchCode" in usage.line_content else "branchId")].split("=")[0].strip()}) != null) {{\n'
                        warning_code += ' ' * indent + f'    log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={{}}", {usage.line_content.split()[usage.line_content.split().index("branchCode" if "branchCode" in usage.line_content else "branchId")].split("=")[0].strip()});\n'
                        warning_code += ' ' * indent + '}\n'
                        lines.insert(body_start + 1, warning_code.rstrip())
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(lines))
                return True
        except Exception as e:
            print(f"[WARN] 수정 오류: {file_path} 라인 {usage.line_number} - {e}")
        return False
    
    def safe_modify_field(self, file_path: Path, usage: BranchCodeUsage) -> bool:
        """필드에 @Deprecated 추가"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
            
            line_idx = usage.line_number - 1
            original_line = lines[line_idx]
            
            # 이미 @Deprecated가 있으면 스킵
            if '@Deprecated' in original_line:
                return False
            
            # 필드 위에 주석 찾기
            comment_start = line_idx
            while comment_start > 0 and (lines[comment_start].strip().startswith('*') or 
                                         lines[comment_start].strip().startswith('/**') or
                                         lines[comment_start].strip().startswith('//')):
                comment_start -= 1
            
            # @Deprecated 추가
            indent = len(original_line) - len(original_line.lstrip())
            if comment_start == line_idx - 1:
                # 주석이 바로 위에 있으면 주석에 추가
                if comment_start >= 0 and '*/' in lines[comment_start]:
                    lines[comment_start] = lines[comment_start].replace('*/', 
                        ' * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨, tenantId만 사용\n */')
            else:
                # 새로운 주석 블록 추가
                deprecation_comment = ' ' * indent + '/**\n'
                deprecation_comment += ' ' * indent + ' * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨, tenantId만 사용\n'
                deprecation_comment += ' ' * indent + ' * 레거시 데이터 호환을 위해 필드 유지 (NULL 허용)\n'
                deprecation_comment += ' */\n'
                deprecation_comment += ' ' * indent + '@Deprecated\n'
                lines.insert(line_idx, deprecation_comment.rstrip())
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(lines))
            return True
        except Exception as e:
            print(f"[WARN] 수정 오류: {file_path} 라인 {usage.line_number} - {e}")
        return False
    
    def process_files(self, dry_run: bool = False):
        """파일 처리"""
        if dry_run:
            print("\n[DRY RUN] DRY RUN 모드 - 실제 수정 없이 분석만 수행\n")
        else:
            print("\n[MODIFY] 파일 수정 시작...\n")
        
        # 파일별로 그룹화
        files_to_process = {}
        for usage in self.usages:
            if usage.usage_type in ['comment']:
                continue  # 주석은 스킵
            if usage.file_path not in files_to_process:
                files_to_process[usage.file_path] = []
            files_to_process[usage.file_path].append(usage)
        
        modified_count = 0
        for file_path_str, usages in files_to_process.items():
            file_path = self.root_dir / file_path_str
            
            if not file_path.exists():
                continue
            
            print(f"[PROCESS] 처리 중: {file_path_str} ({len(usages)}개 사용처)")
            
            if not dry_run:
                for usage in usages:
                    if usage.usage_type == 'parameter':
                        if self.safe_modify_parameter(file_path, usage):
                            modified_count += 1
                    elif usage.usage_type == 'field':
                        if self.safe_modify_field(file_path, usage):
                            modified_count += 1
                if modified_count > 0:
                    self.modified_files.append(file_path_str)
        
        print(f"\n[OK] 수정 완료: {modified_count}개 파일")
    
    def generate_report(self, output_file: str = "branch_code_removal_report.txt"):
        """리포트 생성"""
        report_path = self.root_dir / output_file
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write("브랜치 코드 제거 작업 리포트\n")
            f.write(f"생성일: 2025-12-07\n")
            f.write("=" * 80 + "\n\n")
            
            f.write(f"총 발견된 사용처: {len(self.usages)}개\n")
            f.write(f"분석된 파일 수: {len(self.java_files)}개\n\n")
            
            # 파일별 그룹화
            files_dict = {}
            for usage in self.usages:
                if usage.file_path not in files_dict:
                    files_dict[usage.file_path] = []
                files_dict[usage.file_path].append(usage)
            
            f.write("파일별 상세 내역:\n")
            f.write("-" * 80 + "\n")
            for file_path, usages in sorted(files_dict.items()):
                f.write(f"\n[FILE] {file_path} ({len(usages)}개)\n")
                for usage in usages:
                    f.write(f"  라인 {usage.line_number} ({usage.usage_type}): {usage.line_content[:80]}\n")
        
        print(f"\n[REPORT] 리포트 생성: {report_path}")

def main():
    if len(sys.argv) < 2:
        print("사용법: python remove_branch_code.py <프로젝트_루트> [--dry-run] [--report]")
        print("예시: python remove_branch_code.py MindGarden --dry-run")
        sys.exit(1)
    
    root_dir = sys.argv[1]
    dry_run = '--dry-run' in sys.argv
    generate_report = '--report' in sys.argv
    
    if not os.path.exists(root_dir):
        print(f"[ERROR] 디렉토리를 찾을 수 없습니다: {root_dir}")
        sys.exit(1)
    
    remover = BranchCodeRemover(root_dir)
    
    print("=" * 80)
    print("브랜치 코드 제거 자동화 스크립트")
    print("=" * 80)
    
    remover.find_java_files()
    remover.scan_all_files()
    
    if generate_report:
        remover.generate_report()
    
    if not dry_run:
        response = input("\n[WARN] 실제 파일을 수정하시겠습니까? (yes/no): ")
        if response.lower() != 'yes':
            print("취소되었습니다.")
            return
    
    remover.process_files(dry_run=dry_run)
    
    if remover.modified_files:
        print(f"\n[OK] 수정된 파일 목록 ({len(remover.modified_files)}개):")
        for file_path in remover.modified_files[:20]:  # 처음 20개만 표시
            print(f"  - {file_path}")
        if len(remover.modified_files) > 20:
            print(f"  ... 외 {len(remover.modified_files) - 20}개")

if __name__ == "__main__":
    main()

