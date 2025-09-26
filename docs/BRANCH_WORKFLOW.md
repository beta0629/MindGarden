# Git 브랜치 워크플로우

## 브랜치 전략

### 메인 브랜치
- `main`: 운영 환경 (안정화된 코드)
- `develop`: 개발 환경 (통합 개발 브랜치)

### 기능 브랜치
- `feature/기능명`: 새 기능 개발
- `hotfix/버그명`: 긴급 버그 수정
- `release/버전명`: 릴리즈 준비

## 작업 흐름

1. **브랜치 생성 및 체크아웃**
   ```bash
   git checkout -b feature/새기능명
   ```

2. **소스 수정 및 테스트**
   - 코드 수정
   - 로컬 테스트
   - 단위 테스트 실행

3. **커밋**
   ```bash
   git add .
   git commit -m "feat: 새 기능 추가"
   ```

4. **푸시 및 PR 생성**
   ```bash
   git push origin feature/새기능명
   ```

5. **메인 브랜치로 병합**
   - GitHub에서 Pull Request 생성
   - 코드 리뷰 후 병합

## 커밋 메시지 규칙

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 스타일 변경
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드/설정 변경
