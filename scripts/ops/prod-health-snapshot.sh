#!/usr/bin/env bash
# DISPOSABLE BRANCH OVERRIDE (cursor/p0-traffic-facts-readonly):
# Redirects the existing ops-health-snapshot SSH upload target to P0 traffic facts.
# NO restart / deploy / kill / cleanup.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "${HERE}/prod-traffic-facts.sh"
