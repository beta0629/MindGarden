#!/bin/bash
# 수동 배포 입력(procedures)을 배포 스크립트가 읽는 변경 파일 목록으로 바꾼다.
# 입력: 환경변수 PROCEDURE_DEPLOY_REQUESTED (쉼표 구분 프로시저 이름, 비어 있어도 됨)
# 출력: stdout 에 저장소 기준 배포 SQL 경로를 한 줄에 하나씩. 입력이 비면 아무것도 출력하지 않는다.
# 종료 코드: 0 정상, 2 이름 형식 오류, 3 배포 SQL 없음
# 출력은 PROCEDURE_DEPLOY_CHANGED_FILES 파일 형식과 같다.

set -u

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/procedure-deploy-changed-only.sh"

PROCEDURE_DEPLOY_DISPATCH_DIR="database/schema/procedures_standardized/deployment"

procedure_deploy_dispatch_trim() {
    local value="$1"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    printf '%s' "$value"
}

procedure_deploy_dispatch_list() {
    local requested="${PROCEDURE_DEPLOY_REQUESTED:-}"
    local repo token name rel resolved seen missing
    local -a tokens
    repo=$(procedure_deploy_repo_root) || {
        echo "저장소 루트를 알 수 없습니다." >&2
        return 2
    }
    requested=${requested//$'\r'/}
    requested=${requested//$'\n'/,}
    if [ -z "$(procedure_deploy_dispatch_trim "$requested")" ]; then
        return 0
    fi
    IFS=',' read -r -a tokens <<<"$requested"
    seen=" "
    missing=0
    for token in "${tokens[@]}"; do
        name=$(procedure_deploy_dispatch_trim "$token")
        [ -n "$name" ] || continue
        if ! procedure_deploy_is_ident "$name"; then
            echo "거부: 프로시저 이름 형식이 아닙니다: '$name' (영문·숫자·밑줄, 숫자로 시작 불가)" >&2
            return 2
        fi
        case "$seen" in
            *" ${name} "*) continue ;;
        esac
        seen="${seen}${name} "
        rel="${PROCEDURE_DEPLOY_DISPATCH_DIR}/${name}_deploy.sql"
        resolved=$(procedure_deploy_name_from_path "$rel") || resolved=""
        if [ "$resolved" != "$name" ]; then
            echo "거부: 배포 스크립트가 이 경로를 같은 이름으로 읽지 않습니다: $rel" >&2
            return 2
        fi
        if [ ! -f "${repo}/${rel}" ]; then
            echo "배포 SQL 없음: $rel (요청 이름: $name)" >&2
            missing=1
            continue
        fi
        printf '%s\n' "$rel"
    done
    if [ "$missing" -ne 0 ]; then
        return 3
    fi
    return 0
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
    procedure_deploy_dispatch_list
    exit $?
fi
