#!/usr/bin/env python3
"""
D5 P4 i18n Phase 2 — P0-inv-c5 5차 청크 PR-M 인벤토리 스캐너 (read-only).

6종 패턴 측정:
  P1_hardcoded_string_literal : 변수/return/할당 한국어 문자열 (t() 외)
  P2_props_label_string       : JSX props 한국어 (label/title/placeholder/...)
  P3_jsx_text_content         : >한국어< JSX 본문
  P4_defaultValue_option      : t('key', { defaultValue: '한국어' })
  P5_throw_new_Error          : throw new Error('한국어')
  P6_console_log              : console.* 한국어

산출:
  reports/d5-p4-i18n-inventory-c5-hardcoded-literal-top30-20260526.json (Wave-1 / P1)
  reports/d5-p4-i18n-inventory-c5-props-jsx-top30-20260526.json         (Wave-2 / P2+P3)
  reports/d5-p4-i18n-inventory-c5-throw-error-defaultValue-20260526.json (Wave-3 / P4+P5)
  reports/d5-p4-i18n-inventory-c5-console-log-20260526.json             (Wave-4 / P6)
  reports/d5-p4-i18n-inventory-c5-key-parity-20260526.json              (옵션 / 자동 시드 plan)

게이트: 운영 코드 0줄 수정. ko.json 0줄 수정. write 는 docs/reports 만.
"""
from __future__ import annotations

import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "frontend" / "src"
REPORTS = ROOT / "reports"
LOCALES_KO = ROOT / "frontend" / "src" / "locales" / "ko"

KOREAN_RE = re.compile(r"[\u3131-\u318F\uAC00-\uD7A3]")

EXCLUDE_DIR_PARTS = {"node_modules", "build", "dist", "__tests__", "__mocks__", "locales"}
EXCLUDE_FILENAME_RE = re.compile(r"\.(test|spec|stories)\.(jsx?|tsx?)$")
COMMENT_LINE_RE = re.compile(r"^\s*(//|\*|/\*|#)")

# 6종 패턴 정의
P1_RE = re.compile(
    r"""(?P<prefix>\b(?:const|let|var|return)\b|=|:)\s*(?P<q>['"`])(?P<body>[^'"`\n]*[\u3131-\u318F\uAC00-\uD7A3][^'"`\n]*)(?P=q)""",
    re.MULTILINE,
)
P2_PROP_NAMES = (
    "label",
    "title",
    "placeholder",
    "tooltip",
    "description",
    "name",
    "caption",
    "header",
    "aria-label",
    "alt",
    "text",
    "message",
)
P2_RE = re.compile(
    r"""\b(?P<prop>label|title|placeholder|tooltip|description|name|caption|header|aria-label|alt|text|message)=(?P<q>["'])(?P<body>[^"'\n]*[\u3131-\u318F\uAC00-\uD7A3][^"'\n]*)(?P=q)""",
)
P3_RE = re.compile(
    r""">\s*(?P<body>[^<>{}\n]*[\u3131-\u318F\uAC00-\uD7A3][^<>{}\n]*?)\s*<""",
)
P4_RE = re.compile(
    r"""\bt\(\s*(?P<kq>['"`])(?P<key>[^'"`\n]+)(?P=kq)\s*,\s*\{\s*(?:[^{}]*?,\s*)?defaultValue\s*:\s*(?P<dq>['"`])(?P<dval>[^'"`\n]*[\u3131-\u318F\uAC00-\uD7A3][^'"`\n]*)(?P=dq)""",
)
P5_RE = re.compile(
    r"""\bthrow\s+new\s+(?:[A-Za-z_$][A-Za-z0-9_$]*)?Error\(\s*(?P<q>['"`])(?P<body>[^'"`\n]*[\u3131-\u318F\uAC00-\uD7A3][^'"`\n]*)(?P=q)""",
)
P6_RE = re.compile(
    r"""\bconsole\.(?P<lvl>log|warn|info|debug|error|trace)\(""",
)

# t( 호출 라인 측정 (KPI)
T_CALL_RE = re.compile(r"\bt\(")
USE_TRANSLATION_RE = re.compile(r"\buseTranslation\b")


