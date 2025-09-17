# MindGarden 상담 관리 시스템

## 🚀 프로젝트 개요

MindGarden은 상담사와 내담자를 위한 통합 상담 관리 시스템입니다. Spring Boot 백엔드와 React 프론트엔드로 구성되어 있으며, OAuth2 소셜 로그인을 지원합니다.

## ⚠️ 중요: 설정 파일 백업

**개발 환경 설정이 손실될 경우를 대비해 백업본을 제공합니다:**

### 로컬 개발 환경
- **원본**: `src/main/resources/application-local.yml`
- **백업본**: `src/main/resources/application-local.yml.backup`

### 운영 환경
- **원본**: `src/main/resources/application-prod.yml`
- **백업본**: `src/main/resources/application-prod.yml.backup`

**설정 파일 복원:**
```bash
# 로컬 환경 복원
cp src/main/resources/application-local.yml.backup src/main/resources/application-local.yml

# 운영 환경 복원
cp src/main/resources/application-prod.yml.backup src/main/resources/application-prod.yml
```

**자세한 환경 설정 가이드**: [환경별 설정 가이드](docs/ENVIRONMENT_SETUP.md)

## ✨ 주요 기능

### 🔐 인증 및 보안
- **OAuth2 소셜 로그인**: 카카오, 네이버 지원
- **세션 기반 인증**: Spring Security + HttpSession
- **개인정보 암호화**: AES 암호화로 사용자 데이터 보호
- **CORS 설정**: 프론트엔드-백엔드 간 안전한 통신

### 👥 사용자 관리
- **역할 기반 접근 제어**: CLIENT, CONSULTANT, ADMIN, SUPER_ADMIN
- **프로필 관리**: 사용자 정보 수정 및 관리
- **세션 관리**: 자동 세션 확인 및 관리
- **공통 리다이렉션 시스템**: 역할별 대시보드 경로 중앙 관리

### 💸 환불 관리 시스템 (NEW!)
- **안전한 내담자 삭제**: 회기 소진 또는 환불 처리 전까지 삭제 방지
- **회기 환불 처리**: 다중 매핑 선택적 환불 및 사유 기록
- **ERP 연동 환불**: 환불 처리 시 자동 ERP 데이터 전송
- **환불 통계 대시보드**: 실시간 환불 현황 및 사유별 분석
- **환불 이력 관리**: 페이징 지원 환불 이력 조회 및 ERP 상태 추적
- **회계 연동**: ERP 시스템과 완벽 연동으로 회계 처리 자동화

### 🔄 상담사 관리 시스템
- **안전한 삭제 시스템**: 연관 데이터 확인 후 이전 처리
- **상담사 이전 기능**: 매핑, 스케줄, 회기 정보 완전 이전
- **데이터 무결성**: 트랜잭션 기반 안전한 처리
- **실시간 업데이트**: 이전 후 관련 컴포넌트 자동 새로고침

### 📱 사용자 인터페이스
- **반응형 디자인**: 태블릿 최적화
- **컴포넌트 기반 구조**: 재사용 가능한 UI 컴포넌트
- **실시간 업데이트**: WebSocket 지원 (구현 예정)

### 🎨 UI/UX 개선
- **스케줄 등록 시스템**: 직관적인 시간 선택 그리드 및 드롭다운
- **한글 인코딩 지원**: UTF-8 완전 지원으로 한글 텍스트 정상 표시
- **인라인 스타일링**: CSS 충돌 방지 및 안정적인 UI 렌더링
- **색상 원 아이콘**: 이모지 대신 색상 원으로 상태 표시

### 🚀 성능 최적화
- **API 호출 최적화**: 일괄 처리 패턴으로 429 오류 해결
- **Rate Limiting**: 개발 환경용 임계값 조정
- **컴포넌트 최적화**: 불필요한 API 호출 제거 및 Props 기반 데이터 전달

### 🏖️ 휴가 관리 시스템
- **세밀한 휴가 유형**: 2시간 단위 반반차 휴가 지원
- **관리자 휴가 등록**: 관리자가 상담사 휴가 직접 등록
- **스마트 스케줄 제한**: 휴가 시간대 자동 제한
- **직관적 휴가 표시**: 이모지와 시간 범위로 명확한 표시

### 🏢 ERP 시스템
- **아이템 관리**: 구매 가능한 아이템 등록 및 재고 관리
- **구매 요청 시스템**: 상담사 구매 요청 및 승인 프로세스
- **구매 주문 관리**: 발주 및 배송 관리
- **예산 관리**: 부서별 예산 설정 및 추적
- **환불 관리**: 상담 환불 현황 및 ERP 연동 관리 (NEW!)
- **통합 회계 시스템**: 수입/지출, 대차대조표, 손익계산서
- **역할 기반 접근**: 어드민/수퍼어드민 권한별 기능 분리

### 💰 급여 관리 시스템 (NEW!)
- **상담사 등급별 기본급여 자동 계산**: 주니어(30,000원) ~ 마스터(45,000원)
- **프리랜서/정규직 급여 계산**: 상담 완료 건수 기반 자동 계산
- **세금 계산**: 사업자 등록 여부에 따른 차등 세금 적용
- **급여 프로필 관리**: 상담사별 급여 설정 및 관리
- **급여 출력**: PDF/Excel 급여 계산서 생성 및 이메일 전송
- **상담 유형별 옵션 금액**: 초기상담, 가족상담 등 자동 옵션 적용

## 🏗️ 기술 스택

