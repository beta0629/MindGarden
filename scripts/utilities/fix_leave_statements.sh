#!/bin/bash
# 모든 프로시저에서 LEAVE 문을 ELSEIF로 변경하는 스크립트
# 성공 패턴: ProcessDiscountAccounting 참고

PROCEDURES_DIR="database/schema/procedures_standardized"

echo "🔧 프로시저 LEAVE 문 제거 스크립트"
echo ""

# 수정할 프로시저 목록
PROCEDURES=(
    "GetRefundableSessions"
    "GetRefundStatistics"
    "ValidateIntegratedAmount"
    "GetConsolidatedFinancialData"
    "ProcessIntegratedSalaryCalculation"
)

for proc in "${PROCEDURES[@]}"; do
    file="${PROCEDURES_DIR}/${proc}_standardized.sql"
    if [ -f "$file" ]; then
        leave_count=$(grep -c "LEAVE;" "$file" 2>/dev/null || echo 0)
        if [ "$leave_count" -gt 0 ]; then
            echo "  ⚠️  $proc: $leave_count개 LEAVE 문 발견"
            echo "     수정 필요: IF ... LEAVE; END IF; → ELSEIF로 변경"
        else
            echo "  ✅ $proc: LEAVE 문 없음"
        fi
    fi
done

echo ""
echo "📝 수정 가이드:"
echo "1. 연속된 IF ... LEAVE; END IF; 패턴을 ELSEIF로 변경"
echo "2. 모든 로직을 ELSE 블록 안에 배치"
echo "3. END IF 추가 (ELSE 블록 닫기)"
echo "4. 들여쓰기 정확히 맞추기 (4칸씩)"
echo "5. ProcessDiscountAccounting_standardized.sql 참고"
