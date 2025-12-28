# 망막 안저 사진 분석 기능 개발 계획서

**작성일**: 2025-12-28  
**버전**: 1.0.0  
**상태**: 계획 수립  
**작성자**: CoreSolution Development Team

---

## 📋 개요

CoreSolution 플랫폼에 망막 안저 사진을 업로드하여 AI로 분석하고, ADHD 선별 결과를 보조 수단으로 제공하는 기능을 개발합니다.

### 목표

- 상담센터에서 망막 안저 이미지를 업로드하여 AI 분석
- ADHD 선별 결과를 상담사에게 제공 (보조 정보)
- 상담 계획 수립 및 치료 효과 추적에 활용

### 핵심 원칙

- **보조 수단**: 진단이 아닌 상담 보조 정보 제공
- **역할 분리**: 촬영은 의료기관, 분석은 CoreSolution
- **법적 준수**: 의료법 및 개인정보 보호법 준수

---

## 🏗️ 시스템 아키텍처

### 전체 구조

```
[의료기관] → 망막 안저 촬영 → 이미지 파일
                    ↓
[환자/상담센터] → CoreSolution 업로드
                    ↓
[CoreSolution] → 이미지 전처리 → AI 모델 분석 → 결과 리포트
                    ↓
[상담사] → 결과 확인 → 상담 계획 수립
```

### 컴포넌트 구조

```
┌─────────────────────────────────────────┐
│         Frontend (React)                │
│  - 이미지 업로드 UI                      │
│  - 분석 결과 리포트 UI                   │
│  - 상담사 대시보드 통합                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Backend API (Spring Boot)          │
│  - 이미지 업로드 API                     │
│  - 분석 요청 API                         │
│  - 결과 조회 API                         │
│  - 파일 저장소 관리                      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      AI Service (Python/FastAPI)        │
│  - 이미지 전처리                         │
│  - AI 모델 추론                          │
│  - 결과 후처리                           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Storage & Database                 │
│  - 이미지 파일 저장소 (S3/로컬)          │
│  - 분석 결과 DB (PostgreSQL)            │
│  - AI 모델 저장소                        │
└─────────────────────────────────────────┘
```

---

## 🛠️ 기술 스택

### Backend (CoreSolution 기존 스택 활용)

- **언어**: Java 17
- **프레임워크**: Spring Boot 3.x
- **이미지 처리**: 
  - ImageIO (기본 이미지 처리)
  - Apache Commons Imaging (이미지 검증)
- **파일 저장소**: 
  - AWS S3 (운영) 또는 로컬 파일 시스템 (개발)
  - Spring Content (파일 관리 추상화)
- **데이터베이스**: PostgreSQL (CoreSolution 기존)

### AI Service (새로운 마이크로서비스)

- **언어**: Python 3.10+
- **프레임워크**: FastAPI
- **AI/ML 라이브러리**:
  - TensorFlow / PyTorch (모델 추론)
  - OpenCV (이미지 전처리)
  - Pillow (이미지 처리)
  - NumPy, Pandas (데이터 처리)
- **모델 서빙**: 
  - TensorFlow Serving 또는 ONNX Runtime
  - 또는 FastAPI에서 직접 추론

### Frontend (CoreSolution 기존 스택 활용)

- **언어**: JavaScript / TypeScript
- **프레임워크**: React
- **이미지 업로드**: 
  - react-dropzone 또는 react-file-upload
  - 이미지 미리보기
  - 진행률 표시
- **차트/시각화**: 
  - Chart.js 또는 Recharts (결과 시각화)

### 인프라

- **컨테이너**: Docker
- **오케스트레이션**: Kubernetes (선택적)
- **메시징**: RabbitMQ (비동기 처리, 선택적)
- **모니터링**: Prometheus + Grafana

---

## 📊 데이터 모델

### 데이터베이스 스키마

#### 1. retina_analysis_request (분석 요청)

