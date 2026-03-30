# 와일드카드 DNS 레코드 설명

**작성일**: 2025-12-12  
**목적**: 와일드카드 DNS 레코드의 개념과 필요성 설명

---

## 와일드카드 DNS 레코드란?

### 개념

와일드카드 DNS 레코드는 **동적으로 생성되는 서브도메인**을 처리하기 위한 레코드입니다.

**예시**:
- `*.dev.core-solution.co.kr` 레코드 하나로
- `mindgarden.dev.core-solution.co.kr`
- `test123.dev.core-solution.co.kr`
- `tenant1.dev.core-solution.co.kr`
- 등 **모든 서브도메인**을 자동으로 처리

### 고정 도메인 vs 동적 서브도메인

#### 고정 도메인 (개별 레코드 필요)

이미 등록된 레코드들:
- `dev.core-solution.co.kr` → 개별 A 레코드
- `api.dev.core-solution.co.kr` → 개별 A 레코드
- `app.core-solution.co.kr` → 개별 A 레코드

**특징**: 각각 개별적으로 등록해야 함

#### 동적 서브도메인 (와일드카드 레코드 필요)

동적으로 생성되는 서브도메인들:
- `mindgarden.dev.core-solution.co.kr` → 와일드카드로 처리
- `test123.dev.core-solution.co.kr` → 와일드카드로 처리
- `tenant1.dev.core-solution.co.kr` → 와일드카드로 처리
- `tenant2.dev.core-solution.co.kr` → 와일드카드로 처리
- 등 **무한히 생성 가능한 서브도메인**

**특징**: 와일드카드 레코드 하나로 모두 처리

---

## 현재 문제점

### 현재 상태

**등록된 레코드** (고정 도메인):
- ✅ `dev` → `114.202.247.246`
- ✅ `api.dev` → `114.202.247.246`
- ✅ `app` → `211.37.179.204`
- ✅ `api` → `211.37.179.204`

**등록되지 않은 레코드** (동적 서브도메인):
- ❌ `*.dev` → **없음** (와일드카드 레코드 미설정)

### 결과

**고정 도메인**: 정상 작동
- `dev.core-solution.co.kr` → ✅ 정상
- `api.dev.core-solution.co.kr` → ✅ 정상

**동적 서브도메인**: 해석 불가
- `mindgarden.dev.core-solution.co.kr` → ❌ NXDOMAIN
- `test123.dev.core-solution.co.kr` → ❌ NXDOMAIN
- `tenant1.dev.core-solution.co.kr` → ❌ NXDOMAIN

---

## 해결 방법

### 와일드카드 A 레코드 추가

Gabia DNS 관리 페이지에서 다음 레코드를 추가:

```
타입: A
호스트/이름: *.dev
값/IP 주소: 114.202.247.246
TTL: 3600
```

### 와일드카드 레코드의 효과

와일드카드 레코드(`*.dev`) 하나를 추가하면:

**이전** (와일드카드 없음):
- `mindgarden.dev.core-solution.co.kr` → ❌ NXDOMAIN
- `test123.dev.core-solution.co.kr` → ❌ NXDOMAIN
- `tenant1.dev.core-solution.co.kr` → ❌ NXDOMAIN

**이후** (와일드카드 추가):
- `mindgarden.dev.core-solution.co.kr` → ✅ 114.202.247.246
- `test123.dev.core-solution.co.kr` → ✅ 114.202.247.246
- `tenant1.dev.core-solution.co.kr` → ✅ 114.202.247.246
- **모든 서브도메인** → ✅ 114.202.247.246

---

## 왜 와일드카드가 필요한가?

### 시나리오: 테넌트별 서브도메인

온보딩 프로세스에서:
1. 새 테넌트 생성 → `tenant-001.dev.core-solution.co.kr`
2. 또 다른 테넌트 생성 → `tenant-002.dev.core-solution.co.kr`
3. 또 다른 테넌트 생성 → `tenant-003.dev.core-solution.co.kr`
4. ... (무한히 생성 가능)

**와일드카드 없이**: 각 테넌트마다 개별 DNS 레코드 등록 필요 (불가능)
**와일드카드 있으면**: 와일드카드 레코드 하나로 모든 테넌트 서브도메인 처리

---

## Gabia DNS 관리 페이지에서 추가 방법

### 1. 레코드 추가 버튼 클릭

DNS 관리 페이지 하단의 **"+ 레코드 추가"** 버튼 클릭

### 2. 레코드 정보 입력

- **레코드 타입**: `A`
- **호스트/이름**: `*.dev` (또는 `*` - Gabia 인터페이스에 따라 다름)
- **값/IP 주소**: `114.202.247.246`
- **TTL**: `3600`

### 3. 저장

**"저장"** 버튼 클릭

---

## 추가 후 확인

```bash
# DNS 해석 확인
dig mindgarden.dev.core-solution.co.kr
# 예상 결과: 114.202.247.246

dig test123.dev.core-solution.co.kr
# 예상 결과: 114.202.247.246

# 접근 테스트
curl -I https://mindgarden.dev.core-solution.co.kr/
# 예상 결과: HTTP/2 200
```

---

## 요약

- **고정 도메인**: 개별 레코드로 등록 (이미 완료)
- **동적 서브도메인**: 와일드카드 레코드로 처리 (필요)
- **현재 문제**: 와일드카드 레코드(`*.dev`) 미설정
- **해결 방법**: Gabia DNS 관리 페이지에서 `*.dev` A 레코드 추가

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025-12-12

