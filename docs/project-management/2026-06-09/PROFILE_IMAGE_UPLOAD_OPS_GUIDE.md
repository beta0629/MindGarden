# 프로필 이미지 업로드 — 운영 배포 절차 가이드

**작성일**: 2026-06-09
**범위**: P0 영구 대책 Phase 2 — `POST /api/v1/users/profile/{userId}/image` multipart endpoint 신설 PR
**선행 가드**: PR #159 (`ProfileImageUrlGuard`) + PR #166 (UserProfileService 가드 누락 핫픽스)
**관련 코드**:
- BE: `src/main/java/com/coresolution/consultation/controller/ProfileImageUploadController.java`
- BE: `src/main/java/com/coresolution/consultation/service/ProfileImageStorageService.java`
- BE: `src/main/java/com/coresolution/core/controller/FileController.java` (`/api/v1/files/profile-images/{file}` 서빙)
- BE: `src/main/resources/application.yml` (`mindgarden.upload.profile-image.base-dir`, `spring.servlet.multipart`)
- BE: `src/main/java/com/coresolution/consultation/constant/ProfileImageStorageConstants.java`
- FE: `frontend/src/components/mypage/components/ProfileImageUpload.js` (web)
- FE: `expo-app/src/api/hooks/useProfileImageUpload.ts` (mobile)
- ENV: `deployment/mindgarden.prod-env.example` — `PROFILE_IMAGE_UPLOAD_DIR`

---

## 0. 배경 (1줄)

`users.profile_image_url` 컬럼(longtext) 에 base64 dataURI 가 저장돼 마이페이지 응답이 폭증하는 회귀를 **영구** 차단하기 위해, 파일은 로컬 공용 디스크에 저장하고 DB 에는 URL 만 저장한다.

---

## 1. 운영 디렉터리 생성 (메인이 SSH 로 1회)

**대상 호스트**: `beta74.cafe24.com` (운영). blue/green 두 인스턴스가 공용으로 사용.

```bash
ssh beta74.cafe24.com

# 1. 부모 디렉터리·업로드 디렉터리 생성
sudo mkdir -p /var/mindgarden/uploads/profile-images/

# 2. 서비스 계정 소유로 변경 (운영 환경의 systemd 서비스 사용자에 맞춰 조정)
#    blue/green 동일 사용자(beta74) 가정. 다르면 그룹을 만들어 g+w 부여.
sudo chown beta74:beta74 /var/mindgarden/uploads/profile-images/
sudo chmod 755 /var/mindgarden/uploads/profile-images/

# 3. 결과 확인
ls -la /var/mindgarden/uploads/
ls -la /var/mindgarden/uploads/profile-images/
```

**기대 결과**:
```
drwxr-xr-x  3 beta74 beta74  4096 Jun  9 ... profile-images
```

> 이미 95GB 중 59GB 가용 (Phase 1 인벤토리 결과) 이므로 1년 ~ 수년치 업로드 용량은 안전. 모니터링 임계 등록은 별도 작업으로 추적.

---

## 2. nginx `client_max_body_size` 설정 (메인이 SSH 로 1회)

운영 nginx 의 `/api/` location 에는 현재 `client_max_body_size` 가 없어 기본 1MB 가 적용된다. multipart 5MB 본문이 통과하려면 명시 필요.

```bash
ssh beta74.cafe24.com

# 1. 백업
sudo cp /etc/nginx/sites-enabled/core-solution /etc/nginx/sites-enabled/core-solution.bak.$(date +%Y%m%d)

# 2. /api/ location 내부 또는 server block 최상위에 추가
sudo vi /etc/nginx/sites-enabled/core-solution
```

**삽입 위치 예시 (server block 최상위 권장 — /api/ 외 다른 multipart 도 미래 대비)**:
```nginx
server {
    # ... 기존 listen / server_name ...

    # 2026-06-09: 프로필 이미지 multipart 업로드 (5MB) + 여유분
    client_max_body_size 6m;

    # ... 기존 location 들 ...
}
```

**적용 + 검증**:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

> `nginx -t` 가 성공해야 reload 진행. 실패 시 백업 파일로 즉시 복구.

---

## 3. 환경변수 주입 (메인이 SSH 로 1회)

운영 서비스 systemd EnvironmentFile (예: `/etc/mindgarden/prod-from-dev.env`) 에 환경변수 추가:

```bash
ssh beta74.cafe24.com
sudo vi /etc/mindgarden/prod-from-dev.env
```

**추가 라인**:
```
# 사용자 프로필 이미지 업로드 디렉터리 (P0 영구 대책 Phase 2 — 2026-06-09)
PROFILE_IMAGE_UPLOAD_DIR=/var/mindgarden/uploads/profile-images/
```

**서비스 재시작 (blue/green 순차)**:
```bash
sudo systemctl daemon-reload
# blue
sudo systemctl restart mindgarden-blue.service
sleep 30 && curl -sf http://localhost:8080/actuator/health
# green
sudo systemctl restart mindgarden-green.service
sleep 30 && curl -sf http://localhost:8081/actuator/health
```

> 실제 서비스 unit·포트 명은 운영 systemd 등록에 맞춤. EnvironmentFile 미사용 시 GitHub Actions Secrets 에 동일 키 추가 + 배포 워크플로에서 export 후 systemd 실행 패턴 사용.

---

## 4. 배포 후 스모크 테스트 (메인 또는 사용자)