```sql
CREATE TABLE retina_analysis_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    consultant_id UUID REFERENCES users(id), -- 상담사 ID
    tenant_id VARCHAR(64) NOT NULL,
    
    -- 이미지 정보
    image_file_path VARCHAR(500) NOT NULL, -- 저장된 이미지 경로
    image_file_name VARCHAR(255) NOT NULL,
    image_file_size BIGINT, -- 바이트
    image_mime_type VARCHAR(50), -- image/jpeg, image/png 등
    image_width INTEGER,
    image_height INTEGER,
    
    -- 분석 상태
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    error_message TEXT,
    
    -- 분석 결과 (JSON)
    analysis_result JSONB, -- AI 분석 결과
    
    -- 메타데이터
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    analyzed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_consultant FOREIGN KEY (consultant_id) REFERENCES users(id)
);

CREATE INDEX idx_retina_analysis_user ON retina_analysis_request(user_id);
CREATE INDEX idx_retina_analysis_consultant ON retina_analysis_request(consultant_id);
CREATE INDEX idx_retina_analysis_tenant ON retina_analysis_request(tenant_id);
CREATE INDEX idx_retina_analysis_status ON retina_analysis_request(status);
```

#### 2. retina_analysis_result (분석 결과 상세)

```sql
CREATE TABLE retina_analysis_result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES retina_analysis_request(id),
    
    -- AI 분석 결과
    adhd_probability DECIMAL(5,2) NOT NULL, -- 0.00 ~ 100.00 (%)
    risk_level VARCHAR(20), -- LOW, MEDIUM, HIGH
    confidence_score DECIMAL(5,2), -- 모델 신뢰도
    
    -- 분석된 특징 (JSON)
    detected_features JSONB, -- 혈관 밀도, 동맥 폭 등
    
    -- 상세 분석 결과
    detailed_analysis JSONB, -- 각 특징별 상세 분석
    
    -- 메타데이터
    model_version VARCHAR(50), -- 사용된 AI 모델 버전
    analysis_duration_ms INTEGER, -- 분석 소요 시간 (밀리초)
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_request FOREIGN KEY (request_id) REFERENCES retina_analysis_request(id)
);

CREATE INDEX idx_retina_result_request ON retina_analysis_result(request_id);
```

---

## 🔄 개발 단계

### Phase 1: 기반 구축 (4주)

#### Week 1: 요구사항 분석 및 설계

**작업 항목**:
- [ ] 사용자 스토리 작성
- [ ] API 명세서 작성 (OpenAPI/Swagger)
- [ ] 데이터베이스 스키마 설계
- [ ] 파일 저장소 구조 설계
- [ ] AI 모델 인터페이스 설계

**산출물**:
- API 명세서 (`docs/api/retina-analysis-api.md`)
- 데이터베이스 ERD
- 시스템 아키텍처 다이어그램

#### Week 2: Backend 기반 구축

**작업 항목**:
- [ ] 데이터베이스 마이그레이션 작성
- [ ] Entity 클래스 생성
  - `RetinaAnalysisRequest`
  - `RetinaAnalysisResult`
- [ ] Repository 인터페이스 생성
- [ ] 파일 업로드 서비스 개발
  - 이미지 검증 (형식, 크기, 해상도)
  - 파일 저장 (S3 또는 로컬)
  - 파일 메타데이터 저장
- [ ] 기본 CRUD API 개발
  - `POST /api/v1/retina-analysis/upload` - 이미지 업로드
  - `GET /api/v1/retina-analysis/{id}` - 분석 요청 조회
  - `GET /api/v1/retina-analysis/{id}/result` - 분석 결과 조회
  - `GET /api/v1/retina-analysis` - 목록 조회

**기술 세부사항**:

```java
// Entity 예시
@Entity
@Table(name = "retina_analysis_request")
public class RetinaAnalysisRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID userId;
    
    @Column(nullable = false)
    private String tenantId;
    
    @Column(nullable = false)
    private String imageFilePath;
    
    @Enumerated(EnumType.STRING)
    private AnalysisStatus status;
    
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> analysisResult;
    
    // ... getters, setters
}

// Service 예시
@Service
public class RetinaAnalysisService {
    
    public RetinaAnalysisRequest uploadImage(
        MultipartFile file, 
        UUID userId, 
        String tenantId
    ) {
        // 1. 이미지 검증
        validateImage(file);
        
        // 2. 파일 저장
        String filePath = fileStorageService.save(file, tenantId);
        
        // 3. DB 저장
        RetinaAnalysisRequest request = new RetinaAnalysisRequest();
        request.setUserId(userId);
        request.setTenantId(tenantId);
        request.setImageFilePath(filePath);
        request.setStatus(AnalysisStatus.PENDING);
        
        return repository.save(request);
    }
    
    private void validateImage(MultipartFile file) {
        // 파일 형식 검증 (JPEG, PNG만 허용)
        // 파일 크기 검증 (최대 10MB)
        // 이미지 해상도 검증 (최소 해상도 확인)
    }
}
```

