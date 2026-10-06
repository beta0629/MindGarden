#!/usr/bin/env bash
# 잡이 쓰는 GitHub Environment 에 required reviewers 보호가 있는지 확인한다.
# 환경이 없을 때 GitHub 는 보호 없는 환경을 자동으로 만들고 바로 실행하므로, DB 접속 전에 이것으로 막는다.
# GH_TOKEN, GITHUB_REPOSITORY 는 환경 변수. 인자는 환경 이름.
set -euo pipefail

name="${1:-}"
[ -n "$name" ] || { echo "::error::environment name is required" >&2; exit 1; }
case "$name" in
  *[!A-Za-z0-9._-]*) echo "::error::environment name has unsupported characters" >&2; exit 1 ;;
esac
[ -n "${GITHUB_REPOSITORY:-}" ] || { echo "::error::GITHUB_REPOSITORY is empty" >&2; exit 1; }

reviewers="$(gh api "repos/${GITHUB_REPOSITORY}/environments/${name}" \
  --jq '[.protection_rules[]? | select(.type == "required_reviewers") | .reviewers[]?] | length')" \
  || { echo "::error::cannot read environment ${name}; refusing" >&2; exit 1; }

case "$reviewers" in
  ''|*[!0-9]*) echo "::error::unexpected reviewer count for ${name}" >&2; exit 1 ;;
esac
if [ "$reviewers" -lt 1 ]; then
  echo "::error::environment ${name} has no required reviewers; refusing before any database connection" >&2
  exit 1
fi
echo "environment ${name}: required reviewers=${reviewers}"
