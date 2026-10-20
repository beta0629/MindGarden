#!/usr/bin/env bash
# Parse every GitHub Actions workflow YAML with PyYAML; optionally run actionlint.
#
#   bash scripts/verification/check-workflows-yaml.sh
#
# Exit 0 only when all .github/workflows/*.{yml,yaml} parse.
# actionlint: if on PATH (or installed by caller), also run; install failure is
# a warning and does not skip the mandatory YAML parse.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WF_DIR="${ROOT}/.github/workflows"

if [ ! -d "$WF_DIR" ]; then
  echo "::error::workflow dir missing: $WF_DIR"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "::error::python3 required"
  exit 1
fi

echo "🔍 Parsing workflow YAML under ${WF_DIR}"
PARSE_RC=0
PARSE_OUT="$(
  python3 - "$WF_DIR" <<'PY'
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML (yaml) not installed — pip install pyyaml", file=sys.stderr)
    sys.exit(2)

wf_dir = Path(sys.argv[1])
files = sorted(list(wf_dir.glob("*.yml")) + list(wf_dir.glob("*.yaml")))
if not files:
    print(f"ERROR: no workflow files in {wf_dir}", file=sys.stderr)
    sys.exit(1)

failed = 0
for path in files:
    try:
        with path.open(encoding="utf-8") as fh:
            yaml.safe_load(fh)
        print(f"ok - {path.name}")
    except Exception as exc:
        failed += 1
        print(f"FAIL - {path}: {exc}", file=sys.stderr)
        print(f"not ok - {path.name}: {exc}")

if failed:
    print(f"::error::{failed} workflow YAML file(s) failed to parse", file=sys.stderr)
    sys.exit(1)
print(f"✅ all {len(files)} workflow YAML file(s) parsed")
PY
)" || PARSE_RC=$?

printf '%s\n' "$PARSE_OUT"
if [ "$PARSE_RC" -ne 0 ]; then
  exit "$PARSE_RC"
fi

# Best-effort actionlint (run from repo root; no directory arg)
if command -v actionlint >/dev/null 2>&1; then
  echo "🔍 actionlint found — running"
  # shellcheck off; ignore unknown self-hosted runner labels (e.g. deploy)
  (
    cd "$ROOT"
    actionlint -color -shellcheck= -ignore 'label ".+" is unknown'
  ) || {
    echo "::error::actionlint reported issues"
    exit 1
  }
  echo "✅ actionlint OK"
else
  echo "::notice::actionlint not on PATH — YAML parse only (OK)"
fi

exit 0
