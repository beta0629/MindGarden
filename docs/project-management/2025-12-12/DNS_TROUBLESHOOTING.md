# DNS 레코드 설정 후 해석 실패 문제 해결

**작성일**: 2025-12-12  
**상황**: 와일드카드 DNS 레코드를 추가했지만 여전히 해석되지 않음

---

## 현재 상태

**문제**: DNS 레코드를 추가했지만 여전히 해석되지 않음

**확인 결과**:
- `dev.core-solution.co.kr` → ✅ 정상 (114.202.247.246)
- `mindgarden.dev.core-solution.co.kr` → ❌ NXDOMAIN
- `test1.dev.core-solution.co.kr` → ❌ NXDOMAIN
- 모든 동적 서브도메인 → ❌ NXDOMAIN

---

## 가능한 원인 및 해결 방법

### 1. DNS 전파 대기 중

**원인**: DNS 레코드를 추가한 후 전파되는데 시간이 걸림

**해결 방법**:
- **전파 시간**: 보통 5분 ~ 1시간 (TTL 값에 따라 다름)
- **확인 방법**: 
  ```bash
  dig @ns.gabia.co.kr mindgarden.dev.core-solution.co.kr
  ```
  Gabia 네임서버에서 직접 확인하면 전파 여부를 즉시 확인할 수 있습니다.

### 2. 레코드 호스트 이름 형식 오류

**가능한 형식**:
- `*.dev` (권장)
- `*` (Gabia에 따라 다를 수 있음)
- `*.dev.core-solution.co.kr` (일부 DNS 제공자)

**확인 방법**:
- DNS 관리 페이지에서 레코드 목록 확인
- `*.dev` 또는 `*` 형식의 레코드가 있는지 확인

**해결 방법**:
- 올바른 형식으로 다시 추가
- Gabia 고객센터에 문의하여 정확한 형식 확인

### 3. 저장 버튼을 누르지 않음

**확인 방법**:
- DNS 관리 페이지 하단의 **"저장"** 버튼을 눌렀는지 확인
- 레코드를 추가한 후 반드시 저장해야 적용됩니다.

### 4. Gabia에서 와일드카드 레코드 미지원

**확인 방법**:
- Gabia 고객센터에 문의
- 와일드카드 레코드(`*.dev`) 지원 여부 확인

**대안**:
- 개별 서브도메인을 필요할 때마다 추가 (비효율적)
- 다른 DNS 제공자로 변경 고려

### 5. 레코드가 다른 이름으로 추가됨

**확인 방법**:
- DNS 관리 페이지에서 레코드 목록 확인
- `*.dev`, `*`, 또는 와일드카드 관련 레코드가 있는지 확인

---

## 즉시 확인 방법

### Gabia 네임서버에서 직접 확인

```bash
dig @ns.gabia.co.kr mindgarden.dev.core-solution.co.kr
```

**결과 해석**:
- IP 주소가 반환되면 → 레코드가 설정되었고 전파 완료
- `NXDOMAIN`이 반환되면 → 레코드가 설정되지 않았거나 전파 중

### 여러 DNS 서버로 확인

```bash
# Google DNS
dig @8.8.8.8 mindgarden.dev.core-solution.co.kr

# Cloudflare DNS
dig @1.1.1.1 mindgarden.dev.core-solution.co.kr

# Gabia 네임서버
dig @ns.gabia.co.kr mindgarden.dev.core-solution.co.kr
```

**참고**: Gabia 네임서버에서 확인하면 전파 여부를 즉시 알 수 있습니다.

---

## 단계별 확인 체크리스트

- [ ] DNS 관리 페이지에서 레코드 목록 확인
- [ ] `*.dev` 또는 `*` 형식의 레코드가 있는지 확인
- [ ] 레코드 값이 `114.202.247.246`인지 확인
- [ ] "저장" 버튼을 눌렀는지 확인
- [ ] Gabia 네임서버에서 직접 확인 (`dig @ns.gabia.co.kr`)
- [ ] 전파 대기 (5분 ~ 1시간)
- [ ] 다시 확인

---

## 다음 단계

1. **DNS 관리 페이지 확인**: 레코드가 실제로 추가되었는지 확인
2. **Gabia 네임서버 확인**: `dig @ns.gabia.co.kr mindgarden.dev.core-solution.co.kr`
3. **전파 대기**: 레코드를 방금 추가했다면 5분 ~ 1시간 대기
4. **다시 테스트**: `curl -I https://mindgarden.dev.core-solution.co.kr/`

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025-12-12

