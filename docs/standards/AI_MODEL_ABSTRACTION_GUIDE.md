# AI 모델 추상화 가이드

**작성일**: 2025-12-02  
**버전**: 1.0.0  
**목적**: AI 모델 교체 및 확장 가능한 아키텍처 설계

---

## 📋 개요

MindGarden 시스템은 **AI 모델 추상화 레이어**를 통해 다양한 AI 모델(OpenAI, Claude, Gemini 등)을 쉽게 교체하고 확장할 수 있습니다.

### 핵심 설계 원칙

1. **프롬프트 재사용**: 공통 프롬프트를 사용하여 모델 변경 시에도 일관된 분석
2. **모델 독립성**: 특정 AI 모델에 종속되지 않는 인터페이스 설계
3. **쉬운 확장**: 새로운 AI 모델 추가 시 최소한의 코드 변경
4. **환경 설정**: 설정 파일만으로 모델 전환 가능

---

## 🏗️ 아키텍처

### 계층 구조

```
┌─────────────────────────────────────────────────────┐
│           Application Layer                         │
│   (AnomalyDetectionService, SecurityThreatService)  │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│         AI Analysis Service (Facade)                │
│   - 통합 인터페이스                                   │
│   - 로깅 및 비용 추적                                 │
└─────────────────────────────────────────────────────┘
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
┌──────────────┐        ┌──────────────┐
│ AI Prompt    │        │ AI Model     │
│ Service      │        │ Provider     │
│              │        │              │
│ - 공통 프롬프트│        │ - 모델 추상화 │
│ - 역할 정의   │        │ - API 호출    │
└──────────────┘        └──────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
            ┌──────────────┐    ┌──────────────┐
            │ OpenAI       │    │ Claude       │
            │ Provider     │    │ Provider     │
            └──────────────┘    └──────────────┘
                                (향후 지원)
```

---

## 🔌 인터페이스 설계

### AIModelProvider 인터페이스

```java
public interface AIModelProvider {
    String getModelName();
    String getModelType();
    AIResponse analyze(String systemPrompt, String userPrompt, 
                      int maxTokens, double temperature);
    boolean isAvailable();
}
```

**역할**:
- 다양한 AI 모델을 통일된 인터페이스로 제공
- 모델별 API 호출 세부사항 캡슐화

---

## 📝 프롬프트 관리

### AIPromptService

**공통 프롬프트 관리**:
```java
// 시스템 모니터링 전문가
public String getSystemMonitoringExpertPrompt() {
    return "당신은 시스템 모니터링 및 이상 탐지 전문가입니다...";
}

// 사이버 보안 전문가
public String getSecurityExpertPrompt() {
    return "당신은 사이버 보안 전문가입니다...";
}

// 마음 건강 전문가
public String getWellnessExpertPrompt() {
    return "당신은 마음 건강 전문가입니다...";
}
```

**프롬프트 생성**:
```java
// 이상 탐지 프롬프트
public String buildAnomalyDetectionPrompt(
    List<SystemMetric> metrics, 
    String metricType, 
    String metricDescription
) {
    // 공통 프롬프트 템플릿 사용
    // 모델 변경 시에도 동일한 프롬프트 사용
}

// 보안 위협 프롬프트
public String buildSecurityThreatPrompt(
    String eventType, 
    Map<String, Object> eventDetails
) {
    // 공통 프롬프트 템플릿 사용
}
```

---

## 🔄 모델 전환 방법

### 1. 설정 파일로 전환

**application.yml**:
```yaml
ai:
  model:
    provider: openai  # openai, claude, gemini 등
```

**환경 변수로 전환**:
```bash
export AI_MODEL_PROVIDER=openai  # 또는 claude, gemini
```

### 2. 새로운 모델 추가

**Step 1**: Provider 구현
```java
@Component
@ConditionalOnProperty(name = "ai.model.provider", havingValue = "claude")
public class ClaudeModelProvider implements AIModelProvider {
    
    @Override
    public String getModelName() {
        return "claude-3-opus-20240229";
    }
    
    @Override
    public String getModelType() {
        return "CLAUDE";
    }
    
    @Override
    public AIResponse analyze(String systemPrompt, String userPrompt, 
                             int maxTokens, double temperature) {
        // Claude API 호출 로직
        // 프롬프트는 동일하게 사용
    }
    
    @Override
    public boolean isAvailable() {
        // API 키 확인
    }
}
```

**Step 2**: 설정 추가
```yaml
claude:
  api:
    key: ${CLAUDE_API_KEY:}
    url: https://api.anthropic.com/v1/messages
  model: claude-3-opus-20240229
```

