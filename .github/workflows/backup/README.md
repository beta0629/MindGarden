# 워크플로우 백업 디렉토리

이 디렉토리는 워크플로우 파일의 백업을 저장합니다.

## 백업 파일 명명 규칙
- `{원본파일명}.backup.{YYYYMMDD_HHMMSS}`

## 복원 방법
```bash
cp .github/workflows/backup/deploy-production.yml.backup.YYYYMMDD_HHMMSS .github/workflows/deploy-production.yml
```

