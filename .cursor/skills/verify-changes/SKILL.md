# 바뀐 내용 검증 (Verify Changes)

배포 또는 수정 후 **UI/코드 변경이 기대대로 반영되었는지** 검증할 때 사용하는 스킬입니다.

## 사용 시기
- "배포 후 검증해줘", "수정됐을 때 확인해줘", "바뀐 내용 검증해줘" 요청 시
- **소스 수정이 끝나면 서브에이전트로 개발 배포 진행** 요청 시: 검증 실행 → 통과 시 커밋·푸시(`homepage/develop`)로 개발 배포까지 수행. 배포 절차: `.cursor/skills/deploy-and-servers/SKILL.md`
- 배포·머지·리팩터 후 회귀 확인이 필요할 때

## 검증 절차

### 1. 스크립트 실행 (필수)
프로젝트 루트에서:
```bash
./scripts/verify-ui-changes.sh
```
- **exit 0**: 검증 통과
- **exit 1**: 검증 실패 (어떤 항목이 실패했는지 출력됨)

### 2. 체크리스트 (수동 확인 시 참고)

| 항목 | 기대 상태 | 확인 위치 |
|------|-----------|-----------|
| GNB CTA (데스크톱) | 텍스트 "센터 위치", 링크 `/location`, `gnb-cta` 클래스 | `components/Navigation.tsx` |
| GNB CTA에 "상담 예약" | 없어야 함 (바텀시트로 대체됨) | `components/Navigation.tsx` |
| 모바일 드로어 CTA | "센터 위치", `/location` | `components/Navigation.tsx` (gnb-drawer-cta) |
| 문의 메뉴 | GNB 메뉴에 "문의"(#contact) 없어야 함 (바텀시트로만) | `components/Navigation.tsx` menu 배열 |
| 상담 예약·문의 진입점 | 바텀시트로만 존재 | ConsultationBottomSheet |

### 3. 검증 결과 보고
- 스크립트 결과를 그대로 전달
- 실패 시: 실패한 항목과 해당 파일/라인 안내
- 필요 시 해당 파일을 열어 수정 제안

## 검증 스크립트가 확인하는 항목 (현재)
- `Navigation.tsx` 내 `gnb-cta` 영역에 "센터 위치" 텍스트 및 `href="/location"` 존재
- `gnb-cta` 영역에 "상담 예약" 텍스트 없음
- `gnb-drawer-cta` 에 "센터 위치" 및 `/location` 존재
- `Navigation.tsx` 에 "문의" 메뉴·`#contact` 없음 (문의/상담 예약은 바텀시트로만)

스크립트는 `scripts/verify-ui-changes.sh` 에서 수정·추가 가능함. 정책: `.cursor/skills/gnb-inquiry-bottom-sheet/SKILL.md`
