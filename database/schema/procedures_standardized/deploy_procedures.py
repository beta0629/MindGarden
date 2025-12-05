#!/usr/bin/env python3
"""
표준화된 프로시저를 개발 DB에 배포하는 스크립트
"""
import pymysql
import os
import sys

DB_CONFIG = {
    'host': 'beta0629.cafe24.com',
    'user': 'mindgarden_dev',
    'password': 'MindGardenDev2025!@#',
    'database': 'core_solution',
    'charset': 'utf8mb4'
}

PROCEDURES_DIR = os.path.dirname(os.path.abspath(__file__))

def deploy_procedure(procedure_name):
    """단일 프로시저 배포"""
    file_path = os.path.join(PROCEDURES_DIR, f"{procedure_name}_standardized.sql")
    
    if not os.path.exists(file_path):
        print(f"❌ 파일을 찾을 수 없습니다: {file_path}")
        return False
    
    print(f"📤 배포 중: {procedure_name}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # DELIMITER 제거 및 처리
        sql_content = sql_content.replace('DELIMITER //', '')
        sql_content = sql_content.replace('DELIMITER ;', '')
        sql_content = sql_content.replace('//', ';')
        
        # 여러 세미콜론을 하나로 정리
        while ';;' in sql_content:
            sql_content = sql_content.replace(';;', ';')
        
        # 연결 및 실행
        connection = pymysql.connect(**DB_CONFIG)
        try:
            with connection.cursor() as cursor:
                # 여러 문장으로 분리하여 실행
                statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]
                
                for statement in statements:
                    if statement:
                        try:
                            cursor.execute(statement)
                        except Exception as e:
                            if 'already exists' not in str(e).lower() and 'does not exist' not in str(e).lower():
                                print(f"⚠️  경고: {e}")
                
                connection.commit()
                print(f"✅ {procedure_name} 배포 완료")
                return True
        finally:
            connection.close()
            
    except Exception as e:
        print(f"❌ {procedure_name} 배포 실패: {e}")
        return False

def main():
    """메인 함수"""
    procedures = [
        "CheckTimeConflict",
        "GetRefundableSessions",
        "GetRefundStatistics",
        "ValidateIntegratedAmount",
        "GetConsolidatedFinancialData"
    ]
    
    print("🚀 표준화된 프로시저 배포 시작...")
    print(f"서버: {DB_CONFIG['host']}")
    print(f"DB: {DB_CONFIG['database']}")
    print("")
    
    success_count = 0
    for proc in procedures:
        if deploy_procedure(proc):
            success_count += 1
    
    print("")
    print(f"✅ 배포 완료: {success_count}/{len(procedures)}개 성공")

if __name__ == "__main__":
    main()

