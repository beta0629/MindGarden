# 자동 배포(웹훅) 점검·트러블슈팅

**목적**: 푸시해도 자동으로 배포·재기동이 안 될 때, **웹훅 수신 → 스크립트 실행 → 빌드 → pm2 restart** 중 어디에서 끊기는지 점검하는 절차.

---

## 1. 점검 요약

| 단계 | 확인 항목 | 확인 방법 |
|------|-----------|-----------|
| 1 | GitHub에서 서버로 웹훅이 나가는지 | GitHub → Settings → Webhooks → Recent Deliveries |
| 2 | 서버가 요청을 받는지 | `pm2 logs homepage-webhook` 에 "Webhook received" 등 출력 여부 |
| 3 | 배포 스크립트에 재기동이 있는지 | `grep "pm2 restart" /var/www/homepage/deploy-from-webhook.sh` |
| 4 | 빌드 실패로 재기동이 스킵되는지 | 웹훅 로그에 "Deployment error" / stderr 확인, 수동 스크립트 실행 |

---

## 2. 웹훅이 서버에 도달하는지

- **GitHub**: 저장소 → **Settings → Webhooks**
  - Payload URL: `http://114.202.247.246:3001/webhook` 등록 여부
  - **Recent Deliveries**: `homepage/develop` 푸시 시 요청이 **200**으로 성공하는지 확인
  - 실패(4xx/5xx 또는 timeout)면:
    - 서버 방화벽에서 **3001 포트**가 외부(또는 GitHub IP)에 열려 있는지
    - Secret이 GitHub와 서버 `WEBHOOK_SECRET`(또는 `webhook-listener.js` 기본값)과 일치하는지

---

## 3. 서버 웹훅 로그

```bash
ssh beta0629.cafe24.com
pm2 logs homepage-webhook --lines 100
```

- **"Webhook listener running on port 3001"** 만 있고 **"Webhook received for ref:"** 가 전혀 없으면  
  → GitHub 요청이 서버에 도달하지 않은 것. 2번(URL·방화벽·Secret)부터 다시 확인.

- **"Webhook received for ref: refs/heads/homepage/develop"**, **"Deployment triggered"** 가 보이면  
  → 웹훅은 들어온 것. 이어서 **"Deployment completed"** / **"Deployment error"** 여부 확인.

---

## 4. 배포 스크립트·리스너

- **deploy-from-webhook.sh**  
  - 끝에 `pm2 restart homepage-dev` 가 있어야 배포 후 자동 재기동됨.  
  - 확인: `grep -n "pm2 restart" /var/www/homepage/deploy-from-webhook.sh`

- **webhook-listener.js**  
  - `ref === 'refs/heads/homepage/develop'` 일 때만  
    `exec('cd /var/www/homepage && /var/www/homepage/deploy-from-webhook.sh', ...)` 로 스크립트 실행.  
  - 서버에 이미 이 로직이 있음.

---

## 5. 빌드 실패로 재기동까지 못 가는 경우

- `deploy-from-webhook.sh` 에 `set -e` 가 있거나, 중간에 실패하면 **pm2 restart** 는 실행되지 않음.
- **pm2 logs homepage-webhook** 에서 **"Deployment error"** 또는 stderr 로그가 있는지 확인.
- 서버에서 **수동으로 같은 방식**으로 실행해 보기:

  ```bash
  cd /var/www/homepage && bash deploy-from-webhook.sh
  ```

  - 여기서 빌드가 실패하면 웹훅으로 실행해도 실패하는 것. (env, Node 버전, 디스크 공간 등 확인)
  - 수동 실행이 성공하면 웹훅 시의 **실행 환경**(경로, 사용자, env) 차이를 의심.

---

## 6. 정리

- **자동 재기동이 안 된다** → (1) 웹훅이 아예 안 오는지, (2) 오는데 빌드가 깨지는지, (3) 스크립트에 restart 가 빠졌는지 순서로 점검.
- 스크립트에 `pm2 restart` 가 있고, 웹훅 로그에 "Deployment completed" 가 찍히면 재기동까지 갔어야 함. 그때도 앱이 안 바뀌면 **다른 프로세스/포트**를 보고 있지 않은지 확인 (PM2 앱 이름·포트 일치 여부).
