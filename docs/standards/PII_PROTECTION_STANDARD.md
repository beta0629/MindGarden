# PII 보호 표준

**버전**: 1.0.0  
**최종 업데이트**: 2026-06-14  
**상태**: 공식 표준 (P0 표준 5종 묶음)

## 1. 표준 개요

개인정보 보호법(PIPA) 및 사내 보안 정책에 따라 **PII (Personally Identifiable Information)** 는 DB 평문 저장을 금지한다. 모든 PII 컬럼은 **JPA `AttributeConverter` 를 통해 AES-256/CBC 자동 암복호화** 한다. 본 표준은 적용 의무·키 회전·평문 저장 회귀 차단·백필 절차를 정의한다.

## 2. PII 분류 · 적용 컬럼

| 분류 | 컬럼 (예) | 필수 적용 |
|---|---|---|
| **이름** | `user.name`, `client.name`, `consultant.name` | ✅ AttributeConverter 필수 |
| **전화번호** | `user.phone`, `client.phone` | ✅ AttributeConverter 필수 |
| **이메일** | `user.email`, `client.email` | ✅ AttributeConverter 필수 (로그인 lookup 시 hash 컬럼 추가) |
| **주소** | `client.address`, `consultant.address` | ✅ AttributeConverter 필수 |
| **계좌번호** | `salary_account`, `bank_account` | ✅ AttributeConverter 필수 |
| **신용카드** | `card_no` | ✅ AttributeConverter 필수 + last 4 만 별도 평문 컬럼 |
| **주민등록번호** | (사용 금지) | ❌ 저장 금지 — 생년월일·CI/DI 사용 |
| **휴면 PII** | dormant 테이블 전체 | ✅ `MINDGARDEN_DORMANT_PII_ENC_KEY` 별도 키 사용 |

PII 가 아닌 식별자 (`tenantId`, `userId` 등 surrogate PK·UUID) 는 적용 대상 외.

## 3. 구현 패턴 (`AttributeConverter`)

새 PII 컬럼 추가 시 다음 패턴을 따른다.

```java
package com.coresolution.consultation.converter;

import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * PII 이름 컬럼용 AttributeConverter.
 *
 * @author CoreSolution
 * @since 2026-06-14
 */
@Converter
public class PersonalNameConverter implements AttributeConverter<String, String> {

    @Autowired
    private PersonalDataEncryptionUtil encryptionUtil;

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return attribute == null ? null : encryptionUtil.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return dbData == null ? null : encryptionUtil.decrypt(dbData);
    }
}
```

엔티티에서 사용:

```java
@Convert(converter = PersonalNameConverter.class)
@Column(name = "name", length = 512)
private String name;
```

## 4. 키 관리

- **활성 키**: `PERSONAL_DATA_ENCRYPTION_KEY` + `PERSONAL_DATA_ENCRYPTION_IV` (`prod.env` SSOT, [`DB_ENV_SSOT_POLICY.md`](./DB_ENV_SSOT_POLICY.md)).
- **다중 키**: `PERSONAL_DATA_ENCRYPTION_KEYS=v2:...,v1:...` 형식. 신규 row 는 v2 로 암호화, 기존 row 는 v1 키로 복호화 호환.
- **휴면 PII 키**: `MINDGARDEN_DORMANT_PII_ENC_KEY` (활성 사용자 키와 분리 — 휴면 처리 시 키 변경).
- **회전 주기**: 연 1회 (KEY+IV 동시) — 자세한 절차 [`SECRET_ROTATION_POLICY.md`](./SECRET_ROTATION_POLICY.md) §2~§4.
- **로그 출력 금지**: 키·IV 평문을 어떤 로그/문서/티켓에도 출력 금지.

## 5. 검색 / 정렬 / 유니크 제약

암호화 컬럼은 LIKE 검색 / 정렬이 불가능하다. 다음 패턴으로 보완한다.

