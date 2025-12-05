#!/bin/bash
# 모든 프로시저에서 LEAVE 문을 ELSEIF로 변경하는 스크립트

PROCEDURES_DIR="database/schema/procedures_standardized"

echo "🔧 모든 프로시저에서 LEAVE 문 제거 중..."

for file in "$PROCEDURES_DIR"/*_standardized.sql; do
    if [ -f "$file" ]; then
        proc_name=$(basename "$file" _standardized.sql)
        
        # LEAVE 문이 있는지 확인
        if grep -q "LEAVE;" "$file"; then
            echo "  ⚠️  $proc_name: LEAVE 문 발견 (수동 수정 필요)"
            echo "     패턴: ProcessDiscountAccounting 참고"
        fi
    fi
done

echo ""
echo "✅ 검사 완료!"
echo ""
echo "📝 수정 가이드:"
echo "1. IF ... THEN ... LEAVE; END IF; 패턴을 ELSEIF로 변경"
echo "2. 모든 로직을 ELSE 블록 안에 배치"
echo "3. 들여쓰기 정확히 맞추기 (4칸씩)"
echo "4. ProcessDiscountAccounting_standardized.sql 참고"

