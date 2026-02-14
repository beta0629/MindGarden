# GNB 문의·상담 예약 정책 (바텀시트로 통합)

문의 및 상담 예약 진입점은 **하단 바텀시트로만** 제공한다. GNB(글로벌 네비게이션)에는 두지 않는다.

## 규칙
- **GNB 메뉴**: "문의"(#contact) 메뉴 항목 **없음**. 추가하지 말 것.
- **GNB CTA(우측 버튼)**: "상담 예약" **없음**. CTA는 **"센터 위치"**(/location)만 사용.
- **상담 예약·문의 진입**: `ConsultationBottomSheet`(하단 고정 바텀시트)로만 노출.

## 이유
- 바텀시트가 상담 문의/예약을 담당하므로, GNB에 문의·상담 예약 링크를 중복 두지 않음.
- GNB CTA는 "센터 위치"(찾아오시는 길)로 통일.

## 수정 시 주의
- Navigation.tsx의 `menu` 배열에 `{ label: '문의', href: '#contact' }` 를 다시 넣지 말 것.
- `gnb-cta` 또는 `gnb-drawer-cta`에 "상담 예약" 또는 `#contact` 를 사용하지 말 것.

## 관련 파일
- `components/Navigation.tsx` — 메뉴 배열, GNB CTA, 드로어 CTA
- `components/ConsultationBottomSheet.tsx` — 문의/상담 예약 UI
