#!/bin/bash

# 운영 서버 SSL 인증서 발급 스크립트
# 서버 IP: 211.37.179.204
# 사용법: sudo ./issue-ssl-prod.sh

set -e

echo "=== 운영 서버 SSL 인증서 발급 시작 ==="
echo "서버 IP: 211.37.179.204"
echo ""

# 이메일 주소 (필요시 수정)
EMAIL="admin@e-trinity.co.kr"

# e-trinity.co.kr 도메인
echo "1. e-trinity.co.kr (www 포함)"
sudo certbot --nginx -d e-trinity.co.kr -d www.e-trinity.co.kr --non-interactive --agree-tos --email $EMAIL || echo "⚠️ e-trinity.co.kr 발급 실패"

echo "2. apply.e-trinity.co.kr"
sudo certbot --nginx -d apply.e-trinity.co.kr --non-interactive --agree-tos --email $EMAIL || echo "⚠️ apply.e-trinity.co.kr 발급 실패"

echo "3. ops.e-trinity.co.kr"
sudo certbot --nginx -d ops.e-trinity.co.kr --non-interactive --agree-tos --email $EMAIL || echo "⚠️ ops.e-trinity.co.kr 발급 실패"

# core-solution.co.kr 도메인
echo "4. app.core-solution.co.kr"
sudo certbot --nginx -d app.core-solution.co.kr --non-interactive --agree-tos --email admin@core-solution.co.kr || echo "⚠️ app.core-solution.co.kr 발급 실패"

echo "5. api.core-solution.co.kr"
sudo certbot --nginx -d api.core-solution.co.kr --non-interactive --agree-tos --email admin@core-solution.co.kr || echo "⚠️ api.core-solution.co.kr 발급 실패"

# m-garden.co.kr 도메인 (기존)
echo "6. m-garden.co.kr"
sudo certbot --nginx -d m-garden.co.kr --non-interactive --agree-tos --email admin@m-garden.co.kr || echo "⚠️ m-garden.co.kr 발급 실패"

echo ""
echo "=== 운영 서버 SSL 인증서 발급 완료 ==="
echo ""
echo "인증서 목록 확인:"
sudo certbot certificates