#### Week 3: AI Service 구축

**작업 항목**:
- [ ] FastAPI 프로젝트 초기 설정
- [ ] 이미지 전처리 모듈 개발
  - 이미지 리사이징
  - 노이즈 제거
  - 정규화
- [ ] AI 모델 로딩 및 추론 모듈 개발
- [ ] 분석 API 개발
  - `POST /analyze` - 이미지 분석 요청
  - `GET /health` - 서비스 상태 확인
- [ ] Docker 컨테이너화

**기술 세부사항**:

```python
# FastAPI 예시
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import tensorflow as tf

app = FastAPI()

# AI 모델 로딩 (서비스 시작 시)
model = tf.keras.models.load_model('adhd_model.h5')

@app.post("/analyze")
async def analyze_retina(image: UploadFile = File(...)):
    # 1. 이미지 읽기
    image_bytes = await image.read()
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # 2. 전처리
    processed_img = preprocess_image(img)
    
    # 3. AI 모델 추론
    prediction = model.predict(processed_img)
    
    # 4. 결과 후처리
    result = postprocess_prediction(prediction)
    
    return JSONResponse(content=result)

def preprocess_image(img):
    # 리사이징 (모델 입력 크기에 맞춤)
    img = cv2.resize(img, (224, 224))
    
    # 정규화
    img = img.astype(np.float32) / 255.0
    
    # 배치 차원 추가
    img = np.expand_dims(img, axis=0)
    
    return img

def postprocess_prediction(prediction):
    adhd_probability = float(prediction[0][0] * 100)
    
    if adhd_probability >= 70:
        risk_level = "HIGH"
    elif adhd_probability >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
    
    return {
        "adhd_probability": round(adhd_probability, 2),
        "risk_level": risk_level,
        "confidence_score": 0.95,  # 모델 신뢰도
        "detected_features": {
            "vessel_density": 0.65,
            "artery_width": 0.45,
            # ... 기타 특징
        }
    }
```

#### Week 4: Backend-AI Service 통합

**작업 항목**:
- [ ] AI Service 클라이언트 개발 (Java)
  - HTTP 클라이언트 (RestTemplate 또는 WebClient)
  - 재시도 로직
  - 타임아웃 처리
- [ ] 비동기 분석 처리
  - 분석 요청 큐잉 (선택적: RabbitMQ)
  - 또는 동기 처리 (간단한 구현)
- [ ] 분석 결과 저장
- [ ] 에러 처리 및 로깅

**기술 세부사항**:

```java
// AI Service 클라이언트
@Service
public class RetinaAnalysisAIService {
    
    private final WebClient webClient;
    private final String aiServiceUrl;
    
    public AnalysisResult analyzeImage(String imageFilePath) {
        try {
            // 1. 이미지 파일 읽기
            byte[] imageBytes = Files.readAllBytes(Paths.get(imageFilePath));
            
            // 2. AI Service 호출
            AnalysisResponse response = webClient.post()
                .uri(aiServiceUrl + "/analyze")
                .bodyValue(imageBytes)
                .retrieve()
                .bodyToMono(AnalysisResponse.class)
                .timeout(Duration.ofSeconds(30))
                .retry(3)
                .block();
            
            // 3. 결과 변환
            return convertToAnalysisResult(response);
            
        } catch (Exception e) {
            log.error("AI 분석 실패: {}", e.getMessage(), e);
            throw new AnalysisException("AI 분석 중 오류 발생", e);
        }
    }
}

// 분석 서비스 통합
@Service
public class RetinaAnalysisService {
    
    private final RetinaAnalysisAIService aiService;
    
    @Async
    public void processAnalysis(UUID requestId) {
        RetinaAnalysisRequest request = repository.findById(requestId)
            .orElseThrow();
        
        try {
            // 상태 변경: PROCESSING
            request.setStatus(AnalysisStatus.PROCESSING);
            repository.save(request);
            
            // AI 분석 수행
            AnalysisResult result = aiService.analyzeImage(
                request.getImageFilePath()
            );
            
            // 결과 저장
            saveAnalysisResult(requestId, result);
            
            // 상태 변경: COMPLETED
            request.setStatus(AnalysisStatus.COMPLETED);
            request.setAnalysisResult(result.toMap());
            request.setAnalyzedAt(LocalDateTime.now());
            repository.save(request);
            
        } catch (Exception e) {
            // 상태 변경: FAILED
            request.setStatus(AnalysisStatus.FAILED);
            request.setErrorMessage(e.getMessage());
            repository.save(request);
        }
    }
}
```

