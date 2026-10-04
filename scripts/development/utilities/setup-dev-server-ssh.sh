#!/bin/bash
# 개발 서버 SSH 키 설정 스크립트
# Usage: ./scripts/setup-dev-server-ssh.sh

set -e

DEV_SERVER="${DEV_SERVER_HOST:?DEV_SERVER_HOST 환경변수를 설정하세요}"
DEV_USER="root"
SSH_KEY_NAME="github_actions_dev"
SSH_KEY_PATH="$HOME/.ssh/$SSH_KEY_NAME"

echo "🔧 개발 서버 SSH 키 설정 시작..."
echo ""

# 1. SSH 키 생성 (없는 경우)
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "📝 SSH 키 생성 중..."
    ssh-keygen -t rsa -b 4096 -C "github-actions-dev" -f "$SSH_KEY_PATH" -N ""
    echo "✅ SSH 키 생성 완료: $SSH_KEY_PATH"
else
    echo "✅ 기존 SSH 키 사용: $SSH_KEY_PATH"
fi

# 2. 공개키를 개발 서버에 등록
echo ""
echo "📤 개발 서버에 공개키 등록 중..."
echo "⚠️  개발 서버 비밀번호를 입력해야 합니다."

# ssh-copy-id 사용 (가장 간단한 방법)
if command -v ssh-copy-id &> /dev/null; then
    ssh-copy-id -i "$SSH_KEY_PATH.pub" "$DEV_USER@$DEV_SERVER"
else
    # ssh-copy-id가 없는 경우 수동으로 등록
    echo "ssh-copy-id가 없습니다. 수동으로 등록하세요:"
    echo ""
    echo "1. 다음 명령어로 공개키 내용을 복사하세요:"
    echo "   cat $SSH_KEY_PATH.pub"
    echo ""
    echo "2. 개발 서버에 접속하여 다음 명령어를 실행하세요:"
    echo "   ssh $DEV_USER@$DEV_SERVER"
    echo "   mkdir -p ~/.ssh"
    echo "   chmod 700 ~/.ssh"
    echo "   echo '공개키_내용' >> ~/.ssh/authorized_keys"
    echo "   chmod 600 ~/.ssh/authorized_keys"
    exit 1
fi

# 3. SSH 연결 테스트
echo ""
echo "🔍 SSH 연결 테스트 중..."
if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$DEV_USER@$DEV_SERVER" "echo 'SSH 연결 성공!'" 2>/dev/null; then
    echo "✅ SSH 연결 테스트 성공!"
else
    echo "❌ SSH 연결 테스트 실패"
    echo "공개키가 개발 서버에 제대로 등록되었는지 확인하세요."
    exit 1
fi

# 4. 개인키 내용 출력
echo ""
echo "📋 GitHub Secrets에 등록할 개인키 내용:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$SSH_KEY_PATH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ 위 내용을 복사하여 GitHub Secrets의 'DEV_SERVER_SSH_KEY'에 등록하세요."
echo ""
echo "📝 GitHub Secrets 설정:"
echo "   1. GitHub 저장소 > Settings > Secrets and variables > Actions"
echo "   2. New repository secret 클릭"
echo "   3. Name: DEV_SERVER_SSH_KEY"
echo "   4. Value: 위의 개인키 전체 내용 붙여넣기"
echo "   5. Add secret 클릭"
echo ""
echo "✅ 개발 서버 SSH 키 설정 완료!"


