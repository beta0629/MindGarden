# 마인드가든 서브페이지 시안 v1.1 · 2026-11-11 KST

subpages-v1은 건드리지 않았습니다. 이 폴더는 19:19 KST에 새로 만들었습니다.

## 반영한 결정 (재학 19:16)
- 자격·기법 명칭 원문 그대로: 전문자격 "놀이치료사, 미술치료사, 교류분석사", 교육 "경험적 가족치료, 인간중심, 미술치료, 모래놀이, 놀이치료, 교류분석, 종합심리검사 및 각종 검사 자격이수."
- 치료 금지는 효과·마케팅 문장에만. 제목 고딕 유지. 원문 오타 수정 안 함(빌드 때 홈페이지 리뉴얼 정리).

## 화면 (폭 × 높이 px)
| 경로 | 1440 | 390 |
|---|---|---|
| counselors/counselors | 3040 | 3245 |
| counseling/counseling-children-adolescents | 2268 | 2421 |
| counseling/counseling-adults | 2268 | 2393 |
| counseling/counseling-overlapping-concerns | 2268 | 2421 |
| counseling/counseling-couples-family | 2268 | 2395 |
| about/about | 4402 | 4390 |
| gallery/gallery | 3369 | 2935 |
| reviews/reviews | 2632 | 2717 |
| event/event (진행 중) | 2060 | 2161 |
| event/event-off (기간 밖) | 1260 | 1159 |
| blog/blog | 2648 | 2385 |
| videos/videos | 2658 | 2661 |
| screening/screening | 2874 | 3101 |
| privacy-terms/privacy | 1894 | 2082 |
| privacy-terms/terms | 1894 | 2082 |

각 PNG 옆에 같은 이름 .pcraft. 비교: counselors/counselors-before-after.png. 보드: subpages-v1.1-overview-board.png.

## 사진 사용
- 상세: 아동·청소년 c127 놀이 공간 / 성인 c167 몬스테라 / 겹친 어려움 c132 식물 액자 / 부부·가족 c147 꽃
- about: 히어로 c148 로비, 가치 c137 창가(데스크톱), 공간 c145 모래놀이실 · c171 놀이 공간 · c154 대기 공간 · c165 상담실
- gallery: 히어로 c73 모래놀이실, 격자 c133·c142 모래놀이실, c122·c174 놀이 공간, c148 로비, c152·c151 대기 공간, c163·c168 상담실
- reviews: c147 꽃 띠 / event: c64 꽃
- blog: 공식 블로그 글 대표 이미지 5장(RSS 19:18 KST) / videos: 채널 쇼츠 썸네일 8장(피드 19:18 KST)
- 원본: _shared/images/src, 가공 스크립트: _shared/images/prepare_images_v11.py (크롭·리사이즈만)

## 사진 슬롯(라벨만)
대표원장 사진(/counselors, /about), 블로그 1건(인물 프로필 썸네일 → 제목 카드), 후기 카드, 점검 문항·결과, 법률 본문·목차, 관리자 배너 슬롯.

## 확인 필요
1. 상세 4종 제목 질환명 표기 여부, 가족상담실 실사 유무
2. about 가치 본문·사진 이름(161, 대기 공간, 로비) 확정
3. /event 기간 밖 h1 문구, 크리스마스 패키지·정가 병기
4. /reviews 닉네임 vs 익명, 게시 기한 문구, 동의 문구(법률 원고)
5. /screening 주제 이름(질환명) 그대로 둘지, 본메뉴 노출 위치
6. /blog 노출 기준(후기·이벤트 글 제외 맞는지), 인물 썸네일 글 처리
7. 블로그·유튜브 썸네일을 "센터 실사" 규칙 안에 넣어도 되는지 (센터 소유 채널 원본)
8. 개인정보처리방침·이용약관 법률 원고와 시행일
9. 학력 표기(청소년 교육 vs 교육학), 박사일부수료 공식 표기
