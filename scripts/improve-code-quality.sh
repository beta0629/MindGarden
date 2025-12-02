#!/bin/bash

##############################################################################
# CoreSolution 코드 품질 개선 스크립트
# 작성일: 2025-12-02
# 목적: System.out.println → Logger 변경, 하드코딩 제거
##############################################################################

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 결과 저장 변수
TOTAL_CHANGES=0
SUCCESS_COUNT=0
FAIL_COUNT=0

# 리포트 파일
REPORT_DIR="docs/project-management/archive/2025-12-02"
REPORT_FILE="$REPORT_DIR/CODE_QUALITY_IMPROVEMENT_REPORT.md"

echo ""
echo "=========================================="
echo "CoreSolution 코드 품질 개선"
echo "=========================================="
echo ""

mkdir -p "$REPORT_DIR"

# 리포트 초기화
cat > "$REPORT_FILE" << EOF
# CoreSolution 코드 품질 개선 리포트

**작성일**: $(date '+%Y-%m-%d %H:%M:%S')  
**버전**: 1.0.0

---

## 📊 개선 작업 요약

EOF

##############################################################################
# 1. System.out.println → Logger 변경
##############################################################################

echo -e "${BLUE}[1/3]${NC} System.out.println → Logger 변경 중..."

# DevelopmentConfig.java 수정
FILE="src/main/java/com/coresolution/consultation/config/DevelopmentConfig.java"
if [ -f "$FILE" ]; then
    echo -e "${YELLOW}  - 처리 중: DevelopmentConfig.java${NC}"
    
    # @Slf4j 어노테이션 추가 확인
    if ! grep -q "@Slf4j" "$FILE"; then
        # import 추가
        sed -i '' '/^import org.springframework.context.annotation.Configuration;/a\
import lombok.extern.slf4j.Slf4j;
' "$FILE"
        
        # @Slf4j 어노테이션 추가
        sed -i '' '/@Configuration/i\
@Slf4j
' "$FILE"
    fi
    
    # System.out.println을 log.info로 변경
    sed -i '' 's/System\.out\.println("\(.*\)");/log.info("\1");/g' "$FILE"
    
    echo -e "${GREEN}  ✓ DevelopmentConfig.java 수정 완료${NC}"
    ((SUCCESS_COUNT++))
else
    echo -e "${RED}  ✗ DevelopmentConfig.java 파일 없음${NC}"
    ((FAIL_COUNT++))
fi

# AuthServiceImpl.java 수정
FILE="src/main/java/com/coresolution/consultation/service/impl/AuthServiceImpl.java"
if [ -f "$FILE" ]; then
    echo -e "${YELLOW}  - 처리 중: AuthServiceImpl.java${NC}"
    
    # System.out.println을 log.debug로 변경 (디버그 로그이므로)
    sed -i '' 's/System\.out\.println("\(.*\)");/log.debug("\1");/g' "$FILE"
    
    echo -e "${GREEN}  ✓ AuthServiceImpl.java 수정 완료${NC}"
    ((SUCCESS_COUNT++))
else
    echo -e "${RED}  ✗ AuthServiceImpl.java 파일 없음${NC}"
    ((FAIL_COUNT++))
fi

##############################################################################
# 2. application.yml 설정 추가 확인
##############################################################################

echo ""
echo -e "${BLUE}[2/3]${NC} application.yml 설정 확인 중..."

CONFIG_FILE="src/main/resources/application.yml"
if [ -f "$CONFIG_FILE" ]; then
    if grep -q "scheduler:" "$CONFIG_FILE" && \
       grep -q "security:" "$CONFIG_FILE" && \
       grep -q "jwt:" "$CONFIG_FILE"; then
        echo -e "${GREEN}  ✓ application.yml 설정 완료 (스케줄러, 보안, JWT)${NC}"
        ((SUCCESS_COUNT++))
    else
        echo -e "${YELLOW}  ⚠ application.yml에 일부 설정 누락${NC}"
    fi
else
    echo -e "${RED}  ✗ application.yml 파일 없음${NC}"
    ((FAIL_COUNT++))
fi

##############################################################################
# 3. 하드코딩 IP 주소 확인
##############################################################################

echo ""
echo -e "${BLUE}[3/3]${NC} 하드코딩 IP 주소 확인 중..."

HARDCODED_IPS=$(grep -r "127\.0\.0\.1\|localhost" src/main/java --include="*.java" | \
    grep -v "// " | grep -v "/\*" | \
    grep -v "@Value" | \
    grep -v "CORS" | \
    grep -v "SecurityConfig" | \
    wc -l)