---

### Phase 2: Frontend 개발 (3주)

#### Week 5: 이미지 업로드 UI

**작업 항목**:
- [ ] 이미지 업로드 컴포넌트 개발
  - 드래그 앤 드롭
  - 파일 선택
  - 이미지 미리보기
  - 진행률 표시
- [ ] 이미지 검증 (클라이언트 측)
  - 파일 형식 검증
  - 파일 크기 검증
  - 이미지 미리보기
- [ ] API 연동
  - 업로드 API 호출
  - 에러 처리
  - 성공/실패 알림

**기술 세부사항**:

```jsx
// React 컴포넌트 예시
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

function RetinaImageUpload({ onUploadSuccess }) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    
    const onDrop = async (acceptedFiles) => {
        const file = acceptedFiles[0];
        
        // 클라이언트 측 검증
        if (!validateImage(file)) {
            alert('이미지 형식이 올바르지 않습니다.');
            return;
        }
        
        setUploading(true);
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/api/v1/retina-analysis/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setProgress(percentCompleted);
                }
            });
            
            const result = await response.json();
            onUploadSuccess(result);
            
        } catch (error) {
            alert('업로드 실패: ' + error.message);
        } finally {
            setUploading(false);
        }
    };
    
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: false
    });
    
    return (
        <div {...getRootProps()} className="upload-zone">
            <input {...getInputProps()} />
            {uploading ? (
                <div>
                    <p>업로드 중... {progress}%</p>
                    <progress value={progress} max={100} />
                </div>
            ) : (
                <div>
                    {isDragActive ? (
                        <p>이미지를 여기에 놓으세요</p>
                    ) : (
                        <p>이미지를 드래그하거나 클릭하여 선택하세요</p>
                    )}
                </div>
            )}
        </div>
    );
}
```

#### Week 6: 분석 결과 리포트 UI

**작업 항목**:
- [ ] 분석 결과 표시 컴포넌트
  - ADHD 위험도 점수 (시각화)
  - 위험 수준 표시
  - 검출된 특징 표시
  - 상세 분석 결과
- [ ] 차트/그래프 시각화
  - 위험도 게이지
  - 특징별 점수 바 차트
- [ ] 상담사 대시보드 통합
  - 환자별 분석 이력
  - 비교 분석 (시간에 따른 변화)

**기술 세부사항**:

```jsx
// 분석 결과 리포트 컴포넌트
function RetinaAnalysisResult({ analysisId }) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchAnalysisResult(analysisId)
            .then(data => setResult(data))
            .finally(() => setLoading(false));
    }, [analysisId]);
    
    if (loading) return <div>로딩 중...</div>;
    if (!result) return <div>결과를 찾을 수 없습니다.</div>;
    
    return (
        <div className="analysis-result">
            <h2>망막 안저 분석 결과</h2>
            
            {/* 위험도 점수 */}
            <div className="risk-score">
                <h3>ADHD 위험도</h3>
                <CircularProgressbar
                    value={result.adhdProbability}
                    text={`${result.adhdProbability}%`}
                />
                <p className={`risk-level risk-${result.riskLevel.toLowerCase()}`}>
                    {result.riskLevel === 'HIGH' ? '높음' : 
                     result.riskLevel === 'MEDIUM' ? '보통' : '낮음'}
                </p>
            </div>
            
            {/* 검출된 특징 */}
            <div className="detected-features">
                <h3>검출된 특징</h3>
                <ul>
                    <li>혈관 밀도: {result.detectedFeatures.vesselDensity}</li>
                    <li>동맥 폭: {result.detectedFeatures.arteryWidth}</li>
                    {/* ... 기타 특징 */}
                </ul>
            </div>
            
            {/* 상세 분석 */}
            <div className="detailed-analysis">
                <h3>상세 분석</h3>
                <pre>{JSON.stringify(result.detailedAnalysis, null, 2)}</pre>
            </div>
            
            {/* 주의사항 */}
            <div className="disclaimer">
                <p>⚠️ 이 결과는 보조 정보이며, 진단이 아닙니다. 
                최종 진단은 의료진이 내립니다.</p>
            </div>
        </div>
    );
}
```

