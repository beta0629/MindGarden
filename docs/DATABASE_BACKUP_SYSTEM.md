# 데이터베이스 백업 시스템

## 📋 개요

운영 데이터베이스의 자동 백업 시스템으로, 월 1회 자동 백업과 모니터링 기능을 제공합니다.

## 🗂️ 파일 구조

```
scripts/
├── database-backup.sh      # 월 1회 자동 백업 스크립트
├── backup-monitor.sh       # 백업 상태 모니터링 스크립트
├── database-restore.sh     # 백업 복원 스크립트
└── setup-backup-cron.sh    # Cron 설정 스크립트

src/main/java/com/mindgarden/consultation/controller/
└── BackupStatusController.java  # 백업 상태 API 컨트롤러
```

## ⚙️ 설정

### 1. 백업 스케줄
- **백업 실행**: 매월 1일 새벽 2시
- **모니터링**: 매일 새벽 3시
- **보존 기간**: 12개월 (1년)

### 2. 백업 위치
- **백업 파일**: `/home/backup/database/`
- **로그 파일**: `/home/backup/logs/`
- **파일 형식**: `mindgarden_backup_YYYYMM.sql.gz`

### 3. 백업 설정
```bash
# 데이터베이스 설정
DB_HOST="beta74.cafe24.com"
DB_NAME="mind_garden"
DB_USER="root"
BACKUP_DIR="/home/backup/database"
LOG_DIR="/home/backup/logs"
RETENTION_MONTHS=12
```

## 🚀 설치 및 설정

### 1. 서버에 스크립트 업로드
```bash
# 스크립트 파일들을 서버에 업로드
scp scripts/database-backup.sh root@beta74.cafe24.com:/home/scripts/
scp scripts/backup-monitor.sh root@beta74.cafe24.com:/home/scripts/
scp scripts/database-restore.sh root@beta74.cafe24.com:/home/scripts/
scp scripts/setup-backup-cron.sh root@beta74.cafe24.com:/home/scripts/
```

### 2. 서버에서 Cron 설정
```bash
# 서버 접속
ssh root@beta74.cafe24.com

# Cron 설정 스크립트 실행
cd /home/scripts
chmod +x *.sh
./setup-backup-cron.sh
```

### 3. 백업 디렉토리 생성
```bash
# 백업 디렉토리 생성
mkdir -p /home/backup/database
mkdir -p /home/backup/logs

# 권한 설정
chmod 755 /home/backup/database
chmod 755 /home/backup/logs
```

## 📊 백업 기능

### 1. 자동 백업 (`database-backup.sh`)
- **실행 주기**: 매월 1일 새벽 2시
- **백업 내용**: 전체 데이터베이스 (테이블, 루틴, 트리거, 이벤트)
- **압축**: gzip으로 압축하여 저장
- **보존**: 12개월 이상된 백업 자동 삭제

### 2. 모니터링 (`backup-monitor.sh`)
- **실행 주기**: 매일 새벽 3시
- **기능**: 백업 파일 존재 여부, 무결성 확인
- **알림**: 백업 상태 로그 기록

### 3. 복원 (`database-restore.sh`)
- **사용법**: `./database-restore.sh [백업파일명]`
- **안전장치**: 복원 전 현재 DB 자동 백업
- **복원 후**: 안전 백업 자동 삭제

## 🔧 API 엔드포인트

### 1. 백업 상태 조회
```http
GET /api/admin/backup/status
```

**응답 예시:**
```json
{
  "status": "success",
  "message": "백업 상태 조회 완료",
  "backupCount": 3,
  "totalSize": "2.5 GB",
  "latestBackup": {
    "fileName": "mindgarden_backup_202412.sql.gz",
    "fileSize": "850.2 MB",
    "lastModified": "2024-12-01 02:15:30",
    "filePath": "/home/backup/database/mindgarden_backup_202412.sql.gz"
  },
  "backupList": [...],
  "nextBackupDate": "2025년 01월 01일 02:00"
}
```

### 2. 백업 로그 조회
```http
GET /api/admin/backup/logs
```

### 3. 디렉토리 정보 조회
```http
GET /api/admin/backup/directory-info
```

## 📅 Cron 작업

