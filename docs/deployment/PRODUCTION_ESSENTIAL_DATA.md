# 운영 DB·데이터 선별 가이드 (필수 vs 비필수)

**목적**: 빈 운영 DB 또는 최초 배포 시 **없으면 런타임 오류·기능 불가**가 나는 데이터와, **넣으면 안 되는 데이터**를 구분한다.

**관련**: [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) §5, Flyway `src/main/resources/db/migration/`

---

## 1. 원칙

| 원칙 | 설명 |
|------|------|
| **스키마·대부분의 참조 데이터** | 앱 기동 시 **Flyway 마이그레이션 순서대로 자동 적용**된다. 별도 덤프가 없어도 **마이그레이션만 성공**하면 코드·테이블·다수 INSERT는 따라온다. |
| **운영에 복사하면 안 되는 것** | 개발 DB의 **테스트 계정, 샘플 고객, 결제 테스트, 온보딩 더미**, `test-*@example.com` 등 **개인정보·테스트 전용 행** |
| **마이그레이션만으로 부족한 것** | **환경변수·Vault**, **PG/결제 실키**, **SMTP**, **최초 플랫폼 관리자·Ops 승인 권한**, **실제 테넌트·사용자 데이터** |

### 1.1 운영: 테넌트는 Mind Garden 온보딩으로만 생성

**현재 운영 방침**: 운영 DB에는 **개발 테넌트 행을 덤프해 넣지 않는다.** Mind Garden **온보딩**(테넌트 신청 → 검토·승인 → 프로비저닝)을 통해 **테넌트·초기 설정·관리자 계정**을 만든다.

| 해야 할 것 | 하지 말 것 |
|------------|------------|
| Flyway로 마스터·공통코드·메뉴 등 참조 데이터 확보 | `tenants` 등 **운영 테넌트 본문**을 개발 DB에서 통째 복사 |
| Ops/플랫폼에서 **온보딩 승인** 가능한 최초 운영자 확보 | 테스트용 `V20251227_*` 온보딩 행을 운영에 그대로 두기(가능하면 0건) |
| 스테이징에서도 **동일 온보딩 플로우**로 스모크 | SQL로만 “가짜 테넌트” 대량 생성 후 운영과 동기화 착각 |

배포 직후 **테넌트 행이 0건**이어도 정상일 수 있다. 첫 실제 테넌트는 **첫 온보딩 승인** 이후 생긴다.

---

## 2. Flyway로 이미 들어오는 것 (선별 “덤프” 불필요)

아래는 **배포 시 마이그레이션이 실행되면** 함께 쌓이는 **마스터·참조 성격** 데이터다. 운영 전용으로 “개발에서만 돌린 SQL”을 또 넣을 필요는 없다(버전 중복 시 `INSERT IGNORE` 등 설계에 따름).

| 유형 | 예시 마이그레이션·영역 |
|------|-------------------------|
| 업종·카테고리 | `V9__insert_initial_data.sql` — `business_categories` 등 |
| 공통 코드·역할 코드 | `V20251205_001__initialize_standard_role_codes.sql`, `V20260212_002__clean_global_role_common_codes.sql`(전역 ROLE 4종만 유지), `V20260331_002__ensure_global_four_role_common_codes.sql`(전역 4역할 idempotent 보정), `V52__insert_user_status_grade_common_codes.sql`, `V36__insert_billing_common_codes.sql` 등 |
| 메뉴·권한 뼈대 | `V20251203_*` admin/dynamic menu, group permission |
| 위젯·역할 템플릿 | `V46__add_default_widgets_to_role_templates.sql` 등 |
| 과금·코드 연동 | `V24`, `V53`, `V55` 등 빌링 관련 |
| 온보딩·프로시저 | PL/SQL 생성 마이그레이션 + `PlSqlInitializer` 보강 |

> **주의**: 파일명에 **`test`**, **`insert_onboarding_test`**, **`insert_pending_onboarding_test`** 가 붙은 마이그레이션은 **테스트 데이터 삽입**이 포함될 수 있다. 운영 정책상 **차단·스테이징만 적용** 등 별도 합의가 없으면, 레포 정리(운영 프로파일에서 제외 등)를 검토한다.

