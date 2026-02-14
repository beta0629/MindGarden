#!/usr/bin/env bash
# 바뀐 내용 검증 스크립트 (GNB CTA 등 UI 변경 회귀 방지)
# exit 0: 통과, exit 1: 실패

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAV="$ROOT/components/Navigation.tsx"
FAIL=0

echo "=== 바뀐 내용 검증 (verify-ui-changes) ==="

# 1) Navigation.tsx에 GNB/드로어 CTA: "센터 위치" + /location 있어야 함
if ! grep -q '센터 위치' "$NAV"; then
  echo "FAIL: Navigation.tsx에 '센터 위치' 텍스트가 없습니다."
  FAIL=1
fi
if ! grep -q 'href="/location"' "$NAV"; then
  echo "FAIL: Navigation.tsx에 href=\"/location\" 이 없습니다."
  FAIL=1
fi

# 2) GNB/드로어 CTA에 "상담 예약" 없어야 함 (바텀시트로 대체됨)
if grep -q '상담 예약' "$NAV"; then
  echo "FAIL: Navigation.tsx에 '상담 예약'이 있습니다. CTA는 '센터 위치'로만 유지해야 합니다."
  FAIL=1
fi

# 3) gnb-cta, gnb-drawer-cta 영역에 Link + /location 사용
if ! grep -q 'gnb-cta' "$NAV" || ! grep -q 'gnb-drawer-cta' "$NAV"; then
  echo "FAIL: Navigation.tsx에 gnb-cta 또는 gnb-drawer-cta가 없습니다."
  FAIL=1
fi

# 4) 문의 메뉴·#contact 없어야 함 (바텀시트로만)
if grep -q "#contact" "$NAV" || grep -q "label: '문의'" "$NAV"; then
  echo "FAIL: Navigation.tsx에 '문의' 메뉴 또는 #contact가 있습니다. 문의/상담 예약은 바텀시트로만 노출해야 합니다."
  FAIL=1
fi

if [ "$FAIL" -eq 0 ]; then
  echo "PASS: 검증 항목 모두 통과."
  exit 0
fi
exit 1
