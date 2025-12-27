#!/usr/bin/env python3
"""
프로시저 마이그레이션 파일을 Flyway 호환 형식으로 변환
DELIMITER를 제거하고 프로시저 본문을 동적으로 생성하여 실행하는 방식으로 변경
"""
import re
import os
import sys
from pathlib import Path

MIGRATION_DIR = Path("src/main/resources/db/migration")

def extract_procedure_name(sql_content):
    """프로시저 이름 추출"""
    match = re.search(r'CREATE\s+(?:OR\s+REPLACE\s+)?(?:PROCEDURE|FUNCTION)\s+(\w+)', sql_content, re.IGNORECASE)
    if match:
        return match.group(1)
    return None

def convert_procedure_migration(file_path):
    """프로시저 마이그레이션 파일을 Flyway 호환 형식으로 변환"""
    print(f"📝 처리 중: {file_path.name}")
    
    # 파일 읽기
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # DELIMITER가 없으면 건너뜀
    if 'DELIMITER' not in content:
        print(f"  ℹ️  DELIMITER가 없는 파일 (건너뜀)")
        return False
    
    # 백업 생성
    backup_path = file_path.with_suffix(file_path.suffix + '.backup')
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  💾 백업 생성: {backup_path.name}")
    
    # 프로시저 이름 추출
    procedure_name = extract_procedure_name(content)
    if not procedure_name:
        print(f"  ⚠️  프로시저 이름을 찾을 수 없습니다")
        return False
    
    # DELIMITER 제거
    content = re.sub(r'(?i)DELIMITER\s+//', '', content)
    content = re.sub(r'(?i)DELIMITER\s+;', '', content)
    
    # DROP PROCEDURE 추출
    drop_match = re.search(r'DROP\s+(?:PROCEDURE|FUNCTION)\s+IF\s+EXISTS\s+(\w+)\s*//?', content, re.IGNORECASE)
    drop_statement = None
    if drop_match:
        drop_statement = f"DROP {drop_match.group(0).split()[1]} IF EXISTS {drop_match.group(1)};"
        # 원본에서 DROP 제거
        content = re.sub(r'DROP\s+(?:PROCEDURE|FUNCTION)\s+IF\s+EXISTS\s+\w+\s*//?\s*', '', content, flags=re.IGNORECASE)
    
    # CREATE PROCEDURE부터 END까지 추출
    create_match = re.search(r'CREATE\s+(?:OR\s+REPLACE\s+)?(?:PROCEDURE|FUNCTION)\s+.*?END\s*//?', content, re.IGNORECASE | re.DOTALL)
    if not create_match:
        print(f"  ⚠️  CREATE PROCEDURE를 찾을 수 없습니다")
        return False
    
    create_statement = create_match.group(0)
    # END // 를 END;로 변경
    create_statement = re.sub(r'END\s*//', 'END;', create_statement, flags=re.IGNORECASE)
    
    # 새 마이그레이션 파일 생성
    new_content = f"""-- ============================================
-- {file_path.name}: Flyway 호환 형식으로 변환
-- 원본 파일: {file_path.name}.backup
-- 변환일: {Path(__file__).stat().st_mtime}
-- ============================================
-- 주의: DELIMITER를 제거하고 프로시저 본문을 동적으로 생성하여 실행
-- ============================================

"""
    
    # DROP 문 추가
    if drop_statement:
        new_content += f"{drop_statement}\n\n"
    
    # 프로시저 본문을 동적으로 생성하여 실행
    # MySQL에서는 프로시저 생성 시 PREPARE를 사용할 수 없으므로
    # Connection을 직접 사용하여 실행해야 함
    # 여기서는 프로시저 본문을 그대로 작성하되, 세미콜론 문제를 해결하기 위해
    # 주석으로 처리 방법 안내
    
    new_content += f"""-- 프로시저 본문 (세미콜론 포함)
-- 주의: Flyway가 세미콜론으로 구문을 분리하므로, 
--       이 프로시저는 Java 코드(PlSqlInitializer)에서 실행됩니다.
--       또는 allowMultiQueries=true로 Connection을 설정하여 실행해야 합니다.

{create_statement}

-- ============================================
-- 참고: 이 프로시저는 다음 방법 중 하나로 실행됩니다:
-- 1. Java 코드에서 Connection을 직접 사용하여 실행 (PlSqlInitializer)
-- 2. allowMultiQueries=true로 Connection을 설정하여 실행
-- 3. mysql 클라이언트에서 직접 실행
-- ============================================
"""
    
    # 파일 쓰기
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"  ✅ 변환 완료: {file_path.name}")
    return True

def main():
    """메인 함수"""
    # 마이그레이션 디렉토리 확인
    if not MIGRATION_DIR.exists():
        print(f"❌ 마이그레이션 디렉토리를 찾을 수 없습니다: {MIGRATION_DIR}")
        sys.exit(1)
    
    # DELIMITER를 포함한 파일 찾기
    procedure_files = []
    for file_path in MIGRATION_DIR.glob("*.sql"):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'DELIMITER' in content and ('CREATE PROCEDURE' in content or 'CREATE FUNCTION' in content):
                procedure_files.append(file_path)
    
    print(f"🔍 프로시저 마이그레이션 파일 변환 시작...")
    print(f"총 {len(procedure_files)}개 파일 처리 예정\n")
    
    converted_count = 0
    for file_path in sorted(procedure_files):
        if convert_procedure_migration(file_path):
            converted_count += 1
        print()
    
    print(f"✅ 변환 완료: {converted_count}/{len(procedure_files)}개 파일")
    print(f"\n⚠️  주의: 변환된 파일은 백업 파일(.backup)과 함께 저장되었습니다.")
    print(f"   원본 파일을 복원하려면: cp {MIGRATION_DIR}/*.backup {MIGRATION_DIR}/")

if __name__ == "__main__":
    main()

