# shellcheck shell=bash
# DEV DB SSH 터널을 열고 DB_HOST=127.0.0.1, DB_PORT=<로컬 포트> 를 export 한다. source 로만 쓴다.
# 필요: JUMP_HOST JUMP_USER JUMP_KEY DB_HOST DB_NAME. 값은 출력하지 않는다.
# 운영 스키마 이름은 거부한다. 셸이 끝나면 터널과 키 파일을 지운다.

case "${DB_NAME:-}" in
  ''|mind_garden|mind_garden_legacy_*)
    echo "::error::DEV tunnel refuses an empty or production schema name" >&2
    exit 1
    ;;
esac
case "${JUMP_HOST:-}" in
  ''|*[!A-Za-z0-9._:-]*) echo "::error::jump host is empty or has unsupported characters" >&2; exit 1 ;;
esac
case "${JUMP_USER:-}" in
  ''|*[!A-Za-z0-9._-]*) echo "::error::jump user is empty or has unsupported characters" >&2; exit 1 ;;
esac
case "${DB_HOST:-}" in
  ''|*[!A-Za-z0-9._:%-]*) echo "::error::DB host is empty or has unsupported characters" >&2; exit 1 ;;
esac

DEV_TUNNEL_KEY_FILE="$(mktemp)"
chmod 600 "$DEV_TUNNEL_KEY_FILE"
printf '%s\n' "$JUMP_KEY" >"$DEV_TUNNEL_KEY_FILE"
DEV_TUNNEL_SOCK="$(mktemp -u)"
DEV_TUNNEL_PORT="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1]); s.close()')"
dev_tunnel_cleanup() {
  ssh -i "$DEV_TUNNEL_KEY_FILE" -S "$DEV_TUNNEL_SOCK" -O exit "${JUMP_USER}@${JUMP_HOST}" >/dev/null 2>&1 || true
  rm -f "$DEV_TUNNEL_KEY_FILE"
}
trap dev_tunnel_cleanup EXIT
mkdir -p ~/.ssh
ssh-keyscan -H "$JUMP_HOST" >>~/.ssh/known_hosts 2>/dev/null || true
ssh -i "$DEV_TUNNEL_KEY_FILE" -o BatchMode=yes -o ExitOnForwardFailure=yes \
  -M -S "$DEV_TUNNEL_SOCK" -f -N \
  -L "127.0.0.1:${DEV_TUNNEL_PORT}:${DB_HOST}:3306" \
  "${JUMP_USER}@${JUMP_HOST}"
export DB_HOST=127.0.0.1
export DB_PORT="$DEV_TUNNEL_PORT"
