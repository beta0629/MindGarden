#!/usr/bin/env python3
"""
엔티티에 tenantId 필드 자동 추가 스크립트

작성자: MindGarden AI
날짜: 2025-12-01
목적: Repository 쿼리에서 tenantId를 사용하지만 엔티티에 필드가 없는 경우 자동 추가
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Set

class TenantIdFieldAdder:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.entity_path = self.base_path / "src/main/java/com/coresolution/consultation/entity"
        self.modified_files = []
        self.skipped_files = []
        self.error_files = []
        
    def has_tenant_id_field(self, content: str) -> bool:
        """엔티티에 tenantId 필드가 있는지 확인"""
        # @Column(name = "tenant_id") 또는 private String tenantId 패턴 찾기
        patterns = [
            r'@Column\s*\(\s*name\s*=\s*"tenant_id"',
            r'private\s+String\s+tenantId\s*;'
        ]
        return any(re.search(pattern, content) for pattern in patterns)
    
    def is_entity_class(self, content: str) -> bool:
        """@Entity 어노테이션이 있는 클래스인지 확인"""
        return '@Entity' in content and 'class ' in content
    
    def add_tenant_id_field(self, content: str) -> str:
        """엔티티에 tenantId 필드 추가"""
        # @Id 필드 다음에 tenantId 추가
        id_pattern = r'(@Id\s+@GeneratedValue.*?\n\s+private\s+\w+\s+id\s*;)'
        
        match = re.search(id_pattern, content, re.DOTALL)
        if not match:
            # @Id만 있는 경우
            id_pattern = r'(@Id\s+.*?\n\s+private\s+\w+\s+id\s*;)'
            match = re.search(id_pattern, content, re.DOTALL)
        
        if match:
            id_field = match.group(1)
            insert_pos = match.end()
            
            # tenantId 필드 추가
            tenant_id_field = '''
    
    @Column(name = "tenant_id", length = 100)
    private String tenantId;'''
            
            new_content = content[:insert_pos] + tenant_id_field + content[insert_pos:]
            return new_content
        
        return content
    
    def process_entity_file(self, file_path: Path) -> bool:
        """엔티티 파일 처리"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 엔티티 클래스가 아니면 스킵
            if not self.is_entity_class(content):
                return False
            
            # 이미 tenantId 필드가 있으면 스킵
            if self.has_tenant_id_field(content):
                self.skipped_files.append(str(file_path))
                return False
            
            # tenantId 필드 추가
            new_content = self.add_tenant_id_field(content)
            
            # 변경사항이 없으면 스킵
            if new_content == content:
                self.error_files.append((str(file_path), "Could not find @Id field"))
                return False
            
            # 파일 저장
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            self.modified_files.append(str(file_path))
            return True
            
        except Exception as e:
            self.error_files.append((str(file_path), str(e)))
            return False
    
    def process_all_entities(self):
        """모든 엔티티 파일 처리"""
        if not self.entity_path.exists():
            print(f"❌ 엔티티 경로를 찾을 수 없습니다: {self.entity_path}")
            return
        
        entity_files = list(self.entity_path.glob("*.java"))
        print(f"📂 총 {len(entity_files)}개의 엔티티 파일 발견")
        print()
        
        for entity_file in entity_files:
            print(f"🔍 처리 중: {entity_file.name}...", end=" ")
            if self.process_entity_file(entity_file):
                print("✅ tenantId 필드 추가됨")
            elif str(entity_file) in self.skipped_files:
                print("⏭️  이미 tenantId 필드 존재")
            else:
                print("❌ 실패")
        
        print()
        print("=" * 60)
        print("📊 처리 결과 요약")
        print("=" * 60)
        print(f"✅ 수정된 파일: {len(self.modified_files)}개")
        print(f"⏭️  스킵된 파일: {len(self.skipped_files)}개")
        print(f"❌ 오류 파일: {len(self.error_files)}개")
        print()
        
        if self.modified_files:
            print("✅ 수정된 파일 목록:")
            for file in self.modified_files:
                print(f"  - {Path(file).name}")
            print()
        
        if self.error_files:
            print("❌ 오류 파일 목록:")
            for file, error in self.error_files:
                print(f"  - {Path(file).name}: {error}")
            print()

def main():
    if len(sys.argv) > 1:
        base_path = sys.argv[1]
    else:
        base_path = os.getcwd()
    
    print("🚀 엔티티 tenantId 필드 자동 추가 스크립트 시작")
    print(f"📂 프로젝트 경로: {base_path}")
    print()
    
    adder = TenantIdFieldAdder(base_path)
    adder.process_all_entities()
    
    print("✅ 스크립트 실행 완료!")
    
    if adder.modified_files:
        print()
        print("⚠️  주의: 수정된 파일들을 확인하고 컴파일 테스트를 진행하세요.")
        print("   일부 엔티티는 tenantId가 필요 없을 수 있습니다.")

if __name__ == "__main__":
    main()