#### Week 7: 통합 및 테스트

**작업 항목**:
- [ ] 상담사 대시보드 통합
- [ ] 환자 프로필 연동
- [ ] 분석 이력 관리
- [ ] E2E 테스트
- [ ] UI/UX 개선

---

### Phase 3: AI 모델 개발 (8-12주)

#### Week 8-12: 데이터 수집 및 라벨링

**작업 항목**:
- [ ] 데이터셋 수집
  - 공개 데이터셋 활용
  - 의료기관 협력 (데이터 제공)
  - 데이터 구매 (선택적)
- [ ] 데이터 라벨링
  - ADHD/정상 분류
  - 전문가 검증
- [ ] 데이터 전처리
  - 이미지 정규화
  - 증강 (Augmentation)
  - 데이터셋 분할 (Train/Validation/Test)

#### Week 13-16: 모델 학습

**작업 항목**:
- [ ] 베이스 모델 선택
  - ResNet, EfficientNet 등 전이 학습
  - 의료 이미지 사전 학습 모델 활용
- [ ] 모델 학습
  - 하이퍼파라미터 튜닝
  - 교차 검증
- [ ] 모델 평가
  - 정확도, 정밀도, 재현율
  - ROC 곡선, AUC
- [ ] 모델 최적화
  - 양자화 (Quantization)
  - 모델 압축

#### Week 17-19: 모델 배포 및 검증

**작업 항목**:
- [ ] 모델 서빙 환경 구축
- [ ] 성능 테스트
- [ ] 임상 검증 (의료진 협력)
- [ ] 모델 버전 관리

---

### Phase 4: 통합 테스트 및 배포 (2주)

#### Week 20: 통합 테스트

**작업 항목**:
- [ ] 전체 시스템 통합 테스트
- [ ] 성능 테스트
- [ ] 보안 테스트
- [ ] 사용자 수용 테스트 (UAT)

#### Week 21: 배포 및 모니터링

**작업 항목**:
- [ ] 프로덕션 배포
- [ ] 모니터링 설정
- [ ] 로깅 설정
- [ ] 알림 설정

---

## 🔒 보안 및 개인정보 보호

### 이미지 파일 보안

- **암호화 저장**: 이미지 파일 암호화 저장
- **접근 제어**: 역할 기반 접근 제어 (RBAC)
  - 환자: 본인 이미지만 조회
  - 상담사: 담당 환자 이미지만 조회
  - 관리자: 전체 조회 (필요 시)
- **전송 암호화**: HTTPS 필수
- **보관 기간**: 법적 요구사항 준수 (일반적으로 3-5년)

### 개인정보 보호

- **동의**: 사용자 명시적 동의 후 수집
- **익명화**: 분석 시 개인 식별 정보 제거 (선택적)
- **데이터 최소화**: 필요한 데이터만 수집
- **접근 로그**: 모든 접근 기록 보관

### 법적 고려사항

- **의료법 준수**: 진단이 아닌 보조 정보임을 명시
- **의료기기법**: 분석 소프트웨어로 분류 (의료기기 인증 불필요, 단 법적 검토 필요)
- **개인정보 보호법**: 의료 정보 특별 보호

---

## 📈 성능 요구사항

### 응답 시간

- **이미지 업로드**: 5초 이내
- **AI 분석**: 30초 이내 (이미지당)
- **결과 조회**: 1초 이내

