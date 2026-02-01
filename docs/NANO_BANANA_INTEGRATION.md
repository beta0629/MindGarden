# 나노 바나나(Nano Banana) 이미지 생성 통합 가이드

## 필요한 정보

나노 바나나 API를 통합하려면 다음 정보가 필요합니다:

1. **API 엔드포인트**
   - 이미지 생성 API URL
   - 예: `https://api.nanobanana.com/v1/images/generate`

2. **인증 방법**
   - API 키 형식
   - 헤더에 포함되는지, 쿼리 파라미터인지
   - 예: `Authorization: Bearer YOUR_API_KEY`

3. **요청 형식**
   - POST/GET 메서드
   - 요청 본문 구조
   - 프롬프트 전달 방법
   - 이미지 크기/비율 설정 방법

4. **응답 형식**
   - 이미지 URL 반환 방식
   - Base64 인코딩인지, URL인지
   - 에러 처리 방법

## 통합 계획

### 1. API 라우트 생성
- `app/api/ai/generate-image/route.ts` 생성
- 나노 바나나 API 호출
- 프롬프트를 받아서 이미지 생성
- 생성된 이미지 URL 반환

### 2. 배너 관리 페이지 수정
- "AI로 이미지 생성" 버튼 추가
- 프롬프트 입력 필드 추가
- 생성 중 로딩 표시
- 생성된 이미지 자동 적용

### 3. 환경 변수 설정
- `.env` 파일에 API 키 추가
- `NANO_BANANA_API_KEY=your_api_key`

## 예상 구조

### API 라우트 예시
```typescript
// app/api/ai/generate-image/route.ts
export async function POST(request: NextRequest) {
  const { prompt, width = 1920, height = 400 } = await request.json();
  
  // 나노 바나나 API 호출
  const response = await fetch('https://api.nanobanana.com/v1/images/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NANO_BANANA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      width,
      height,
    }),
  });
  
  const data = await response.json();
  return NextResponse.json({ imageUrl: data.imageUrl });
}
```

### 배너 페이지 컴포넌트 예시
```typescript
// AI 이미지 생성 버튼 추가
<button onClick={handleGenerateImage}>
  AI로 배너 이미지 생성
</button>

// 프롬프트 입력
<input 
  value={prompt}
  onChange={(e) => setPrompt(e.target.value)}
  placeholder="배너 이미지 프롬프트 입력..."
/>

// 생성 중 표시
{generating && <div>이미지 생성 중...</div>}
```

## 다음 단계

나노 바나나 API 정보를 제공해주시면:
1. API 라우트 구현
2. 배너 관리 페이지에 통합
3. 팝업 관리 페이지에도 동일 기능 추가
4. 환경 변수 설정 가이드 제공

## 참고

- 나노 바나나 공식 문서 URL
- API 키 발급 방법
- 사용 가능한 모델/스타일
- 요청 제한사항 (rate limit)