### 4.1 디렉터리 권한 확인
```bash
ssh beta74.cafe24.com
ls -la /var/mindgarden/uploads/profile-images/
# 서비스 사용자(beta74)로 ls/touch 가능해야 함
sudo -u beta74 touch /var/mindgarden/uploads/profile-images/.write-test && \
  sudo -u beta74 rm /var/mindgarden/uploads/profile-images/.write-test
```

### 4.2 본인 업로드 정상 케이스
- 운영 어드민/내담자 본인 로그인 → 마이페이지 → 프로필 이미지 변경 → 200 응답 + 응답 본문 `data.profileImageUrl` 이 `/api/v1/files/profile-images/...` 로 시작
- 즉시 `<img src=...>` 가 다음 새로고침에 정상 표시되는지 확인

### 4.3 거부 시나리오 (UI 또는 cURL)
- 6MB 초과 파일: 413 (또는 400) + 메시지 노출
- `image/gif` 업로드: 400 + `MSG_UNSUPPORTED_MIME`
- 본인 외 userId 로 업로드 (admin 외): 403 + `MSG_FORBIDDEN`

### 4.4 디스크 적재 확인
```bash
ssh beta74.cafe24.com
ls -la /var/mindgarden/uploads/profile-images/ | head -20
du -sh /var/mindgarden/uploads/profile-images/
```

---

## 5. 운영 DB 스캔 SQL (사전 작성 — 실행은 사용자 승인 후 메인이 진행)

배포 직후, 운영 DB 에 base64 잔여 row 가 남아 있는지 스캔한다. 본 PR 머지·배포만으로는 **신규 입력만** 차단되며, 과거 row 는 응답 가드(`ProfileImageUrlGuard.sanitizeOutbound`) 가 null 로 치환만 한다.

### 5.1 잔여 스캔 (READ-ONLY, 안전)
```sql
-- 1. base64 dataURI 잔여 row + 비정상 길이(2KB 초과) 동시 스캔
SELECT id, role, CHAR_LENGTH(profile_image_url) AS len,
       LEFT(profile_image_url, 60) AS preview
FROM users
WHERE profile_image_url LIKE 'data:%'
   OR CHAR_LENGTH(profile_image_url) > 2048
ORDER BY len DESC;
```

### 5.2 NULL 처리 (조회 결과 검수 후, 사용자 승인 시)
```sql
-- 2. 발견된 id 목록을 명시적으로 나열해 update (전역 update 금지)
--    (id=20 등 핫픽스 케이스가 이미 처리됐다면 제외)
UPDATE users
SET profile_image_url = NULL,
    updated_at = NOW()
WHERE id IN (<발견된 id 목록 콤마 구분>)
  AND (profile_image_url LIKE 'data:%' OR CHAR_LENGTH(profile_image_url) > 2048);
```

### 5.3 검증
```sql
SELECT id, CHAR_LENGTH(IFNULL(profile_image_url, '')) AS after_len
FROM users
WHERE id IN (<발견된 id 목록>);
```

> 위 SQL 은 본 PR 의 코드 변경이 아니라 운영 데이터 정리 절차. **본 위임은 SQL 작성까지** 만 책임지며 실행은 사용자 승인 후 메인이 진행한다.

---

## 6. 롤백 절차 (장애 시)

### 6.1 BE 롤백
```bash
# develop 직전 SHA 로 워크플로 재배포 (운영 dispatch 워크플로 사용)
# 본 PR 머지 직전 main SHA 를 사용한 dev/prod 워크플로 재실행
```

- BE 롤백만으로 신규 endpoint 가 사라지고 PUT 흐름이 복원됨.
- **FE 는 web/expo 양쪽 모두 이전 PUT base64 흐름으로 동시 롤백 필요** (그렇지 않으면 클라가 404 endpoint 호출). 따라서 FE 캐시 무효화 / 앱 OTA(Expo updates) 동반 필수.

### 6.2 디스크 정리 (옵션)
- 업로드된 파일들은 disk 에 그대로 남는다. 운영 안정화 후 의도적 삭제 전까지 보존.
- 강제 정리 필요 시: `rm /var/mindgarden/uploads/profile-images/{tenantId}_{userId}_*` (사용자 승인 필수)

---

## 7. 후속 작업 (별도 PR — 본 PR 범위 외)

1. **마이그레이션**: `users.profile_image_url` longtext → varchar(500). 운영 안정화 1~2주 후 Flyway PR 별도 진행.
2. **모니터링**: `/var/mindgarden/uploads/profile-images/` 디스크 사용량 80% 임계 알람.
3. **백업/lifecycle**: 90일+ 미사용 파일 정리 스케줄러 (`FileCleanupScheduler` 패턴 차용).

---

## 8. 체크리스트 (메인 사용자 승인 ↔ 메인 실행)

- [ ] PR 머지 완료
- [ ] 운영 디렉터리 `/var/mindgarden/uploads/profile-images/` 생성 + 권한 확인
- [ ] nginx `client_max_body_size 6m` 반영 + `nginx -t` 통과 + reload
- [ ] `PROFILE_IMAGE_UPLOAD_DIR` 환경변수 주입 + systemd 재시작
- [ ] blue/green health check
- [ ] 본인 업로드 스모크 OK (마이페이지 → 변경 → 200 + URL 응답)
- [ ] 거부 시나리오 (사이즈/MIME/타인) 동작 확인
- [ ] 운영 DB 잔여 base64 스캔 (5.1) → 결과 공유
- [ ] (선택) 발견된 id NULL 처리 (5.2) — 사용자 승인 시
- [ ] 후속 마이그레이션 (varchar) 별도 PR 발행