### 처리량

- **동시 업로드**: 100건/분
- **동시 분석**: 10건/분 (AI 서비스 리소스에 따라 조정)

### 저장소

- **이미지 파일**: 평균 2MB/건
- **예상 저장량**: 1,000건/월 = 2GB/월

---

## 🧪 테스트 계획

### 단위 테스트

- 이미지 검증 로직
- 파일 저장 로직
- AI Service 클라이언트
- 데이터 변환 로직

### 통합 테스트

- 업로드 → 분석 → 결과 저장 플로우
- 에러 처리
- 재시도 로직

### 성능 테스트

- 동시 업로드 부하 테스트
- AI 분석 응답 시간 테스트
- 대용량 파일 처리 테스트

### 보안 테스트

- 인증/인가 테스트
- 파일 업로드 보안 테스트
- SQL 인젝션 테스트

---

## 📝 API 명세서

### 1. 이미지 업로드

```
POST /api/v1/retina-analysis/upload

Request:
- Content-Type: multipart/form-data
- Body: file (image/jpeg, image/png, max 10MB)

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "uploadedAt": "2025-12-28T10:00:00Z"
  }
}
```

### 2. 분석 결과 조회

```
GET /api/v1/retina-analysis/{id}/result

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "adhdProbability": 65.5,
    "riskLevel": "MEDIUM",
    "confidenceScore": 0.92,
    "detectedFeatures": {
      "vesselDensity": 0.65,
      "arteryWidth": 0.45
    },
    "detailedAnalysis": {...},
    "analyzedAt": "2025-12-28T10:00:30Z"
  }
}
```

### 3. 분석 이력 조회

```
GET /api/v1/retina-analysis?userId={userId}&page=0&size=20

Response:
{
  "success": true,
  "data": {
    "content": [...],
    "totalElements": 10,
    "totalPages": 1
  }
}
```

---

## 🚀 배포 계획

### 개발 환경

- 로컬 개발 서버
- 개발 데이터베이스
- 로컬 파일 저장소

### 스테이징 환경

- 스테이징 서버
- 스테이징 데이터베이스
- S3 스테이징 버킷

### 프로덕션 환경

- 프로덕션 서버 (고가용성)
- 프로덕션 데이터베이스 (백업 설정)
- S3 프로덕션 버킷 (버전 관리)

---

## 📊 모니터링 및 로깅

### 모니터링 지표

- 업로드 성공/실패율
- AI 분석 성공/실패율
- 평균 분석 시간
- 저장소 사용량
- API 응답 시간

### 로깅

- 모든 업로드/분석 요청 로그
- 에러 로그 (상세 스택 트레이스)
- 성능 로그 (응답 시간)

---

## 🔄 유지보수 계획

### 정기 작업

- **주간**: 로그 검토, 에러 모니터링
- **월간**: 성능 분석, 저장소 정리
- **분기**: 모델 재학습 (필요 시)

### 모델 업데이트

- 새로운 데이터로 모델 재학습
- A/B 테스트로 모델 성능 비교
- 점진적 배포

---

## 💰 예상 비용

### 개발 비용

- **인력**: 개발자 2명, AI 엔지니어 1명 (5개월)
- **인프라**: 개발/스테이징/프로덕션 서버

### 운영 비용 (월)

- **서버**: AI 서비스 GPU 인스턴스 (필요 시)
- **저장소**: S3 스토리지 비용
- **데이터베이스**: 추가 저장 공간

---

## ✅ 체크리스트

### 개발 전

- [ ] 요구사항 명확화
- [ ] 법적 검토 (의료법, 개인정보 보호법)
- [ ] 의료진 자문 (선택적)
- [ ] 기술 스택 최종 결정

### 개발 중

- [ ] 주간 진행 상황 리뷰
- [ ] 코드 리뷰
- [ ] 테스트 커버리지 확인

### 배포 전

- [ ] 보안 검토
- [ ] 성능 테스트 완료
- [ ] 사용자 수용 테스트 완료
- [ ] 문서화 완료

---

**문서 버전**: 1.0.0  
**최종 수정일**: 2025-12-28  
**다음 리뷰 예정일**: 개발 착수 전

