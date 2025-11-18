# Week 5: 암호화 키 관리 정책

**작성일:** 2025-01-XX  
**목적:** PG 설정 정보 암호화를 위한 키 관리 정책 수립

## 1. 개요

본 문서는 MindGarden 플랫폼에서 PG(Payment Gateway) 설정 정보(API Key, Secret Key)를 암호화하기 위한 키 관리 정책을 정의합니다.

## 2. 암호화 알고리즘

### 2.1 알고리즘 선택
- **알고리즘:** AES-256-CBC
- **패딩:** PKCS5Padding
- **키 길이:** 256비트 (32바이트)
- **IV 길이:** 128비트 (16바이트)

### 2.2 구현 상태
✅ **구현 완료** (`PersonalDataEncryptionUtil`)
- AES-256-CBC 암호화/복호화 구현 완료
- 키 버전 관리 지원 (`{keyId}::{cipherText}` 형식)
- 다중 키 지원 및 키 로테이션 지원

## 3. 키 관리 정책

### 3.1 키 저장 방식

**환경변수 기반 저장 (권장)**
- 키는 절대 소스 코드에 하드코딩하지 않음
- 환경변수 또는 시크릿 관리 시스템 사용
- 프로덕션 환경에서는 AWS Secrets Manager, HashiCorp Vault 등 사용 권장

### 3.2 키 버전 관리

**다중 키 지원**
- 활성 키와 이전 키를 동시에 관리
- 암호화 시: 활성 키 사용
- 복호화 시: 키 버전에 따라 적절한 키 자동 선택

**환경변수 설정 예시:**
```bash
# 활성 키 ID
PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID=v2

# 키 목록 (keyId:Base64EncodedValue)
PERSONAL_DATA_ENCRYPTION_KEYS=v2:Q29vbFNlY3JldEtleTIzIT8=,v1:QmFja3VwS2V5MTIzIT8=

# IV 목록 (keyId:Base64EncodedValue)
PERSONAL_DATA_ENCRYPTION_IVS=v2:Q29vbElWMjMxMjM=,v1:QmFja3VwSXYxMjM=
```

### 3.3 키 생성 규칙

**키 생성 방법:**
1. **랜덤 키 생성 (권장)**
   ```bash
   # 32바이트 랜덤 키 생성 (Base64 인코딩)
   openssl rand -base64 32
   ```

2. **IV 생성**
   ```bash
   # 16바이트 랜덤 IV 생성 (Base64 인코딩)
   openssl rand -base64 16
   ```

**키 요구사항:**
- 키: 최소 32바이트 (256비트)
- IV: 정확히 16바이트 (128비트)
- Base64 인코딩 권장 (가독성 및 안전한 전송)

### 3.4 키 로테이션 정책

**로테이션 주기:**
- **정기 로테이션:** 분기별 (3개월)
- **긴급 로테이션:** 보안 이벤트 발생 시 즉시

**로테이션 절차:**
1. 새 키 생성 및 환경변수 추가
2. 활성 키 ID 변경 (`PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID`)
3. 애플리케이션 재시작
4. 기존 데이터 재암호화 (백그라운드 작업)
5. 이전 키 보관 (최소 1개월)
6. 안전 확인 후 이전 키 제거

**자동 재암호화:**
- `PersonalDataKeyRotationService`를 통해 자동 재암호화 지원
- 신규 암호화 시 자동으로 활성 키 사용
- 기존 데이터는 접근 시 자동 재암호화 (`ensureActiveKeyEncryption`)

## 4. 접근 제어

### 4.1 키 접근 권한

**개발 환경:**
- 개발자: 로컬 환경변수로 키 관리
- `.env.local` 파일 사용 (Git에 커밋 금지)

**프로덕션 환경:**
- 운영팀만 키 접근 권한
- 키 변경 시 승인 프로세스 필수
- 모든 키 변경 이력 기록

### 4.2 키 백업

**백업 정책:**
- 키는 안전한 위치에 암호화하여 백업
- 최소 2곳 이상의 별도 위치에 보관
- 백업 접근 권한은 최소 인원으로 제한

## 5. 보안 모범 사례

### 5.1 키 보호

1. **절대 하드코딩 금지**
2. **로그에 키 출력 금지**
3. **키는 암호화된 채널로만 전송**
4. **키 접근 로깅 및 모니터링**

### 5.2 키 교체 시 주의사항

1. **점진적 교체:** 모든 데이터 재암호화 완료 전까지 이전 키 유지
2. **롤백 계획:** 문제 발생 시 이전 키로 즉시 복구 가능
3. **테스트:** 스테이징 환경에서 먼저 검증

## 6. 현재 구현 상태

### 6.1 구현 완료 항목

✅ **PersonalDataEncryptionUtil**
- AES-256-CBC 암호화/복호화
- 키 버전 관리
- 자동 키 로테이션 지원

✅ **PersonalDataEncryptionKeyProvider**
- 다중 키 관리
- 환경변수 기반 키 로드
- 활성 키 관리

✅ **PersonalDataKeyRotationService**
- 사용자 데이터 자동 재암호화
- 활성 키로 자동 마이그레이션

### 6.2 PG 설정 암호화 통합

✅ **TenantPgConfigurationServiceImpl**
- API Key, Secret Key 암호화 적용
- 암호화 검증 로직 포함

## 7. 향후 개선 사항

### 7.1 Week 5 Day 3 작업 예정
- [ ] PG 설정 복호화 서비스 구현
- [ ] 키 로테이션 로직 강화
- [ ] 테넌트별 접근 제어 구현

### 7.2 장기 개선 계획
- [ ] AWS KMS 통합 (프로덕션)
- [ ] 키 자동 로테이션 스케줄러
- [ ] 키 사용 통계 및 모니터링

## 8. 참고 문서

- `docs/SECURITY_POLICY.md` - 전체 보안 정책
- `src/main/java/com/mindgarden/consultation/util/PersonalDataEncryptionUtil.java` - 암호화 유틸리티
- `src/main/java/com/mindgarden/consultation/util/PersonalDataEncryptionKeyProvider.java` - 키 제공자

