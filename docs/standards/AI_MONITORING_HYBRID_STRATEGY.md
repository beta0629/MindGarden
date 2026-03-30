# AI 모니터링 하이브리드 전략

**작성일**: 2025-12-02  
**버전**: 1.0.0  
**작성자**: CoreSolution

---

## 📋 개요

AI 모니터링 시스템은 **하이브리드 방식**을 채택하여 **정확성**과 **비용 효율성**을 동시에 달성합니다.

### 핵심 전략

```
통계 기반 필터링 (1차) → AI 분석 (2차) → 비용 관리
     ↓                      ↓                ↓
   빠르고 저렴          정확하지만 비용     일일 제한, 쿨다운
```

---

## 🎯 하이브리드 방식의 장점

### 1. 비용 절감 (80-90%)
- **통계 기반**: 대부분의 정상 케이스 필터링 (무료)
- **AI 분석**: 의심스러운 케이스만 분석 (비용 발생)
- **예상 비용**: 월 $5-10 (전체 AI 사용 시 $50-100)

### 2. 정확도 향상
- **통계 기반**: 명확한 이상 케이스 즉시 탐지
- **AI 분석**: 애매한 케이스의 정확한 판단
- **오탐률 감소**: AI가 통계 기반 오탐을 필터링

### 3. 성능 최적화
- **빠른 응답**: 대부분 통계 기반으로 즉시 처리
- **부하 분산**: AI 호출 횟수 제한으로 시스템 안정성 확보

---

## 🔧 구현 상세

### 1단계: 통계 기반 필터링

```yaml
ai:
  monitoring:
    hybrid:
      statistical-threshold:
        cpu: 70.0      # CPU 70% 이상
        memory: 75.0   # 메모리 75% 이상
        jvm: 80.0      # JVM 80% 이상
```

**동작:**
- 임계값 미만: 정상 → 아무것도 안 함
- 임계값 이상: 의심 → 2단계로 진행

### 2단계: AI 분석 트리거 조건

```yaml
ai:
  monitoring:
    hybrid:
      ai-trigger:
        consecutive-violations: 3  # 연속 3회 위반
        severity-threshold: "MEDIUM"  # MEDIUM 이상
        cooldown-minutes: 30  # 30분 쿨다운
```

**AI 호출 조건 (모두 충족 시):**
1. ✅ 통계 임계값 초과
2. ✅ 연속 3회 이상 위반
3. ✅ 마지막 AI 호출 후 30분 경과
4. ✅ 일일 호출 제한 미도달

### 3단계: 비용 관리

```yaml
ai:
  monitoring:
    cost-control:
      daily-limit: 100  # 일일 최대 100회
      monthly-budget: 50.0  # 월 $50
      alert-threshold: 80  # 80% 도달 시 알림
```

---

## 📊 비용 분석

### 예상 비용 (GPT-3.5-Turbo 기준)

| 시나리오 | 월 호출 횟수 | 예상 비용 |
|---------|------------|---------|
| 정상 운영 (이상 없음) | 0-10회 | $0.10 |
| 경미한 이상 (가끔) | 50-100회 | $1-2 |
| 중간 이상 (자주) | 200-500회 | $5-10 |
| 심각한 이상 (계속) | 1000회+ | $20-30 |

**일일 제한 (100회) 적용 시 최대 비용: 월 $30**

### 비용 절감 효과

| 방식 | 월 호출 횟수 | 월 비용 | 절감율 |
|-----|------------|--------|-------|
| 전체 AI | 10,000회 | $100 | - |
| 하이브리드 | 500회 | $10 | **90%** |

---

## 🚀 사용 방법

### 1. AI 모니터링 활성화

```yaml
# application.yml
ai:
  monitoring:
    enabled: true  # AI 모니터링 활성화
```

### 2. OpenAI API 키 설정

```bash
# 환경 변수
export OPENAI_API_KEY="sk-..."
export OPENAI_MODEL="gpt-3.5-turbo"
```

### 3. 하이브리드 설정 조정 (선택)

```yaml
ai:
  monitoring:
    hybrid:
      statistical-threshold:
        cpu: 70.0  # 더 민감하게: 60.0
        memory: 75.0
        jvm: 80.0
      ai-trigger:
        consecutive-violations: 3  # 더 빠르게: 2
        cooldown-minutes: 30  # 더 자주: 15
```

---

## 📈 모니터링 및 알림

### 1. AI 호출 횟수 모니터링

```sql
-- 일일 AI 호출 횟수
SELECT 
    DATE(created_at) as date,
    COUNT(*) as ai_calls
FROM openai_usage_log
WHERE request_type IN ('anomaly_detection', 'security_threat_detection')
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 2. 비용 모니터링

```sql
-- 월별 예상 비용
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as month,
    SUM(estimated_cost) as total_cost,
    COUNT(*) as total_calls
