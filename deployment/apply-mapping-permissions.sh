#!/bin/bash

# 매핑 권한 적용 스크립트
# 운영 서버에 매핑 관리 권한을 추가합니다

set -e

echo "🔐 매핑 권한 적용 스크립트 시작"
echo "================================"

# 서버 정보
SERVER="beta74.cafe24.com"
DB_NAME="mindgarden"

echo "📡 운영 서버: $SERVER"
echo "🗄️ 데이터베이스: $DB_NAME"
echo ""

# SQL 파일 경로
SQL_FILE="../src/main/resources/sql/add_mapping_permissions.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL 파일을 찾을 수 없습니다: $SQL_FILE"
    exit 1
fi

echo "📄 SQL 파일 확인 완료: $SQL_FILE"
echo ""

# 사용자에게 확인 요청
echo "⚠️  다음 작업을 수행합니다:"
echo "   1. permissions 테이블에 매핑 관련 권한 추가"
echo "   2. role_permissions 테이블에 역할별 권한 매핑 추가"
echo ""
read -p "계속하시겠습니까? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 작업이 취소되었습니다."
    exit 0
fi

echo ""
echo "🚀 SQL 실행 중..."
echo "================================"

# SSH로 운영 서버에 접속하여 SQL 실행
# 비밀번호는 수동으로 입력해야 합니다
ssh mindgarden@$SERVER << 'ENDSSH'
    cd /home/mindgarden/mindgarden
    
    # SQL 파일 다운로드 (GitHub에서)
    echo "📥 SQL 파일 다운로드 중..."
    wget -q -O /tmp/add_mapping_permissions.sql https://raw.githubusercontent.com/beta0629/MindGarden/main/src/main/resources/sql/add_mapping_permissions.sql
    
    if [ ! -f /tmp/add_mapping_permissions.sql ]; then
        echo "❌ SQL 파일 다운로드 실패"
        exit 1
    fi
    
    echo "✅ SQL 파일 다운로드 완료"
    echo ""
    
    # MySQL 실행
    echo "🗄️ MySQL 접속 중..."
    echo "비밀번호를 입력하세요:"
    mysql -u mindgarden -p mindgarden < /tmp/add_mapping_permissions.sql
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ SQL 실행 성공!"
        # 임시 파일 삭제
        rm /tmp/add_mapping_permissions.sql
    else
        echo ""
        echo "❌ SQL 실행 실패"
        exit 1
    fi
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "================================"
    echo "✅ 매핑 권한 적용 완료!"
    echo ""
    echo "📋 적용된 권한:"
    echo "   - MAPPING_MANAGE (매핑 관리)"
    echo "   - MAPPING_DELETE (매핑 삭제)"
    echo "   - MAPPING_UPDATE (매핑 수정)"
    echo "   - MAPPING_VIEW (매핑 조회)"
    echo ""
    echo "👥 권한이 부여된 역할:"
    echo "   - HQ_MASTER (모든 권한)"
    echo "   - BRANCH_MANAGER (모든 권한)"
    echo "   - ADMIN (모든 권한)"
    echo "   - BRANCH_SUPER_ADMIN (모든 권한)"
    echo "   - HQ_ADMIN (조회/관리)"
    echo "   - SUPER_HQ_ADMIN (조회/관리)"
    echo "   - BRANCH_ADMIN (조회/관리)"
    echo "   - CONSULTANT (조회만)"
    echo ""
    echo "🎉 이제 지점수퍼관리자로 매핑 삭제가 가능합니다!"
else
    echo ""
    echo "❌ 권한 적용 실패"
    exit 1
fi