---

## 3. 운영에 “반드시” 채워야 하는 것 (마이그레이션 외)

| 구분 | 내용 | 없을 때 증상 예 |
|------|------|-----------------|
| **DB 연결** | `application-prod` / env: JDBC URL, user, password | 기동 실패 |
| **JWT·세션** | `JWT_SECRET` 등 | 로그인 불가·토큰 오류 |
| **메일** | SMTP host/user/password (비밀번호 재설정·알림) | 메일 기능 전부 실패 |
| **OAuth** | Kakao/Naver 등 **운영 콜솔**에 리다이렉트 URI 등록 | 소셜 로그인 실패 |
| **PG·결제** | 운영 MID/키, 웹훅 URL | 결제·정산 오류 |
| **파일 저장** | 업로드 경로 권한·(S3 시) 버킷·키 | 업로드 5xx |
| **최초 관리 주체** | 온보딩 승인·Ops 접근 가능한 **실계정** 또는 표준 “첫 테넌트” 절차 | 관리 화면 무반응 |

**플랫폼·Ops 승인자**(온보딩 결정 권한)는 DB·권한 설계에 맞게 **1회 시드 또는 기존 시스템 계정**으로 확보한다. **운영 테넌트 본문**은 §1.1대로 **온보딩으로만** 만든다. “개발 DB 통째 덤프”로 해결하지 말 것.

---

## 4. 개발 DB에서 운영으로 가져가면 안 되는 것

| 항목 | 이유 |
|------|------|
| `onboarding_request` 중 `test-%@example.com` 등 | `V20251227_*` 테스트 시나리오 |
| ERP/상담 **실명·실전화번호 샘플** | 개인정보·오인 리스크 |
| 개발용 **요금제·쿠폰**만 있는 행 | `V22__insert_test_pricing_plans.sql` 등 — 운영 정책에 “테스트 플랜” 필요 여부 별도 결정 |
| **API 키·웹훅 시크릿**이 박힌 행 | 환경 분리 위반 |

---

## 5. 배포 직후 검증 쿼리 (예시)

운영 DB 읽기 전용 계정으로 **존재 여부만** 확인:

```sql
-- 마스터·참조 최소 행 수 (임계값은 환경마다 조정)
SELECT COUNT(*) FROM business_categories;
-- ROLE: 코어 API(/api/v1/common-codes/core/groups/ROLE)는 tenant_id IS NULL 행만 사용.
-- 정상 시 최소 4건(ADMIN, STAFF, CONSULTANT, CLIENT). 0건이면 Flyway V20260331_002 등으로 보정.
SELECT COUNT(*) FROM common_codes
WHERE code_group = 'ROLE' AND tenant_id IS NULL AND IFNULL(is_deleted, 0) = 0 AND is_active = TRUE;

-- 온보딩 테스트 데이터 잔존 여부 (0이 이상적, 마이그레이션 V20251227_* 와 동일 패턴)
SELECT COUNT(*) FROM onboarding_request WHERE requested_by LIKE 'test-%@example.com';
```

---

## 6. 권장 워크플로

1. **스테이징 DB**에 운영과 동일 마이그레이션만 적용 → 스모크  
2. 운영은 **빈 DB + Flyway** 또는 **스키마만 복제** 후 마이그레이션  
3. **테넌트·실사용자 데이터**는 §1.1 — **Mind Garden 온보딩**으로만 적재 (이관 덤프 아님)  
4. 레거시 이관 등 **예외적 데이터 이관**이 필요하면 **테이블 단위 화이트리스트** + **익명화** 문서를 별도 작성  
5. 본 문서와 [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) **§5** 를 배포 티켓에 링크  

---

**문서 끝.** 마이그레이션 파일이 늘어나면 “테스트 전용” 파일명·설명을 본 문서 §2에 주기적으로 반영할 것.
