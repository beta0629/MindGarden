# /opt/mindgarden/start.sh 에 넣을 Expo Push env fragment (참고용 — 저장소에 토큰 값 커밋 금지)
#
# 사용:
#   source /etc/mindgarden/dev.env
#   # 아래 export 블록을 start.sh 에 동일하게 추가 (dev.env 가 export 없이 KEY=value 만 쓸 때 필수)
#
# dev.env 예 (서버에서만 편집):
#   export EXPO_ACCESS_TOKEN="<expo-access-token>"
#   export EXPO_PUSH_API_URL="https://exp.host/--/api/v2/push/send"   # 선택, 비우면 application.yml 기본값

export EXPO_ACCESS_TOKEN
export EXPO_PUSH_API_URL
