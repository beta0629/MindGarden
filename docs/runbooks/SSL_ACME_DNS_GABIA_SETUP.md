# Phase B 사용자 가이드 — 가비아 DNS 등록 (5~10분)

## 0. 사전 준비

이 문서는 Phase A (acme-dns 셀프호스팅 설치, dev 서버) 완료 후, 와일드카드 SSL 무인 갱신을 위해 사용자가 **1회만** 수행하는 가비아 작업입니다.

- 관련 설계서: [`docs/project-management/2026-05-28/SSL_WILDCARD_ACMEDNS_AUTO_RENEW_HANDOFF.md`](../project-management/2026-05-28/SSL_WILDCARD_ACMEDNS_AUTO_RENEW_HANDOFF.md)
- 소요 시간: 5~10분 (DNS 전파 5~30분 별도 대기)
- 수행자: 도메인 관리자 (가비아 로그인 가능자)

## 1. 등록할 레코드 (3건)

2026-05-28 Phase A 에서 dev 서버 실측으로 발급된 UUID 와 IP 입니다.

| # | 타입 | 호스트(서브도메인) | 값 | TTL | 설명 |
|---|---|---|---|---|---|
| 1 | **A** | `acme` | `114.202.247.246` | 600 | acme-dns 서비스의 권한 네임서버 도메인 (dev 서버 외부 IP) |
| 2 | **CNAME** | `_acme-challenge` | `749824da-c3d2-4feb-b57d-b69714dc73c5.acme.core-solution.co.kr.` | 600 | 운영 와일드카드(`*.core-solution.co.kr`) DNS-01 위임 |
| 3 | **CNAME** | `_acme-challenge.dev` | `273e2713-db44-4e62-a5a8-9eb1fab37f1f.acme.core-solution.co.kr.` | 600 | dev 와일드카드(`*.dev.core-solution.co.kr`) DNS-01 위임 |

> CNAME 값 끝의 `.`(루트 마침표)는 가비아 입력 시 자동으로 처리되거나 생략 가능합니다. UI에 따라 다르므로 입력 후 저장 결과를 확인하세요.

> ⚠️ 가비아에 현재 `acme.core-solution.co.kr` 이 다른 IP(예: `211.37.179.204`)로 등록되어 있다면 위 #1은 **수정** 입니다.

## 2. 가비아 등록 절차 (Step-by-Step)

### Step 2-1. 가비아 My가비아 로그인

1. https://my.gabia.com 접속 후 로그인
2. 좌측 메뉴 **도메인 통합관리툴** → **`core-solution.co.kr`** 클릭
3. **DNS 정보** 탭 선택

### Step 2-2. A 레코드 추가/수정 (acme 서브도메인)

1. **DNS 레코드 설정** → **추가** 버튼 (또는 기존 `acme` A 레코드가 있으면 **수정**)
2. 입력:
   - 타입: `A`
   - 호스트: `acme`
   - 값/위치: `114.202.247.246`
   - TTL: `600`
3. **저장**

### Step 2-3. CNAME 레코드 2건 추가

#### Step 2-3-a. 운영 와일드카드용 (`_acme-challenge`)

1. **추가** → 타입: `CNAME`
2. 입력:
   - 호스트: `_acme-challenge`
   - 값/위치: `749824da-c3d2-4feb-b57d-b69714dc73c5.acme.core-solution.co.kr.`
   - TTL: `600`
3. **저장**

#### Step 2-3-b. dev 와일드카드용 (`_acme-challenge.dev`)

1. **추가** → 타입: `CNAME`
2. 입력:
   - 호스트: `_acme-challenge.dev`
   - 값/위치: `273e2713-db44-4e62-a5a8-9eb1fab37f1f.acme.core-solution.co.kr.`
   - TTL: `600`
3. **저장**

### Step 2-4. 변경 적용

가비아는 보통 **즉시 반영** 되지만 **전파(propagation)** 는 5~30분 소요됩니다.

## 3. 전파 확인 (필수)

로컬 터미널 또는 dev 서버에서:

```bash
dig A acme.core-solution.co.kr +short
dig CNAME _acme-challenge.core-solution.co.kr +short
dig CNAME _acme-challenge.dev.core-solution.co.kr +short
dig @acme.core-solution.co.kr 749824da-c3d2-4feb-b57d-b69714dc73c5.acme.core-solution.co.kr TXT +short
```

3건 모두 기대 결과가 나오면 **Phase B 완료** 입니다.

## 4. 완료 보고

다음을 코더 / 메인 어시스턴트에 알려주세요:
- [ ] A 레코드 등록 완료
- [ ] 운영 CNAME 등록 완료
- [ ] dev CNAME 등록 완료
- [ ] `dig` 명령 결과 모두 기대값 일치 (3건)

확인 후 **Phase C** (코더 위임 — `issue-wildcard-ssl-via-acmedns.sh` 호출) 를 진행합니다.

## 5. 트러블슈팅

### 5-1. `dig` 결과가 비어 있음
- 전파 대기 시간 부족: 30분 더 대기 후 재시도
- 가비아 저장 누락: My가비아 DNS 정보 화면에서 3건 모두 존재 재확인
- 호스트 입력 오류: `_acme-challenge` (앞에 `_` 필수), CNAME 값 끝 `.` 처리 확인

### 5-2. CNAME 값에 `.` 가 빠진 경우
가비아가 자동으로 도메인 suffix 를 추가해 `<uuid>.acme.core-solution.co.kr.core-solution.co.kr` 처럼 되는 경우가 있습니다. `dig` 결과로 즉시 확인 가능하며, 잘못된 경우 레코드 수정 후 저장.

### 5-3. acme.core-solution.co.kr 자체에 NS 위임도 필요한가?
**아니요.** A 레코드만으로 충분합니다. acme-dns 는 CNAME 으로 위임된 `<uuid>.acme.core-solution.co.kr` 의 TXT 만 응답하면 됩니다. (NS 위임은 더 강력한 격리 옵션이지만 가비아 UI 복잡도가 높아 권장하지 않습니다.)

### 5-4. 운영 와일드카드 갱신 중 dev 다운 시
설계서 §10 참고 — Let's Encrypt 는 만료 30일 전부터 갱신을 시도하므로 dev 가 그 기간 중 일시 다운되어도 다음 갱신 사이클까지 30일 유예가 있습니다.

## 6. 롤백

가비아에서 위 3건 (A 1건 + CNAME 2건) 삭제 시 즉시 기존 수동 발급 방식으로 회귀됩니다. acme-dns 자체는 dev 서버에서 계속 동작하지만 외부 노출이 없어 영향 0.
