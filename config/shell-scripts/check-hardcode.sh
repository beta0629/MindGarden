#!/usr/bin/env bash
# 저장소 루트에서 하드코딩 검사 (.github/workflows/code-quality-check.yml 과 동일한 node 실행)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

exec node scripts/design-system/css-tools/check-hardcoding-enhanced.js