FROM openai_usage_log
WHERE is_success = true
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month DESC;
```

### 3. 알림 설정

- **일일 제한 80% 도달**: 관리자에게 이메일 알림
- **월 예산 80% 도달**: 긴급 알림
- **AI 분석 실패**: 로그 기록 및 통계 기반으로 폴백

---

## 🔍 AI vs 통계 비교

### 통계 기반 (STATISTICAL)

**장점:**
- ⚡ 빠른 응답 (< 1ms)
- 💰 무료
- 🎯 명확한 케이스 정확

**단점:**
- 🤔 애매한 케이스 오탐 가능
- 📊 단순 임계값 비교만 가능
- 🔄 패턴 학습 불가

### AI 기반 (OPENAI_GPT)

**장점:**
- 🧠 복잡한 패턴 인식
- 📈 컨텍스트 기반 분석
- 💡 권장 조치 제공

**단점:**
- 💰 비용 발생 ($0.002/호출)
- ⏱️ 느린 응답 (1-3초)
- 🌐 외부 API 의존

---

## 📝 예제: 실제 동작 흐름

### 시나리오 1: 정상 상태

```
1. CPU: 50% → 통계 임계값(70%) 미만 → ✅ 정상
2. 아무 작업 안 함
```

### 시나리오 2: 경미한 이상

```
1. CPU: 75% → 통계 임계값(70%) 초과
2. 연속 위반: 1회 → AI 트리거 조건(3회) 미충족
3. 📊 통계 기반 로그 기록
4. 연속 위반 카운터 증가
```

### 시나리오 3: 지속적 이상 (AI 분석)

```
1. CPU: 75% → 통계 임계값(70%) 초과
2. 연속 위반: 3회 → AI 트리거 조건 충족
3. 쿨다운 확인: 30분 경과 ✅
4. 일일 제한 확인: 50/100 ✅
5. 🤖 AI 분석 실행
6. AI 결과: 이상 확인 + 원인 분석 + 권장 조치
7. 📝 상세 결과 저장
8. 연속 위반 카운터 리셋
9. 쿨다운 시작 (30분)
```

### 시나리오 4: AI가 정상으로 판단

```
1. CPU: 75% → 통계 임계값(70%) 초과
2. 연속 위반: 3회 → AI 분석 실행
3. 🤖 AI 분석: "일시적 부하, 정상 범위"
4. ✅ 이상 아님으로 판단
5. 연속 위반 카운터 리셋
6. 알림 없음
```

---

## 🎛️ 설정 가이드

### 보수적 설정 (비용 최소화)

```yaml
ai:
  monitoring:
    enabled: true
    hybrid:
      statistical-threshold:
        cpu: 80.0  # 높은 임계값
        memory: 85.0
        jvm: 90.0
      ai-trigger:
        consecutive-violations: 5  # 많은 위반 필요
        cooldown-minutes: 60  # 긴 쿨다운
    cost-control:
      daily-limit: 50  # 낮은 제한
```

### 공격적 설정 (정확도 최대화)

```yaml
ai:
  monitoring:
    enabled: true
    hybrid:
      statistical-threshold:
        cpu: 60.0  # 낮은 임계값
        memory: 65.0
        jvm: 70.0
      ai-trigger:
        consecutive-violations: 2  # 적은 위반으로 트리거
        cooldown-minutes: 15  # 짧은 쿨다운
    cost-control:
      daily-limit: 200  # 높은 제한
```

### 균형 설정 (권장)

```yaml
ai:
  monitoring:
    enabled: true
    hybrid:
      statistical-threshold:
        cpu: 70.0
        memory: 75.0
        jvm: 80.0
      ai-trigger:
        consecutive-violations: 3
        cooldown-minutes: 30
    cost-control:
      daily-limit: 100
```

---

## 🔐 보안 고려사항

1. **API 키 보호**: 환경 변수로 관리, 절대 코드에 하드코딩 금지
2. **데이터 전송**: 민감한 정보는 마스킹 후 전송
3. **로그 저장**: AI 분석 결과는 암호화하여 저장
4. **접근 제어**: AI 설정 변경은 관리자만 가능

---

## 📚 참고 자료

- [OpenAI API 문서](https://platform.openai.com/docs/api-reference)
- [GPT-3.5-Turbo 가격](https://openai.com/pricing)
- [AI 모니터링 테스트 플랜](../testing/AI_MONITORING_TEST_PLAN.md)

---

**최종 업데이트**: 2025-12-02  
**작성자**: CoreSolution Team

