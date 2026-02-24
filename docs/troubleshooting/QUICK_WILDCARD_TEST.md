문서 위치: docs/troubleshooting/QUICK_WILDCARD_TEST.md

# 와일드카드 도메인 빠른 테스트

## 1. 서버에서 SSL 인증서 확인
```bash
ssh root@beta0629.cafe24.com
sudo certbot certificates
```

## 2. 로컬에서 빠른 테스트
```bash
./scripts/development/testing/test-wildcard-quick.sh test1
```

## 3. 브라우저에서 확인
- https://test1.dev.core-solution.co.kr
- https://test2.dev.core-solution.co.kr

## 문제 발생 시
1. SSL 인증서 없으면: `sudo certbot --nginx -d "*.dev.core-solution.co.kr"`
2. Nginx 재시작: `sudo systemctl reload nginx`