### 설정된 Cron 작업
```bash
# 매월 1일 새벽 2시 백업 실행
0 2 1 * * /home/scripts/database-backup.sh >> /home/backup/logs/cron_backup.log 2>&1

# 매일 새벽 3시 모니터링 실행
0 3 * * * /home/scripts/backup-monitor.sh >> /home/backup/logs/cron_monitor.log 2>&1
```

### Cron 상태 확인
```bash
# 현재 Cron 작업 확인
crontab -l

# Cron 서비스 상태 확인
systemctl status cron

# Cron 서비스 시작/재시작
systemctl start cron
systemctl restart cron
```

## 🛠️ 수동 실행

### 1. 백업 실행
```bash
# 즉시 백업 실행
/home/scripts/database-backup.sh
```

### 2. 모니터링 실행
```bash
# 백업 상태 확인
/home/scripts/backup-monitor.sh
```

### 3. 복원 실행
```bash
# 최신 백업으로 복원
/home/scripts/database-restore.sh

# 특정 백업으로 복원
/home/scripts/database-restore.sh mindgarden_backup_202412.sql.gz
```

## 📋 백업 파일 관리

### 1. 파일 명명 규칙
- **형식**: `mindgarden_backup_YYYYMM.sql.gz`
- **예시**: `mindgarden_backup_202412.sql.gz`

### 2. 보존 정책
- **보존 기간**: 12개월
- **자동 삭제**: 12개월 이상된 파일 자동 삭제
- **수동 삭제**: 필요시 수동으로 삭제 가능

### 3. 파일 크기 최적화
- **압축**: gzip으로 압축하여 용량 절약
- **압축률**: 일반적으로 70-80% 용량 절약
- **백업 시간**: 압축으로 인한 추가 시간 최소화

## 🔍 모니터링 및 알림

### 1. 로그 파일
- **백업 로그**: `/home/backup/logs/db_backup_YYYYMM.log`
- **Cron 로그**: `/home/backup/logs/cron_backup.log`
- **모니터링 로그**: `/home/backup/logs/cron_monitor.log`

### 2. 상태 확인
```bash
# 최근 백업 로그 확인
tail -f /home/backup/logs/db_backup_202412.log

# Cron 실행 로그 확인
tail -f /home/backup/logs/cron_backup.log

# 백업 파일 목록 확인
ls -la /home/backup/database/
```

### 3. 문제 해결
```bash
# 백업 스크립트 실행 권한 확인
ls -la /home/scripts/database-backup.sh

# Cron 작업 실행 테스트
/home/scripts/database-backup.sh

# 디스크 용량 확인
df -h /home/backup/
```

## ⚠️ 주의사항

### 1. 백업 전 확인사항
- **디스크 용량**: 충분한 여유 공간 확보
- **MySQL 접근**: 데이터베이스 접근 권한 확인
- **네트워크**: 안정적인 네트워크 연결 확인

### 2. 복원 시 주의사항
- **데이터 손실**: 복원 시 현재 데이터 완전 삭제
- **서비스 중단**: 복원 중 서비스 중단 필요
- **백업 확인**: 복원 전 백업 파일 무결성 확인

### 3. 보안 고려사항
- **파일 권한**: 백업 파일 접근 권한 제한
- **암호화**: 민감한 데이터 암호화 고려
- **접근 제어**: 백업 파일 무단 접근 방지

## 📈 성능 최적화

### 1. 백업 최적화
- **단일 트랜잭션**: `--single-transaction` 옵션 사용
- **압축**: gzip으로 압축하여 용량 절약
- **병렬 처리**: 가능한 경우 병렬 처리 활용

### 2. 모니터링 최적화
- **로그 로테이션**: 오래된 로그 파일 정리
- **알림 시스템**: 백업 실패 시 알림 설정
- **성능 모니터링**: 백업 시간 및 용량 모니터링

## 🔄 업데이트 및 유지보수

### 1. 정기 점검
- **월 1회**: 백업 파일 무결성 확인
- **분기 1회**: 복원 테스트 실행
- **연 1회**: 백업 정책 검토 및 업데이트

### 2. 문제 해결
- **백업 실패**: 로그 확인 및 원인 분석
- **복원 실패**: 백업 파일 무결성 확인
- **성능 이슈**: 백업 시간 및 용량 최적화

---

**📝 참고**: 이 백업 시스템은 운영 환경의 데이터 보호를 위한 핵심 시스템입니다. 정기적인 모니터링과 테스트를 통해 안정성을 유지해야 합니다.
