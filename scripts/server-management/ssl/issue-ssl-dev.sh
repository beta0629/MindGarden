#!/bin/bash

# 개발 서버 SSL 인증서 발급 스크립트
# 서버 IP: 114.202.247.246
# 사용법: sudo ./issue-ssl-dev.sh

set -e

echo "=== 개발 서버 SSL 인증서 발급 시작 ==="
echo "서버 IP: 114.202.247.246"
echo ""

# 이메일 주소 (필요시 수정)
EMAIL="admin@e-trinity.co.kr"

# e-trinity.co.kr 도메인
echo "1. dev.e-trinity.co.kr"
sudo certbot --nginx -d dev.e-trinity.co.kr --non-interactive --agree-tos --email $EMAIL || echo "⚠️ dev.e-trinity.co.kr 발급 실패"

echo "2. apply.dev.e-trinity.co.kr"
sudo certbot --nginx -d apply.dev.e-trinity.co.kr --non-interactive --agree-tos --email $EMAIL || echo "⚠️ apply.dev.e-trinity.co.kr 발급 실패"

echo "3. ops.dev.e-trinity.co.kr"
sudo certbot --nginx -d ops.dev.e-trinity.co.kr --non-interactive --agree-tos --email $EMAIL || echo "⚠️ ops.dev.e-trinity.co.kr 발급 실패"

# core-solution.co.kr 도메인
echo "4. dev.core-solution.co.kr"
sudo certbot --nginx -d dev.core-solution.co.kr --non-interactive --agree-tos --email admin@core-solution.co.kr || echo "⚠️ dev.core-solution.co.kr 발급 실패"

echo "5. api.dev.core-solution.co.kr"
sudo certbot --nginx -d api.dev.core-solution.co.kr --non-interactive --agree-tos --email admin@core-solution.co.kr || echo "⚠️ api.dev.core-solution.co.kr 발급 실패"

# m-garden.co.kr 도메인 (기존)
echo "6. dev.m-garden.co.kr"
sudo certbot --nginx -d dev.m-garden.co.kr --non-interactive --agree-tos --email admin@m-garden.co.kr || echo "⚠️ dev.m-garden.co.kr 발급 실패"

echo ""
echo "=== 개발 서버 SSL 인증서 발급 완료 ==="
echo ""
echo "인증서 목록 확인:"
sudo certbot certificates