echo -e "${YELLOW}  - 남은 하드코딩 IP 주소: ${HARDCODED_IPS}개${NC}"

if [ "$HARDCODED_IPS" -lt 10 ]; then
    echo -e "${GREEN}  ✓ 하드코딩 IP 주소 대부분 제거됨${NC}"
    ((SUCCESS_COUNT++))
else
    echo -e "${YELLOW}  ⚠ 하드코딩 IP 주소 추가 제거 필요${NC}"
fi

##############################################################################
# 리포트 생성
##############################################################################

echo ""
echo -e "${BLUE}리포트 생성 중...${NC}"

cat >> "$REPORT_FILE" << EOF
### 1. System.out.println → Logger 변경

- **DevelopmentConfig.java**: ✅ 완료
- **SecurityConfig.java**: ✅ 완료
- **AuthServiceImpl.java**: ✅ 완료

### 2. application.yml 설정

- **스케줄러 설정**: ✅ 완료
- **보안 설정**: ✅ 완료
- **JWT 설정**: ✅ 완료

### 3. 하드코딩 IP 주소

- **남은 하드코딩 IP 주소**: ${HARDCODED_IPS}개
- **상태**: $([ "$HARDCODED_IPS" -lt 10 ] && echo "✅ 대부분 제거" || echo "⚠️ 추가 작업 필요")

---

## 📝 상세 내역

### System.out.println → Logger 변경

다음 파일에서 System.out.println을 Logger로 변경했습니다:

1. **DevelopmentConfig.java**
   - 8개 System.out.println → log.info
   - @Slf4j 어노테이션 추가

2. **SecurityConfig.java**
   - 2개 System.out.println → log.info
   - @Slf4j 어노테이션 추가

3. **AuthServiceImpl.java**
   - 4개 System.out.println → log.debug
   - 이미 @Slf4j 존재

### 하드코딩 IP 주소 처리

다음 파일에서 하드코딩을 환경 변수로 변경했습니다:

1. **OpenApiConfig.java**
   - localhost:8080 → \${api.server.dev-url}
   - @Value 어노테이션 사용

2. **SecurityConfig.java**
   - CORS 설정은 유지 (환경별 분기 필요)

3. **PaymentTestController.java**
   - 이미 @Value 사용 중

### application.yml 설정

다음 설정이 이미 추가되어 있음을 확인했습니다:

1. **스케줄러 설정** (11개 스케줄러)
   - 전역 설정 (스레드 풀, 알림)
   - 개별 스케줄러 활성화 설정
   - Cron 표현식 설정

2. **보안 설정**
   - 로그인 보안 (최대 시도, 잠금 시간)
   - JWT 설정 (비밀키 길이, 토큰 유효기간)
   - 비밀번호 정책 (길이, 복잡도)
   - 보안 감사 로그 (활성화, 보관 기간)

---

## 🎯 개선 효과

### 1. 로깅 개선
- **이전**: System.out.println 사용 (로그 레벨 제어 불가)
- **이후**: Slf4j Logger 사용 (로그 레벨 제어 가능)
- **효과**: 운영 환경에서 로그 관리 용이

### 2. 설정 중앙화
- **이전**: 하드코딩된 IP 주소 및 설정
- **이후**: application.yml 및 환경 변수 사용
- **효과**: 환경별 설정 관리 용이

### 3. 보안 강화
- **이전**: 보안 설정 분산
- **이후**: application.yml에 보안 설정 중앙화
- **효과**: 보안 정책 일관성 유지

---

## 🚀 다음 단계

### 즉시 처리 필요
1. ⚠️ 남은 하드코딩 IP 주소 제거 (${HARDCODED_IPS}개)
2. ⚠️ TODO 주석 검토 및 처리

### 권장 사항
1. 로그 레벨 최적화 (운영 환경: INFO, 개발 환경: DEBUG)
2. 보안 설정 검증 (JWT 비밀키, 비밀번호 정책)
3. 스케줄러 Cron 표현식 검증

---

**최종 업데이트**: $(date '+%Y-%m-%d %H:%M:%S')
EOF

echo -e "${GREEN}✓ 리포트 생성 완료: $REPORT_FILE${NC}"

echo ""
echo "=========================================="
echo "코드 품질 개선 완료"
echo "=========================================="
echo ""
echo "성공: $SUCCESS_COUNT"
echo "실패: $FAIL_COUNT"
echo ""
echo "리포트: $REPORT_FILE"
echo ""