def list_target_files() -> list[Path]:
    files: list[Path] = []
    for dp, dns, fns in os.walk(SRC):
        # exclude dirs
        rel_parts = Path(dp).relative_to(SRC).parts
        if any(p in EXCLUDE_DIR_PARTS for p in rel_parts):
            dns[:] = []
            continue
        # prune subdirs
        dns[:] = [d for d in dns if d not in EXCLUDE_DIR_PARTS]
        for fn in fns:
            if not fn.endswith((".js", ".jsx", ".ts", ".tsx")):
                continue
            if EXCLUDE_FILENAME_RE.search(fn):
                continue
            files.append(Path(dp) / fn)
    return files


def is_comment_line(line: str) -> bool:
    return bool(COMMENT_LINE_RE.match(line))


def read_text(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def scan_file(path: Path):
    """단일 파일에서 6종 패턴 + KPI 보조 카운트 추출."""
    text = read_text(path)
    if not text:
        return None
    lines = text.splitlines()
    n = len(lines)

    # 결과 초기화
    out = {
        "path": str(path.relative_to(ROOT)),
        "total_lines": n,
        "korean_lines": 0,
        "korean_lines_excl_comment": 0,
        "t_calls": 0,
        "uses_useTranslation": False,
        # patterns
        "P1": {"matches": [], "by_kind": defaultdict(int)},
        "P2": {"matches": [], "by_prop": defaultdict(int)},
        "P3": {"matches": []},
        "P4": {"matches": []},
        "P5": {"matches": []},
        "P6": {"matches": []},  # console.log Korean
    }

    if USE_TRANSLATION_RE.search(text):
        out["uses_useTranslation"] = True

    # 라인별 측정 (한국어 라인 / t( 호출 / 코멘트 분리)
    for idx, line in enumerate(lines, 1):
        has_korean = bool(KOREAN_RE.search(line))
        if has_korean:
            out["korean_lines"] += 1
            if not is_comment_line(line):
                out["korean_lines_excl_comment"] += 1
        if T_CALL_RE.search(line):
            out["t_calls"] += T_CALL_RE.findall(line).__len__() if False else 1
            # 정확한 매칭 카운트 (한 라인에 여러 t() 가능)
            out["t_calls"] += sum(1 for _ in T_CALL_RE.finditer(line)) - 1

    # 패턴별 매칭 (라인 번호 + body 보존)
    for m in P1_RE.finditer(text):
        # find line number
        ln = text.count("\n", 0, m.start()) + 1
        line_str = lines[ln - 1] if 0 < ln <= n else ""
        if is_comment_line(line_str):
            continue
        # P4 (defaultValue) 와 중복 회피 — defaultValue: '한국어' 패턴 제외
        # (P4 를 별도 카운트하고 P1 에서 빼기 위해 키 위치 보정)
        # i18n 자체 fallback 제거 후 잔존 — P1 유효
        # t( 직접 인자: 라인 내 t('...', '한국어') 형태는 P1 에서 제외
        line_pre = line_str[: m.end() - (text.rfind('\n', 0, m.start()) + 1)]
        if re.search(r"\bt\(\s*['\"`][^'\"`]*['\"`]\s*,\s*$", line_pre):
            continue
        # 키 prefix 추출
        prefix = m.group("prefix").strip()
        if prefix == "=":
            kind = "assign"
        elif prefix == "return":
            kind = "return"
        elif prefix in ("const", "let", "var"):
            kind = "decl"
        elif prefix == ":":
            kind = "obj"
        else:
            kind = "other"
        out["P1"]["matches"].append({"line": ln, "kind": kind, "body": m.group("body")[:120]})
        out["P1"]["by_kind"][kind] += 1

    for m in P2_RE.finditer(text):
        ln = text.count("\n", 0, m.start()) + 1
        line_str = lines[ln - 1] if 0 < ln <= n else ""
        if is_comment_line(line_str):
            continue
        prop = m.group("prop")
        out["P2"]["matches"].append({"line": ln, "prop": prop, "body": m.group("body")[:120]})
        out["P2"]["by_prop"][prop] += 1

    for m in P3_RE.finditer(text):
        ln = text.count("\n", 0, m.start()) + 1
        line_str = lines[ln - 1] if 0 < ln <= n else ""
        if is_comment_line(line_str):
            continue
        body = m.group("body").strip()
        if not body:
            continue
        # 단일 자모만 / 공백 / 의미 없음 컷
        if not KOREAN_RE.search(body):
            continue
        out["P3"]["matches"].append({"line": ln, "body": body[:120]})

    for m in P4_RE.finditer(text):
        ln = text.count("\n", 0, m.start()) + 1
        line_str = lines[ln - 1] if 0 < ln <= n else ""
        if is_comment_line(line_str):
            continue
        col = m.start() - (text.rfind("\n", 0, m.start()) + 1) + 1
        out["P4"]["matches"].append(
            {
                "line": ln,
                "column": col,
                "key": m.group("key"),
                "fallback": m.group("dval"),
            }
        )

    for m in P5_RE.finditer(text):
        ln = text.count("\n", 0, m.start()) + 1
        line_str = lines[ln - 1] if 0 < ln <= n else ""
        if is_comment_line(line_str):
            continue
        col = m.start() - (text.rfind("\n", 0, m.start()) + 1) + 1
        out["P5"]["matches"].append(
            {"line": ln, "column": col, "body": m.group("body")[:160]}
        )

    # P6 — console.* 한국어 (멀티라인 인자 가능 → 라인 단위 + 인접 라인 결합)
    for m in P6_RE.finditer(text):
        ln = text.count("\n", 0, m.start()) + 1
        # 함수 인자 닫는 ')' 또는 다음 5라인까지 결합
        chunk_start = m.start()
        depth = 0
        chunk_end = chunk_start
        for i, ch in enumerate(text[chunk_start : chunk_start + 1500]):
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
                if depth == 0:
                    chunk_end = chunk_start + i + 1
                    break
            if i > 1499:
                chunk_end = chunk_start + i + 1
                break
        chunk = text[chunk_start:chunk_end] if chunk_end > chunk_start else text[chunk_start : chunk_start + 200]
        if KOREAN_RE.search(chunk):
            line_str = lines[ln - 1] if 0 < ln <= n else ""
            if is_comment_line(line_str):
                continue
            col = m.start() - (text.rfind("\n", 0, m.start()) + 1) + 1
            out["P6"]["matches"].append(
                {"line": ln, "column": col, "level": m.group("lvl"), "snippet": chunk[:160].replace("\n", " ⏎ ")}
            )

    return out


def aggregate(per_file: list[dict]) -> dict:
    total = {
        "files_scanned": len(per_file),
        "files_with_korean": 0,
        "korean_lines_total": 0,
        "korean_lines_excl_comment_total": 0,
        "t_calls_total": 0,
        "useTranslation_files": 0,
        "P1_total": 0,
        "P2_total": 0,
        "P3_total": 0,
        "P4_total": 0,
        "P5_total": 0,
        "P6_total": 0,
        "P1_files": 0,
        "P2_files": 0,
        "P3_files": 0,
        "P4_files": 0,
        "P5_files": 0,
        "P6_files": 0,
    }
    for f in per_file:
        if f["korean_lines"] > 0:
            total["files_with_korean"] += 1
        total["korean_lines_total"] += f["korean_lines"]
        total["korean_lines_excl_comment_total"] += f["korean_lines_excl_comment"]
        total["t_calls_total"] += f["t_calls"]
        if f["uses_useTranslation"]:
            total["useTranslation_files"] += 1
        for p in ("P1", "P2", "P3", "P4", "P5", "P6"):
            cnt = len(f[p]["matches"])
            total[f"{p}_total"] += cnt
            if cnt > 0:
                total[f"{p}_files"] += 1
    return total


def top_files(per_file: list[dict], pattern_key: str, n=50, extra_keys=None):
    rows = []
    for f in per_file:
        cnt = len(f[pattern_key]["matches"])
        if cnt == 0:
            continue
        row = {"path": f["path"], "matches": cnt}
        if extra_keys and extra_keys.get("by_kind") and pattern_key == "P1":
            row["by_kind"] = dict(f["P1"]["by_kind"])
        if extra_keys and extra_keys.get("by_prop") and pattern_key == "P2":
            row["by_prop"] = dict(f["P2"]["by_prop"])
        rows.append(row)
    rows.sort(key=lambda x: -x["matches"])
    return rows[:n]


def coverage(top_rows, total):
    out = []
    cum = 0
    for cutoff in (10, 20, 30, 50, 80, 100, 150):
        if cutoff > len(top_rows) and cutoff > 30:
            break
        sub = top_rows[:cutoff]
        s = sum(r["matches"] for r in sub)
        if total > 0:
            out.append({"cutoff": f"Top-{cutoff}", "files": min(cutoff, len(sub)), "matches": s, "coverage_pct": round(100 * s / total, 2)})
    return out


def write_json(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    files = list_target_files()
    print(f"[scan] target files = {len(files)}", file=sys.stderr)
    per_file = []
    for i, p in enumerate(files):
        r = scan_file(p)
        if r is not None:
            # 수동 보정: P1 by_kind 를 dict 로
            r["P1"]["by_kind"] = dict(r["P1"]["by_kind"])
            r["P2"]["by_prop"] = dict(r["P2"]["by_prop"])
            per_file.append(r)
        if (i + 1) % 200 == 0:
            print(f"[scan]   processed {i + 1}/{len(files)}", file=sys.stderr)

    agg = aggregate(per_file)
    print(json.dumps(agg, ensure_ascii=False, indent=2), file=sys.stderr)

    REPORTS.mkdir(exist_ok=True)
    DATE = "2026-05-26"

    # ── 산출물 1: P1 hardcoded literal Top-30 ────────────────────────────
    p1_top50 = top_files(per_file, "P1", n=50, extra_keys={"by_kind": True})
    p1_top30 = p1_top50[:30]
    p1_total = agg["P1_total"]
    p1_cov = coverage(p1_top50, p1_total)
    p1_doc = {
        "measured_at": DATE,
        "develop_sha": "982f91252",
        "main_sha": "a68886273",
        "pattern": "P1_hardcoded_string_literal",
        "definition": "변수/return/할당 한국어 문자열 (t() / props label / jsx text 제외)",
        "regex": (
            r"(?:^|[\s,;{(\[])(?:const|let|var|return|=|:)\s*(['\"`])"
            r"([^'\"`\n]*[\u3131-\u318F\uAC00-\uD7A3][^'\"`\n]*)\1"
        ),
        "total_matches": p1_total,
        "affected_files": agg["P1_files"],
        "top30_files": p1_top30,
        "top50_files": p1_top50,
        "coverage": p1_cov,
        "wave1_target_lines": sum(r["matches"] for r in p1_top30),
        "by_kind_total": _sum_kind(per_file, "P1", "by_kind"),
    }
    write_json(REPORTS / f"d5-p4-i18n-inventory-c5-hardcoded-literal-top30-{DATE.replace('-', '')}.json", p1_doc)

    # ── 산출물 2: P2 + P3 props/jsx Top-30 ─────────────────────────────
    p2_top30 = top_files(per_file, "P2", n=30, extra_keys={"by_prop": True})
    p3_top30 = top_files(per_file, "P3", n=30)
    p2_total = agg["P2_total"]
    p3_total = agg["P3_total"]
    # 통합 (파일별 P2+P3 합산)
    combined = []
    for f in per_file:
        c = len(f["P2"]["matches"]) + len(f["P3"]["matches"])
        if c > 0:
            combined.append(
                {
                    "path": f["path"],
                    "matches": c,
                    "P2": len(f["P2"]["matches"]),
                    "P3": len(f["P3"]["matches"]),
                    "by_prop": dict(f["P2"]["by_prop"]),
                }
            )
    combined.sort(key=lambda x: -x["matches"])
    cb_top50 = combined[:50]
    cb_total = p2_total + p3_total

    p2p3_doc = {
        "measured_at": DATE,
        "develop_sha": "982f91252",
        "main_sha": "a68886273",
        "patterns": ["P2_props_label_string", "P3_jsx_text_content"],
        "P2_total": p2_total,
        "P2_affected_files": agg["P2_files"],
        "P3_total": p3_total,
        "P3_affected_files": agg["P3_files"],
        "combined_total": cb_total,
        "combined_top30": cb_top50[:30],
        "combined_top50": cb_top50,
        "coverage_combined": coverage(cb_top50, cb_total),
        "props_kind_distribution": _sum_props(per_file),
        "P2_top30_files": p2_top30,
        "P3_top30_files": p3_top30,
        "wave2_target_lines": sum(r["matches"] for r in cb_top50[:30]),
    }
    write_json(REPORTS / f"d5-p4-i18n-inventory-c5-props-jsx-top30-{DATE.replace('-', '')}.json", p2p3_doc)

    # ── 산출물 3: P4 + P5 throw error / defaultValue ────────────────────
    p4_locations = []
    for f in per_file:
        for m in f["P4"]["matches"]:
            p4_locations.append(
                {
                    "path": f["path"],
                    "line": m["line"],
                    "column": m["column"],
                    "key": m["key"],
                    "fallback_korean": m["fallback"],
                }
            )
    p5_locations = []
    for f in per_file:
        for m in f["P5"]["matches"]:
            p5_locations.append(
                {
                    "path": f["path"],
                    "line": m["line"],
                    "column": m["column"],
                    "message": m["body"],
                }
            )
    p5_top30 = top_files(per_file, "P5", n=30)
    # fallback 보존 권고: utils/paymentGateway/socialLogin SDK 미초기화 시점
    fallback_keep_re = re.compile(r"(payment|paymentGateway|socialLogin|sdk|bootstrap|ssr|hydrate|i18nBootstrap)", re.I)
    keep_recommend = [loc for loc in p5_locations if fallback_keep_re.search(loc["path"])]

    p4p5_doc = {
        "measured_at": DATE,
        "develop_sha": "982f91252",
        "main_sha": "a68886273",
        "patterns": ["P4_defaultValue_option", "P5_throw_new_Error"],
        "P4_total": agg["P4_total"],
        "P4_affected_files": agg["P4_files"],
        "P4_locations": p4_locations,
        "P5_total": agg["P5_total"],
        "P5_affected_files": agg["P5_files"],
        "P5_top30_files": p5_top30,
        "P5_locations_sample": p5_locations[:120],
        "P5_locations_full_count": len(p5_locations),
        "key_prefix_policy": {
            "policy_ref": "§C12=a (error namespace 키 추출)",
            "rule": "에러 메시지를 'error:<domain>.<sub>' 키로 추출. 사용자 노출 메시지는 i18n 흡수, SDK 미초기화 시점 fallback 영구 보존.",
            "namespace_target": "error",
        },
        "fallback_keep_recommendations": keep_recommend,
        "fallback_keep_count": len(keep_recommend),
    }
    write_json(REPORTS / f"d5-p4-i18n-inventory-c5-throw-error-defaultValue-{DATE.replace('-', '')}.json", p4p5_doc)

    # ── 산출물 4: P6 console.log ─────────────────────────────────────
    p6_locations = []
    for f in per_file:
        for m in f["P6"]["matches"]:
            p6_locations.append(
                {
                    "path": f["path"],
                    "line": m["line"],
                    "column": m["column"],
                    "level": m["level"],
                    "snippet": m["snippet"],
                }
            )
    p6_top30 = top_files(per_file, "P6", n=30)
    by_level = defaultdict(int)
    for loc in p6_locations:
        by_level[loc["level"]] += 1

    p6_doc = {
        "measured_at": DATE,
        "develop_sha": "982f91252",
        "main_sha": "a68886273",
        "pattern": "P6_console_log",
        "policy_ref": "§C11=b (KPI 측정 제외 산식)",
        "policy": (
            "console.* 한국어 메시지는 KPI 한국어 라인 측정에서 제외 (개발자 디버그 로그). "
            "PR-M Wave-4 는 변경 0건 (검증 only) — 정책 정착 후 별도 라운드에서 i18n 흡수 결정."
        ),
        "kpi_exclusion_formula": (
            "korean_lines_for_kpi = korean_lines_excl_comment - P6_total - "
            "(throw_new_Error.SDK_init 면제분)"
        ),
        "total_matches": agg["P6_total"],
        "affected_files": agg["P6_files"],
        "by_level": dict(by_level),
        "top30_files": p6_top30,
        "locations_sample": p6_locations[:120],
        "locations_full_count": len(p6_locations),
    }
    write_json(REPORTS / f"d5-p4-i18n-inventory-c5-console-log-{DATE.replace('-', '')}.json", p6_doc)

    # ── 산출물 5: key parity (옵션, 자동 시드 plan) ────────────────────
    ko_keys = _load_ko_keys()
    seed_plan = _build_seed_plan(per_file, ko_keys)
    parity_doc = {
        "measured_at": DATE,
        "develop_sha": "982f91252",
        "ko_total_leaves": ko_keys["total_leaves"],
        "ko_namespaces": ko_keys["namespaces"],
        "seed_required_total": seed_plan["seed_total"],
        "seed_by_namespace": seed_plan["seed_by_ns"],
        "seed_estimate_after_pr_m": seed_plan["seed_estimate_after_pr_m"],
        "ko_leaves_after_seed_estimate": ko_keys["total_leaves"] + seed_plan["seed_estimate_after_pr_m"],
        "seed_plan_sample": seed_plan["sample"],
        "seed_policy": (
            "P1/P2/P3 Wave 흡수 시 신규 t() 키 추정 (각 매칭 라인 = 1 신규 키, "
            "동일 fallback 텍스트 dedup). PR-L Wave-1 답습 — mode-resolved 자동 시드."
        ),
    }
    write_json(REPORTS / f"d5-p4-i18n-inventory-c5-key-parity-{DATE.replace('-', '')}.json", parity_doc)

    # ── 종합 메트릭 (stderr) ──────────────────────────────────────
    summary = {
        "files_scanned": agg["files_scanned"],
        "korean_lines_total": agg["korean_lines_total"],
        "korean_lines_excl_comment_total": agg["korean_lines_excl_comment_total"],
        "korean_lines_kpi_excl_console": agg["korean_lines_excl_comment_total"] - agg["P6_total"],
        "t_calls_total": agg["t_calls_total"],
        "useTranslation_files": agg["useTranslation_files"],
        "P1_total": agg["P1_total"],
        "P2_total": agg["P2_total"],
        "P3_total": agg["P3_total"],
        "P4_total": agg["P4_total"],
        "P5_total": agg["P5_total"],
        "P6_total": agg["P6_total"],
        "ko_total_leaves": ko_keys["total_leaves"],
    }
    print("=== SUMMARY ===", file=sys.stderr)
    print(json.dumps(summary, ensure_ascii=False, indent=2), file=sys.stderr)
    # stdout: machine-readable
    print(json.dumps(summary, ensure_ascii=False))


def _sum_kind(per_file, pkey, akey):
    out = defaultdict(int)
    for f in per_file:
        for k, v in f[pkey][akey].items():
            out[k] += v
    return dict(out)


def _sum_props(per_file):
    out = defaultdict(int)
    for f in per_file:
        for k, v in f["P2"]["by_prop"].items():
            out[k] += v
    return dict(sorted(out.items(), key=lambda x: -x[1]))


def _load_ko_keys():
    ns = {}
    total = 0

    def cnt_leaves(d):
        if isinstance(d, dict):
            return sum(cnt_leaves(v) for v in d.values())
        return 1

    if not LOCALES_KO.exists():
        return {"total_leaves": 0, "namespaces": {}}
    for jp in sorted(LOCALES_KO.glob("*.json")):
        with jp.open(encoding="utf-8") as f:
            try:
                d = json.load(f)
            except Exception:
                d = {}
        c = cnt_leaves(d) if isinstance(d, dict) else 1
        ns[jp.stem] = c
        total += c
    return {"total_leaves": total, "namespaces": ns}


def _build_seed_plan(per_file, ko_keys):
    """P1+P2+P3+P4+P5 매칭 한국어 텍스트 → 신규 키 시드 추정.
    중복 dedup (텍스트 기준) 후 namespace 추정 (admin/common 분배).
    """
    texts = set()
    by_ns_estimate = defaultdict(int)
    sample = []
    sample_seen = 0
    for f in per_file:
        path = f["path"]
        # namespace heuristic
        if "/admin/" in path:
            ns = "admin"
        elif "/erp/" in path:
            ns = "erp"
        elif "/auth/" in path:
            ns = "auth"
        elif "/settings/" in path or "Settings" in path:
            ns = "settings"
        elif "/report" in path or "Report" in path:
            ns = "report"
        elif "/statistics" in path or "Statistics" in path:
            ns = "statistics"
        elif "/schedule" in path or "Schedule" in path:
            ns = "schedule"
        else:
            ns = "common"
        for p in ("P1", "P2", "P3"):
            for m in f[p]["matches"]:
                body = (m.get("body") or "").strip()
                if not body or len(body) > 200:
                    continue
                key = (ns, body)
                if key in texts:
                    continue
                texts.add(key)
                by_ns_estimate[ns] += 1
                if sample_seen < 60:
                    sample.append({"namespace": ns, "text": body[:120], "source_path": path, "pattern": p, "line": m.get("line")})
                    sample_seen += 1
        for m in f["P4"]["matches"]:
            key = (ns, m.get("fallback") or "")
            if key in texts or not key[1]:
                continue
            texts.add(key)
            by_ns_estimate[ns] += 1
        for m in f["P5"]["matches"]:
            key = ("error", (m.get("body") or "").strip())
            if key in texts or not key[1]:
                continue
            texts.add(key)
            by_ns_estimate["error"] += 1

    return {
        "seed_total": len(texts),
        "seed_by_ns": dict(sorted(by_ns_estimate.items(), key=lambda x: -x[1])),
        "seed_estimate_after_pr_m": len(texts),
        "sample": sample,
    }


if __name__ == "__main__":
    main()