### Backend
- **Spring Boot 3.2.0**: Java 17 기반
- **Spring Security**: 인증 및 권한 관리
- **Spring Data JPA**: 데이터베이스 접근
- **MySQL**: 데이터베이스
- **Redis**: 캐시 및 세션 관리
- **Maven**: 빌드 도구

### Frontend
- **React 19.1.1**: 사용자 인터페이스
- **React Router**: 클라이언트 사이드 라우팅
- **Bootstrap Icons**: 아이콘 라이브러리
- **CSS3**: 스타일링

## 🚀 개발 환경 설정

### 필수 요구사항
- Java 17+
- Node.js 18+
- MySQL 8.0+

### 백엔드 실행
```bash
# 프로젝트 루트에서
mvn spring-boot:run -Dspring.profiles.active=dev
```

### 프론트엔드 실행
```bash
# frontend 디렉토리에서
npm start
```

### 동시 실행 (추천)
```bash
# 프로젝트 루트에서
npm run dev
```

## 📁 프로젝트 구조

```
mindGarden/
├── src/main/java/com/mindgarden/consultation/
│   ├── config/           # Spring Security, CORS 설정
│   ├── controller/       # REST API 컨트롤러
│   ├── entity/          # JPA 엔티티
│   ├── service/         # 비즈니스 로직
│   └── util/            # 암호화, 세션 관리 유틸리티
├── frontend/src/
│   ├── components/      # React 컴포넌트
│   ├── hooks/          # 커스텀 React 훅
│   ├── utils/          # 유틸리티 함수
│   └── styles/         # CSS 스타일
└── docs/               # 프로젝트 문서
```

## 🔧 구현된 기능

### ✅ 완료된 기능
1. **OAuth2 소셜 로그인**
   - 카카오 로그인 구현
   - 네이버 로그인 구현
   - 공통 OAuth2 컨트롤러

2. **세션 관리**
   - Spring Boot 세션 기반 인증
   - React 프론트엔드 세션 관리
   - 자동 세션 확인 및 갱신
   - 중복 로그인 방지 시스템

3. **사용자 인터페이스**
   - 태블릿 최적화 대시보드
   - 반응형 헤더 및 네비게이션
   - 웰컴 섹션 및 기본 레이아웃
   - 공통 레이아웃 컴포넌트

4. **보안 기능**
   - 개인정보 암호화/복호화
   - CORS 설정
   - Spring Security 설정

5. **ERP 시스템**
   - 아이템 관리 (등록, 수정, 삭제, 재고 관리)
   - 구매 요청 시스템 (상담사 요청, 관리자 승인)
   - 구매 주문 관리 (발주, 배송 추적)
   - 예산 관리 (부서별 예산 설정)
   - 역할 기반 접근 제어

6. **캐시 시스템**
   - Redis 기반 비즈니스 캐시
   - 이중 캐시 구조 (Spring Cache + Redis 직접 접근)
   - 캐시별 TTL 설정 (사용자 60분, 스케줄 30분, 아이템 30분 등)
   - 자동 캐시 갱신 및 무효화
   - 패턴 기반 캐시 제거 기능

7. **중복 로그인 방지 시스템**
   - 세션 기반 중복 로그인 감지
   - 사용자 확인 모달을 통한 세션 종료 처리
   - 개발 환경에서 자동 비활성화
   - 운영 환경에서 사용자 친화적 확인 시스템

### 🚧 진행 중인 기능
1. **대시보드 기능**
   - 상담 데이터 표시
   - 통계 및 요약 정보
   - 최근 활동 내역

2. **프로필 관리**
   - 사용자 정보 수정
   - 프로필 이미지 업로드

### 📋 예정된 기능
1. **상담 관리**
   - 상담 일정 관리
   - 상담 기록 관리
   - 알림 시스템

2. **실시간 통신**
   - WebSocket 채팅
   - 실시간 알림

## 🌐 접속 정보

- **백엔드**: http://localhost:8080
- **프론트엔드**: http://localhost:3000
- **API 문서**: http://localhost:8080/api/auth/oauth2/config

## 📚 문서

프로젝트의 상세한 문서는 다음을 참조하세요:

- **[급여 관리 시스템](SALARY_MANAGEMENT_SYSTEM.md)** - 급여 계산 및 관리 시스템 가이드
- **[개발 가이드](DEVELOPMENT_GUIDE.md)** - 개발 환경 설정 및 코딩 표준
- **[환경 설정](ENVIRONMENT_SETUP.md)** - 로컬/운영 환경 설정 가이드
- **[API 설계](API_DESIGN.md)** - REST API 명세서
- **[시스템 설계](SYSTEM_DESIGN.md)** - 아키텍처 및 설계 문서
- **[운영 가이드](OPERATION_DEPLOYMENT_GUIDE.md)** - 배포 및 운영 가이드
- **[공통 리다이렉션 시스템](COMMON_REDIRECTION_SYSTEM.md)** - 역할별 대시보드 리다이렉션 시스템

## 📝 개발 가이드

### 코드 스타일
- **Java**: Google Java Style Guide 준수
- **JavaScript**: ESLint 규칙 준수
- **CSS**: BEM 방법론 사용

### 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 코드 추가
chore: 빌드 프로세스 변경
```

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👥 팀원

- **개발**: MindGarden Team
- **문서**: AI Assistant

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 등록해 주세요.

---

**마지막 업데이트**: 2025년 8월 28일
**버전**: 1.0.0