**Step 3**: 환경 변수 설정
```bash
export AI_MODEL_PROVIDER=claude
export CLAUDE_API_KEY="sk-ant-..."
```

---

## 🎯 사용 예시

### 기존 코드 (모델 의존적)

```java
// ❌ OpenAI에 종속
public void analyze() {
    String apiKey = openAIConfig.getApiKey();
    String url = "https://api.openai.com/v1/chat/completions";
    // OpenAI 특화 로직...
}
```

### 개선된 코드 (모델 독립적)

```java
// ✅ 모델 독립적
@Service
public class AnomalyDetectionService {
    private final AIAnalysisService aiAnalysisService;
    
    public void analyze() {
        // 모델에 관계없이 동일한 인터페이스 사용
        AnomalyAnalysisResult result = 
            aiAnalysisService.analyzeAnomaly(metrics, metricType);
    }
}
```

---

## 📊 지원 모델 비교

### 현재 지원

| 모델 | 상태 | Provider 값 | 특징 |
|-----|------|------------|------|
| OpenAI GPT-3.5 | ✅ 지원 | `openai` | 빠르고 저렴 |
| OpenAI GPT-4 | ✅ 지원 | `openai` | 높은 정확도 |

### 향후 지원 예정

| 모델 | 상태 | Provider 값 | 특징 |
|-----|------|------------|------|
| Claude 3 Opus | 🔄 준비 중 | `claude` | 긴 컨텍스트 |
| Google Gemini Pro | 🔄 준비 중 | `gemini` | 멀티모달 |
| Azure OpenAI | 🔄 준비 중 | `azure-openai` | 엔터프라이즈 |

---

## 💰 비용 비교

### 모델별 비용 (1000 토큰 기준)

| 모델 | Input | Output | 특징 |
|-----|-------|--------|------|
| GPT-3.5-Turbo | $0.0005 | $0.0015 | 가장 저렴 |
| GPT-4 | $0.03 | $0.06 | 높은 정확도 |
| Claude 3 Opus | $0.015 | $0.075 | 긴 컨텍스트 |
| Gemini Pro | 무료 | 무료 | 제한적 무료 |

### 월 예상 비용 (하이브리드 방식)

| 모델 | 월 호출 | 월 비용 |
|-----|--------|--------|
| GPT-3.5-Turbo | 200회 | $10-20 |
| GPT-4 | 200회 | $60-120 |
| Claude 3 Opus | 200회 | $30-60 |

---

## 🔧 설정 가이드

### OpenAI (현재)

```yaml
ai:
  model:
    provider: openai

openai:
  api:
    key: ${OPENAI_API_KEY}
    url: https://api.openai.com/v1/chat/completions
  model: gpt-3.5-turbo  # 또는 gpt-4
```

### Claude (향후)

```yaml
ai:
  model:
    provider: claude

claude:
  api:
    key: ${CLAUDE_API_KEY}
    url: https://api.anthropic.com/v1/messages
  model: claude-3-opus-20240229
```

### Gemini (향후)

```yaml
ai:
  model:
    provider: gemini

gemini:
  api:
    key: ${GEMINI_API_KEY}
    url: https://generativelanguage.googleapis.com/v1/models
  model: gemini-pro
```

---

## 🎓 모범 사례

### 1. 프롬프트 재사용

```java
// ✅ 좋은 예: 공통 프롬프트 사용
String systemPrompt = promptService.getSystemMonitoringExpertPrompt();
String userPrompt = promptService.buildAnomalyDetectionPrompt(...);

// ❌ 나쁜 예: 모델별 프롬프트
if (model == "openai") {
    prompt = "OpenAI specific prompt...";
} else if (model == "claude") {
    prompt = "Claude specific prompt...";
}
```

### 2. 모델 독립적 코드

```java
// ✅ 좋은 예: 인터페이스 사용
AIResponse response = modelProvider.analyze(systemPrompt, userPrompt, 500, 0.3);

// ❌ 나쁜 예: 특정 모델 API 직접 호출
OpenAIResponse response = openAIClient.complete(...);
```

### 3. 환경별 설정

```yaml
# 개발 환경: 저렴한 모델
spring:
  profiles: local
ai:
  model:
    provider: openai
openai:
  model: gpt-3.5-turbo

# 운영 환경: 정확한 모델
spring:
  profiles: production
ai:
  model:
    provider: openai
openai:
  model: gpt-4
```

---

## 📚 참고 자료

- [OpenAI API 문서](https://platform.openai.com/docs/api-reference)
- [Claude API 문서](https://docs.anthropic.com/claude/reference)
- [Gemini API 문서](https://ai.google.dev/docs)

---

**최종 업데이트**: 2025-12-02  
**작성자**: CoreSolution Team

