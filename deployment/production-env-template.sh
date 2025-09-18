#!/bin/bash

# MindGarden 운영 환경변수 템플릿
# 파일 생성 위치: /home/beta74/mindgarden/.env

echo "🔧 운영 환경변수 파일 생성 중..."

cat > .env.production << 'EOF'
# MindGarden 운영 환경변수
# 사용법: source .env.production

# 기본 도메인 설정
export OAUTH2_BASE_URL=http://m-garden.co.kr
export FRONTEND_BASE_URL=http://m-garden.co.kr

# SSL 적용 시 HTTPS로 변경
# export OAUTH2_BASE_URL=https://m-garden.co.kr
# export FRONTEND_BASE_URL=https://m-garden.co.kr

# 데이터베이스 설정
export DB_USERNAME=mindgarden_prod
export DB_PASSWORD=MindGarden2025!@#

# OAuth2 설정 (기존 개발용 키 사용)
export KAKAO_CLIENT_ID=cbb457cfb5f9351fd495be4af2b11a34
export KAKAO_CLIENT_SECRET=LH53SXuqZk7iEVeDkKfQuKxW0sdxYmEG

export NAVER_CLIENT_ID=vTKNlxYKIfo1uCCXaDfk
export NAVER_CLIENT_SECRET=V_b3omW5pu

# 보안 키 생성 (실제 운영에서는 안전한 키로 변경)
export JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
export PERSONAL_DATA_ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d '\n')
export PERSONAL_DATA_ENCRYPTION_IV=$(openssl rand -base64 16 | tr -d '\n')

# 이메일 설정
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USERNAME=mindgarden1013@gmail.com
export SMTP_PASSWORD=ombe_ansd_pbcx_wgrz

# 결제 시스템 (테스트 모드)
export PAYMENT_TOSS_SECRET_KEY=test_sk_your_toss_secret
export PAYMENT_IAMPORT_API_KEY=your_iamport_key
export PAYMENT_IAMPORT_API_SECRET=your_iamport_secret

# 카카오 알림톡 (시뮬레이션 모드)
export KAKAO_ALIMTALK_API_KEY=your_alimtalk_key
export KAKAO_ALIMTALK_SENDER_KEY=your_sender_key

# SMS 설정 (테스트 모드)
export SMS_API_KEY=your_sms_key
export SMS_API_SECRET=your_sms_secret
export SMS_SENDER_NUMBER=your_phone_number

# 서버 설정
export SERVER_PORT=8080
export SPRING_PROFILES_ACTIVE=production

# SSL 설정 (HTTPS 적용 시)
# export SSL_KEYSTORE_PATH=/etc/ssl/mindgarden/keystore.p12
# export SSL_KEYSTORE_PASSWORD=your_keystore_password
# export SSL_KEY_ALIAS=mindgarden
EOF

echo "✅ 환경변수 파일 생성 완료: .env.production"
echo ""
echo "📋 카카오/네이버 개발자 콘솔에서 설정할 Redirect URI:"
echo ""
echo "🟡 카카오 개발자 콘솔 (https://developers.kakao.com/):"
echo "   앱: MindGarden (cbb457cfb5f9351fd495be4af2b11a34)"
echo "   Redirect URI 추가: http://m-garden.co.kr/api/auth/kakao/callback"
echo ""
echo "🟢 네이버 개발자 센터 (https://developers.naver.com/):"
echo "   앱: MindGarden (vTKNlxYKIfo1uCCXaDfk)"
echo "   Callback URL 추가: http://m-garden.co.kr/api/auth/naver/callback"
echo ""
echo "⚠️ 주의사항:"
echo "1. HTTP로 먼저 테스트 후 HTTPS로 전환 권장"
echo "2. 도메인 연결 완료 후 OAuth2 설정"
echo "3. 기존 localhost URI는 개발용으로 유지"
echo ""
echo "🔒 HTTPS 적용 후:"
echo "   - 환경변수에서 OAUTH2_BASE_URL을 https://m-garden.co.kr로 변경"
echo "   - 카카오/네이버 콘솔에서 HTTPS URI 추가 등록"
