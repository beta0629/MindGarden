#!/bin/bash

# MindGarden 운영 환경변수 템플릿 (비밀 실값 금지 — 배포 서버에서만 채움)
# 생성물: ./.env.production (또는 systemd EnvironmentFile로 복사)
#
# 도메인 단일 진실: application-dev.yml의 공개 FQDN에서 `.dev` 구간만 제거한 HTTPS URL
#   예) https://mindgarden.dev.core-solution.co.kr → https://mindgarden.core-solution.co.kr
# 실제 server_name은 Nginx(config/nginx/core-solution-prod.conf)와 동일해야 함.
# (레거시 인스턴스: beta74에서 과거에 m-garden.co.kr을 쓴 이력 있음 — 신규 합의 도메인으로 통일)

echo "🔧 운영 환경변수 파일 생성 중..."

cat > .env.production << 'EOF'
# MindGarden 운영 환경변수
# 사용법: source .env.production  또는 systemd EnvironmentFile=

# --- 공개 URL (HTTPS, 동일 호스트 권장: OAuth redirect와 일치) ---
export OAUTH2_BASE_URL=https://mindgarden.core-solution.co.kr
export FRONTEND_BASE_URL=https://mindgarden.core-solution.co.kr
export SERVER_BASE_URL=https://mindgarden.core-solution.co.kr

# 세션 쿠키 도메인 (dev는 SESSION_COOKIE_DOMAIN=dev.core-solution.co.kr → 운영은 보통 apex)
# export SESSION_COOKIE_DOMAIN=core-solution.co.kr

# 데이터베이스 (실비는 서버에서만 설정)
export DB_USERNAME=mindgarden_prod
export DB_PASSWORD=changeme
# DB_PASSWORD: 운영 비밀번호를 안전하게 설정

# OAuth2 (콘솔에 등록한 앱의 클라이언트 ID/SECRET — 저장소에 실키 금지)
export KAKAO_CLIENT_ID=changeme
export KAKAO_CLIENT_SECRET=changeme
export NAVER_CLIENT_ID=changeme
export NAVER_CLIENT_SECRET=changeme

# 보안 키 (반드시 강한 난수로 교체)
export JWT_SECRET=changeme
# 생성 예: openssl rand -base64 64 | tr -d '\n'
export PERSONAL_DATA_ENCRYPTION_KEY=changeme
# 생성 예: openssl rand -base64 32 | tr -d '\n'
export PERSONAL_DATA_ENCRYPTION_IV=changeme
# 생성 예: openssl rand -base64 16 | tr -d '\n'

# 이메일 (실계정·앱 비밀번호는 서버에서만 설정)
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USERNAME=changeme
export SMTP_PASSWORD=changeme
# SMTP_PASSWORD: 예) Gmail 앱 비밀번호

# 결제·외부 연동 (플레이스홀더)
export PAYMENT_TOSS_SECRET_KEY=changeme
export PAYMENT_IAMPORT_API_KEY=changeme
export PAYMENT_IAMPORT_API_SECRET=changeme

export KAKAO_ALIMTALK_API_KEY=changeme
export KAKAO_ALIMTALK_SENDER_KEY=changeme

export SMS_API_KEY=changeme
export SMS_API_SECRET=changeme
export SMS_SENDER_NUMBER=changeme

# 서버
export SERVER_PORT=8080
export SPRING_PROFILES_ACTIVE=production

# SSL (터미널 TLS 사용 시)
# export SSL_KEYSTORE_PATH=/etc/ssl/mindgarden/keystore.p12
# export SSL_KEYSTORE_PASSWORD=changeme
# export SSL_KEY_ALIAS=mindgarden

# 심리검사 PDF 등 (application-production.yml 주석 참고)
# export PSYCH_DOC_KEY_B64=
EOF

PROD_PUBLIC_BASE="${OAUTH2_BASE_URL:-https://mindgarden.core-solution.co.kr}"

echo "✅ 환경변수 파일 생성 완료: .env.production"
echo ""
echo "📋 카카오/네이버 개발자 콘솔 Redirect URI (HTTPS, 환경의 OAUTH2_BASE_URL과 동일 호스트):"
echo ""
echo "🟡 카카오 (https://developers.kakao.com/):"
echo "   Redirect URI: ${PROD_PUBLIC_BASE}/api/auth/kakao/callback"
echo ""
echo "🟢 네이버 (https://developers.naver.com/):"
echo "   Callback URL: ${PROD_PUBLIC_BASE}/api/auth/naver/callback"
echo ""
echo "⚠️ 주의:"
echo "1. OAUTH2_BASE_URL / FRONTEND_BASE_URL / SERVER_BASE_URL 값을 실제 Nginx server_name과 맞출 것"
echo "2. 레거시 도메인(m-garden.co.kr 등)은 사용하지 않는 경우 콘솔에서 HTTPS 신규 URI만 유지"
echo "3. .env.production 내 changeme·플레이스홀더는 배포 서버에서 반드시 실값으로 교체"
echo ""
</think>

<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
StrReplace