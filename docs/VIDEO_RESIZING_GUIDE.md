# 히어로 비디오 리사이징 가이드

메인 페이지 히어로 섹션에 표시되는 비디오를 최적화하기 위한 가이드입니다.

## 권장 사양

### 해상도
- **권장**: 1920x1080 (Full HD)
- **최소**: 1280x720 (HD)
- **최대**: 1920x1080 (더 큰 해상도는 자동으로 리사이징됨)

### 형식
- **권장**: MP4 (H.264 코덱)
- **지원**: MP4, WebM, OGG

### 프레임레이트
- **권장**: 30fps
- **최대**: 60fps

### 파일 크기
- **권장**: 10MB 이하
- **최대**: 100MB

### 비트레이트
- **권장**: 2-5 Mbps
- **최대**: 10 Mbps

## 리사이징 도구

### 1. FFmpeg (명령줄 도구)

#### 설치
- **macOS**: `brew install ffmpeg`
- **Windows**: [FFmpeg 다운로드](https://www.ffmpeg.org/download.html)
- **Linux**: `sudo apt install ffmpeg`

#### 사용법
```bash
# 기본 리사이징 (1920x1080, 30fps, H.264)
ffmpeg -i input.mp4 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -r 30 output.mp4

# 파일 크기 최적화 (더 작은 파일)
ffmpeg -i input.mp4 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -preset slow -crf 28 -c:a aac -b:a 96k -r 30 -movflags +faststart output.mp4

# 빠른 변환 (품질 약간 낮음)
ffmpeg -i input.mp4 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -preset fast -crf 25 -c:a aac -b:a 128k -r 30 output.mp4
```

#### 옵션 설명
- `-vf "scale=..."`: 비디오 크기 조정 (비율 유지)
- `-c:v libx264`: H.264 코덱 사용
- `-preset`: 인코딩 속도 (ultrafast, fast, medium, slow, veryslow)
- `-crf`: 품질 (18-28, 낮을수록 고품질)
- `-c:a aac`: 오디오 코덱
- `-b:a`: 오디오 비트레이트
- `-r`: 프레임레이트
- `-movflags +faststart`: 웹 스트리밍 최적화

### 2. HandBrake (GUI 도구)

#### 다운로드
- [HandBrake 공식 사이트](https://handbrake.fr/)

#### 설정
1. **Preset**: "Fast 1080p30" 선택
2. **Dimensions**: 
   - Width: 1920
   - Height: 1080
   - Anamorphic: None
3. **Video**:
   - Video Codec: H.264 (x264)
   - Framerate: 30
   - Quality: RF 23 (또는 원하는 품질)
4. **Audio**:
   - Codec: AAC
   - Bitrate: 128 kbps
5. **Save**: 파일 저장

### 3. 온라인 도구

#### CloudConvert
- URL: https://cloudconvert.com/mp4-converter
- 장점: 설치 불필요, 간편한 사용
- 단점: 파일 크기 제한, 인터넷 연결 필요

#### FreeConvert
- URL: https://www.freeconvert.com/mp4-converter
- 장점: 무료, 다양한 형식 지원
- 단점: 파일 크기 제한

## 최적화 팁

### 1. 파일 크기 줄이기
- **CRF 값 높이기**: 23 → 28 (품질 약간 낮아지지만 파일 크기 감소)
- **프레임레이트 낮추기**: 60fps → 30fps
- **해상도 낮추기**: 4K → 1080p
- **오디오 비트레이트 낮추기**: 192k → 128k

### 2. 로딩 속도 개선
- **Fast Start 활성화**: `-movflags +faststart` 옵션 사용
- **프리로드 최적화**: 비디오 메타데이터를 파일 앞부분에 배치

### 3. 품질 유지
- **CRF 값 낮추기**: 28 → 23 (파일 크기 증가하지만 품질 향상)
- **Preset 느리게**: fast → slow (압축 효율 향상)

## 무료 비디오 소스

### 1. Pexels
- URL: https://www.pexels.com/search/videos/
- 특징: 무료, 고품질, 상업적 사용 가능
- 검색어 예시: "calm", "peaceful", "counseling", "therapy"

### 2. Pixabay
- URL: https://pixabay.com/videos/
- 특징: 무료, 다양한 카테고리
- 검색어 예시: "relaxing", "meditation", "wellness"

### 3. Unsplash (비디오)
- URL: https://unsplash.com/videos
- 특징: 고품질, 무료

## 체크리스트

업로드 전 확인사항:
- [ ] 해상도가 1920x1080 이하인가?
- [ ] 파일 형식이 MP4인가?
- [ ] 파일 크기가 100MB 이하인가?
- [ ] 프레임레이트가 30fps인가?
- [ ] H.264 코덱을 사용하는가?
- [ ] Fast Start 옵션이 적용되었는가?

## 문제 해결

### 비디오가 재생되지 않는 경우
1. 브라우저 콘솔에서 에러 확인
2. 파일 형식 확인 (MP4 권장)
3. 코덱 확인 (H.264 권장)
4. 파일 크기 확인 (100MB 이하)

### 비디오가 너무 느리게 로드되는 경우
1. 파일 크기 확인 (10MB 이하 권장)
2. Fast Start 옵션 적용 확인
3. CDN 사용 고려

### 비디오 품질이 낮은 경우
1. CRF 값 낮추기 (28 → 23)
2. 해상도 확인 (1920x1080 권장)
3. 원본 파일 품질 확인

## 관련 링크

- [FFmpeg 공식 문서](https://ffmpeg.org/documentation.html)
- [HandBrake 가이드](https://handbrake.fr/docs/)
- [H.264 인코딩 가이드](https://trac.ffmpeg.org/wiki/Encode/H.264)
- [비디오 최적화 가이드](https://web.dev/fast/)