| 요구 | 구현 |
|---|---|
| email 로그인 lookup | `email_hash` (SHA-256 + salt) 별도 컬럼 + 유니크 인덱스, 검색은 hash 로 |
| 이름 prefix 검색 | 평문 첫 1~2글자 별도 평문 컬럼 (PII 약화 — 보안 리뷰 필수) 또는 전체 복호화 후 메모리 필터 (소규모 한정) |
| 전화번호 정렬 | 정렬 미지원 — UI 에서 다른 키로 정렬 |
| 통계 GROUP BY | 평문 PII GROUP BY 금지. tenant/role 등 비-PII 키로 GROUP BY |

## 6. 평문 저장 회귀 차단

- **CI 게이트**: 신규 PII 컬럼 추가 시 `@Convert` 누락 검사 스크립트 (`scripts/check-pii-converter.sh`, 별도 PR) 가 본 표준 §2 키워드 컬럼명 grep 후 `@Convert` 미적용 row 발견 시 fail.
- **PR 리뷰**: PII 키워드 (`name`, `phone`, `email`, `address`, `account`) 컬럼이 신규 추가되면 reviewer 가 본 문서 §2 확인 의무.
- **Flyway 검사**: PII 컬럼은 `length >= 512` (AES base64 인코딩 후 ~1.33x + IV) 강제. 짧으면 평문 저장 의심.
- **운영 SELECT 점검** (분기 1회, 운영 DBA): 평문 의심 row (예: `LENGTH(name) < 32 AND name REGEXP '[가-힣]'`) sample 검사.

## 7. 백필 절차 (평문 → 암호화)

레거시 평문 row 발견 시 다음 절차로 백필한다.

1. **영향 평가** (운영 DBA): 평문 row 추정 SQL 로 건수·테넌트 분포 파악.
2. **백필 PR 계획** (`core-planner` + `core-coder`):
   - Flyway 마이그레이션 + 1회용 백필 batch (`@Transactional` 분할 commit, tenant 별 격리).
   - 백필 시 다중 키 리스트에 `v0:plaintext` 가상 키 등록 → 읽기 시 평문도 허용 → 쓰기는 v2.
3. **운영 시간대 외 실행**: 23:00 ~ 06:00 KST 권장. 운영팀 합의 + `core-tester` 게이트.
4. **검증**: 백필 후 §6 평문 SELECT 결과 0건 + 복호화 sample 100건 정상.
5. **롤백**: 백필 중단 시 직전 DB 백업 복원. v0 가상 키는 백필 완료 후 즉시 제거.

## 8. 금지 사항

- PII 컬럼 평문 저장 (`@Convert` 누락).
- PII 평문을 로그·문서·티켓·채팅에 출력 — [`LOG_INJECTION_GUARD_POLICY.md`](./LOG_INJECTION_GUARD_POLICY.md) §4 마스킹 사용.
- 키 단독 변경 (KEY 만 또는 IV 만 회전) — 동시 회전 + 다중 키 등록 필수.
- 주민등록번호 신규 저장 — 사용 금지.
- API 응답 본문에 PII 평문 노출 — DTO 단계에서 마스킹 또는 권한 가드.

## 9. 참조

- `src/main/java/com/coresolution/consultation/util/PersonalDataEncryptionUtil.java`
- `src/main/java/com/coresolution/consultation/util/PersonalDataEncryptionKeyProvider.java`
- [`ENCRYPTION_STANDARD.md`](./ENCRYPTION_STANDARD.md) — AES-256/CBC 표준
- [`SECRET_ROTATION_POLICY.md`](./SECRET_ROTATION_POLICY.md) — 키 회전 절차
- [`DB_ENV_SSOT_POLICY.md`](./DB_ENV_SSOT_POLICY.md) — KEY/IV env SSOT
- [`SYSTEMD_FALLBACK_DB_ENV_POLICY.md`](./SYSTEMD_FALLBACK_DB_ENV_POLICY.md) — unit 평문 금지
- [`LOG_INJECTION_GUARD_POLICY.md`](./LOG_INJECTION_GUARD_POLICY.md) — 로그 sanitize
- [`SECURITY_STANDARD.md`](./SECURITY_STANDARD.md) §데이터 보호
