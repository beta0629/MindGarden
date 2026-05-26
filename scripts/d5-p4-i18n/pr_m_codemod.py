#!/usr/bin/env python3
"""D5 P4 i18n Phase 2 — PR-M Wave-1/2/3 통합 codemod (자동 시드 + t() 치환).

본 스크립트는 P0-inv-c5 인벤토리(`reports/d5-p4-i18n-inventory-c5-*.json`) 기반으로
세 Wave 의 codemod 를 한 번에 정의하고, --wave {1,2,3} 옵션으로 단일 Wave 만 실행한다.

설계 원칙
=========
1. **deterministic key**: Korean 텍스트 → `<prefix>.txt_<sha1[:8]>` 의 안정 슬러그.
   동일 텍스트는 동일 키로 dedup. ko.json 사전 시드 후 `t('ns:key')` (fallback 없음).
2. **namespace 매핑**: 파일 경로 기반.
     - `frontend/src/components/admin/**`         → namespace=admin, prefix=admin.<file>
     - `frontend/src/components/erp/**`           → namespace=erp,   prefix=erp.<file>
     - `frontend/src/components/auth/**`          → namespace=auth,  prefix=auth.<file>
     - `frontend/src/utils/**` `frontend/src/constants/**`
                                                  → namespace=common, prefix=utils.<file>
     - 그 외 components/{schedule,client,consultant,common,...}
                                                  → namespace=common, prefix=<dir>.<file>
3. **import 정책**:
     - JSX 가 있는 파일 (React 컴포넌트) → `useTranslation` 훅 주입.
     - utils/constants 는 `import i18n from '../../../i18n'` (lazy `i18n.t`).
4. **안전 치환**: 라인 단위 정규식 매칭, 컨텍스트 마스크(주석/문자열) 통과 검증.
5. **데이터 안전 가드**: 다음 파일들은 SKIP — 데이터 테이블 (holidays / status maps)
   기계적 i18n 흡수 시 module-load 시점 i18n 미초기화 위험.

게이트
=====
- 운영 코드 (`frontend/src/**`) 만 수정.
- `frontend/src/i18n/index.js` 무수정.
- `frontend/src/locales/ko/*.json` 키 시드만 (기존 키 무수정).
- 1~4차 청크 정착물 보존.

실행
====
    python3 scripts/d5-p4-i18n/pr_m_codemod.py --wave 1
    python3 scripts/d5-p4-i18n/pr_m_codemod.py --wave 2
    python3 scripts/d5-p4-i18n/pr_m_codemod.py --wave 3
    python3 scripts/d5-p4-i18n/pr_m_codemod.py --wave 1 --dry-run

Wave-1: P1 hardcoded literal Top-50  → variable / return / object value Korean 흡수
Wave-2: P2/P3 Top-50 (combined)      → JSX text + JSX props 한국어 흡수
Wave-3: P5 throw_new_Error 44 흡수   → throw new Error(t('error:...'))

@author Core Coder (PR-M)
@since 2026-05-26
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from collections import OrderedDict, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "frontend" / "src"
LOCALES_KO = ROOT / "frontend" / "src" / "locales" / "ko"
REPORTS = ROOT / "reports"

DATE = "20260526"

INV_P1 = REPORTS / f"d5-p4-i18n-inventory-c5-hardcoded-literal-top30-{DATE}.json"
INV_P2P3 = REPORTS / f"d5-p4-i18n-inventory-c5-props-jsx-top30-{DATE}.json"
INV_P4P5 = REPORTS / f"d5-p4-i18n-inventory-c5-throw-error-defaultValue-{DATE}.json"

KOREAN_RE = re.compile(r"[\u3131-\u318F\uAC00-\uD7A3]")
COMMENT_LINE_RE = re.compile(r"^\s*(//|\*|/\*|#)")

# 데이터 테이블 가드 — 기계적 흡수 시 module-load 시점 i18n 미초기화로 위험.
# 본 PR-M Wave-1 에서 SKIP, 별도 라운드에서 lazy 호출로 해결 권고.
SKIP_FILES = {
    "frontend/src/utils/krPublicHolidays.js",  # 공휴일 데이터 테이블 (96 lines, ISO key → name)
    "frontend/src/constants/schedule.js",  # status 라벨 데이터 (이미 getCommonCodes 로 마이그레이션 중)
    "frontend/src/constants/charts.js",  # 차트 색상 + status 라벨 (마이그레이션 중)
    "frontend/src/constants/codeHelperStrings.js",  # 코드헬퍼 라벨 (작은 데이터 + getCommonCodes)
    "frontend/src/constants/notificationChannelPreference.js",  # 채널 라벨 데이터
    "frontend/src/constants/mapping.js",  # 매핑 라벨 데이터
}


# ──────────────────── 유틸 ────────────────────
def slug_for(text: str) -> str:
    """Korean 텍스트 → 안정 슬러그 (sha1 8자)."""
    h = hashlib.sha1(text.encode("utf-8")).hexdigest()[:8]
    return f"t_{h}"


def classify_namespace(rel: str) -> tuple[str, str]:
    """파일 경로 → (namespace, key_prefix)."""
    parts = rel.replace("\\", "/").split("/")
    # frontend/src/{...}
    sub = parts[2:] if len(parts) > 2 else parts
    if not sub:
        return ("common", "common")
    head = sub[0]
    fname = Path(rel).stem  # without extension

    if head == "components" and len(sub) >= 2:
        sub_head = sub[1]
        if sub_head == "admin":
            return ("admin", f"{fname}")
        if sub_head == "erp":
            return ("erp", f"{fname}")
        if sub_head == "auth":
            return ("auth", f"{fname}")
        if sub_head == "schedule":
            return ("schedule", f"{fname}")
        if sub_head == "report":
            return ("report", f"{fname}")
        if sub_head == "statistics":
            return ("statistics", f"{fname}")
        if sub_head == "settings":
            return ("settings", f"{fname}")
        # dashboard / dashboard-v2 / consultant / client / tenant / super-admin / ops /
        # compliance / common / ui / academy / homepage / clinical / mypage / test / ...
        return ("common", f"{sub_head}.{fname}")
    if head == "pages" and len(sub) >= 2:
        return ("common", f"pages.{sub[1]}.{fname}")
    if head in ("utils", "constants", "store", "hooks", "contexts"):
        return ("common", f"{head}.{fname}")
    if head == "api":
        return ("common", f"api.{fname}")
    return ("common", f"misc.{fname}")


def detect_jsx(source: str) -> bool:
    """파일에 JSX 가 포함되는지 휴리스틱 판정.
    React import + (any of: opening tag, self-closing tag, JSX fragment).
    """
    if not re.search(r"\bfrom\s+['\"]react['\"]", source) and "React" not in source[:1000]:
        return False
    # Multi-line / self-closing: <Tag prop={...} />
    if re.search(r"<[A-Z][A-Za-z0-9_]*[\s\n][\s\S]{0,400}?/>", source):
        return True
    if re.search(r"<[a-zA-Z][a-zA-Z0-9_-]*[\s\n][^/>]{0,200}>", source, re.DOTALL):
        return True
    if re.search(r"</[A-Za-z]", source):
        return True
    if re.search(r"<>", source) and re.search(r"</>", source):
        return True
    return False


def build_context_mask(source: str) -> list[str]:
    """주석/문자열 위치를 마킹 — ' '=code, 'C'=comment, 'S'=string."""
    n = len(source)
    mask = [" "] * n
    i = 0
    in_single = in_double = in_tpl = False
    in_line = in_block = False
    tpl_brace = 0
    while i < n:
        c = source[i]
        c2 = source[i:i + 2]
        if in_line:
            mask[i] = "C"
            if c == "\n":
                in_line = False
            i += 1
            continue
        if in_block:
            mask[i] = "C"
            if c2 == "*/":
                mask[i + 1] = "C"
                in_block = False
                i += 2
                continue
            i += 1
            continue
        if in_single:
            mask[i] = "S"
            if c == "\\":
                if i + 1 < n:
                    mask[i + 1] = "S"
                i += 2
                continue
            if c == "'":
                in_single = False
            i += 1
            continue
        if in_double:
            mask[i] = "S"
            if c == "\\":
                if i + 1 < n:
                    mask[i + 1] = "S"
                i += 2
                continue
            if c == '"':
                in_double = False
            i += 1
            continue
        if in_tpl:
            if tpl_brace > 0:
                if c == "{":
                    tpl_brace += 1
                elif c == "}":
                    tpl_brace -= 1
                i += 1
                continue
            mask[i] = "S"
            if c == "\\":
                if i + 1 < n:
                    mask[i + 1] = "S"
                i += 2
                continue
            if c2 == "${":
                tpl_brace = 1
                mask[i + 1] = "S"
                i += 2
                continue
            if c == "`":
                in_tpl = False
            i += 1
            continue
        if c2 == "//":
            in_line = True
            mask[i] = "C"
            mask[i + 1] = "C"
            i += 2
            continue
        if c2 == "/*":
            in_block = True
            mask[i] = "C"
            mask[i + 1] = "C"
            i += 2
            continue
        if c == "'":
            in_single = True
            mask[i] = "S"
            i += 1
            continue
        if c == '"':
            in_double = True
            mask[i] = "S"
            i += 1
            continue
        if c == "`":
            in_tpl = True
            mask[i] = "S"
            i += 1
            continue
        i += 1
    return mask


def is_inside_t_call(source: str, idx: int) -> bool:
    head = source[max(0, idx - 800): idx]
    if re.search(r"\bt\s*\(\s*$", head):
        return True
    if re.search(r"\bt\s*\(\s*['\"`][^'\"`]*['\"`]\s*,\s*$", head):
        return True
    if re.search(r"\bi18n\s*\.\s*t\s*\(\s*$", head):
        return True
    return False


def is_inside_console_or_throw(source: str, idx: int) -> bool:
    head = source[max(0, idx - 400): idx]
    if re.search(r"\bconsole\s*\.\s*(log|error|warn|info|debug|trace)\s*\([^()]*$", head):
        return True
    return False


def is_inside_throw_error(source: str, idx: int) -> bool:
    head = source[max(0, idx - 200): idx]
    return bool(re.search(r"\bthrow\s+new\s+Error\s*\(\s*$", head))


def line_of(source: str, idx: int) -> int:
    return source.count("\n", 0, idx) + 1


def line_str(source: str, ln: int) -> str:
    lines = source.splitlines()
    if 1 <= ln <= len(lines):
        return lines[ln - 1]
    return ""


# ──────────────────── ko.json 시드 ────────────────────
def load_ns(ns: str) -> OrderedDict:
    p = LOCALES_KO / f"{ns}.json"
    if not p.exists():
        return OrderedDict()
    with p.open(encoding="utf-8") as f:
        return json.load(f, object_pairs_hook=OrderedDict)


def save_ns(ns: str, data: OrderedDict):
    p = LOCALES_KO / f"{ns}.json"
    with p.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def set_nested(data: OrderedDict, key_path: str, value: str) -> bool:
    """key_path = 'a.b.c' → data['a']['b']['c'] = value. 신설 시 True, 기존 시 False."""
    parts = key_path.split(".")
    cur = data
    for p in parts[:-1]:
        if p not in cur or not isinstance(cur[p], (dict, OrderedDict)):
            cur[p] = OrderedDict()
        cur = cur[p]
    last = parts[-1]
    if last in cur and isinstance(cur[last], str):
        return False  # 기존 키 (덮어쓰기 금지)
    cur[last] = value
    return True


# ──────────────────── 패턴 정의 ────────────────────
P1_RE = re.compile(
    r"(?P<prefix>\b(?:const|let|var|return)\b|=|:|,|\?|\&\&|\|\||\()\s*"
    r"(?P<q>['\"`])(?P<body>[^'\"`\n]*[\u3131-\u318F\uAC00-\uD7A3][^'\"`\n]*)(?P=q)",
    re.MULTILINE,
)

# JSX text content: >text<
P3_RE = re.compile(
    r">(?P<lead>\s*)(?P<body>[^<>{}\n]*[\u3131-\u318F\uAC00-\uD7A3][^<>{}\n]*?)(?P<trail>\s*)<",
)

# JSX props
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

# attr="text" / attr='text' / attr={'text'} / attr={"text"}
def make_p2_re():
    alt = "|".join(re.escape(p) for p in P2_PROP_NAMES)
    # (a) attr="..." or attr='...'
    re_q = re.compile(
        rf"\b(?P<prop>{alt})=(?P<q>['\"])(?P<body>[^'\"\\n]*[\u3131-\u318F\uAC00-\uD7A3][^'\"\\n]*)(?P=q)",
    )
    # (b) attr={'...'} or attr={"..."}
    re_b = re.compile(
        rf"\b(?P<prop>{alt})=\{{\s*(?P<q>['\"])(?P<body>[^'\"\\n]*[\u3131-\u318F\uAC00-\uD7A3][^'\"\\n]*)(?P=q)\s*\}}",
    )
    return re_q, re_b


P2_Q_RE, P2_B_RE = make_p2_re()

P5_RE = re.compile(
    r"\bthrow\s+new\s+Error\(\s*(?P<q>['\"`])(?P<body>[^'\"`\n]*[\u3131-\u318F\uAC00-\uD7A3][^'\"`\n]*)(?P=q)",
)


# ──────────────────── Wave-3 throw error namespace key ────────────────────
def error_key_for(rel: str, line_num: int, body: str) -> str:
    """frontend/src/utils/foo.js:line → error.<file>.txt_<hash>"""
    fname = Path(rel).stem
    sub = slug_for(body)
    # 도메인 prefix 결정
    parts = rel.split("/")
    if "components" in parts:
        idx = parts.index("components")
        if idx + 1 < len(parts):
            domain = parts[idx + 1]
        else:
            domain = "components"
    elif "utils" in parts:
        domain = "utils"
    elif "constants" in parts:
        domain = "constants"
    elif "api" in parts:
        domain = "api"
    else:
        domain = "misc"
    return f"{domain}.{fname}.{sub}"


# ──────────────────── 함수 본문 컨텍스트 추적 ────────────────────
def find_function_body_spans(source: str):
    """모든 함수/메서드/화살표 함수 본문 (open `{` ~ matching `}`)."""
    spans = []
    patterns = [
        # function Name(...) {
        r"\bfunction\s*\*?\s*[A-Za-z_$][A-Za-z0-9_$]*\s*\([^)]*\)\s*\{",
        # function (...) {  -- anonymous
        r"\bfunction\s*\*?\s*\([^)]*\)\s*\{",
        # (args) => {  or  arg => {
        r"(?:\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*)\s*=>\s*\{",
        # method(...) { inside class/object — 메서드 단축 정의
        # ex) myMethod(arg, arg2) { ... } — but careful w/ false positives
        # 우리는 함수 키워드/화살표 만 트랙하면 충분
    ]
    for pat in patterns:
        for m in re.finditer(pat, source):
            open_idx = m.start() + len(m.group(0)) - 1
            close = find_matching_close(source, open_idx)
            if close > 0:
                spans.append((open_idx, close))
    spans.sort(key=lambda s: s[0])
    return spans


def is_inside_function(idx: int, spans) -> bool:
    for s, e in spans:
        if s < idx < e:
            return True
    return False


# ──────────────────── Wave-1 P1 흡수 ────────────────────
def wave1_process_file(rel: str, source: str, dry: bool):
    """함수/메서드 본문 안 한국어 string → t('ns:prefix.txt_hash').
    데이터 테이블 (module-level const) 은 SKIP — i18n 미초기화 위험.
    JSX 컨텍스트는 Wave-2 가 담당하므로 P1 매칭에서 JSX text/prop 직접 매칭은 회피.
    """
    if rel in SKIP_FILES:
        return None  # 데이터 테이블 SKIP
    ns, prefix = classify_namespace(rel)
    is_jsx = detect_jsx(source)
    mask = build_context_mask(source)
    fn_spans = find_function_body_spans(source)
    component_bodies = find_component_bodies(source)
    component_spans = []
    for cb in component_bodies:
        cclose = find_matching_close(source, cb["open"])
        if cclose > 0:
            component_spans.append((cb["open"], cclose))
    edits = []
    seeds = OrderedDict()  # body → key suffix
    used_i18n = False
    used_useTranslation = False

    for m in P1_RE.finditer(source):
        body = m.group("body").strip()
        if not body:
            continue
        if not KOREAN_RE.search(body):
            continue
        ln = line_of(source, m.start())
        ls = line_str(source, ln)
        if COMMENT_LINE_RE.match(ls):
            continue
        text_start = m.start("body")
        if mask[text_start] != "S":
            continue
        # 안전 가드: 함수 본문 내부만 흡수 — module-level data (const/let/var 객체값)
        # 흡수 시 i18n 미초기화 위험. 본 가드로 SKIP.
        if not is_inside_function(text_start, fn_spans):
            continue
        if is_inside_t_call(source, text_start):
            continue
        if is_inside_console_or_throw(source, text_start):
            continue
        if is_inside_throw_error(source, text_start):
            continue  # Wave-3
        # JSX prop 직접 매칭 회피 (Wave-2 담당) — `=` 직후 quote 이고 직전이 [A-Za-z\-_0-9]
        # 인 경우 JSX attribute (e.g. `placeholder="..."`, `ariaLabel="..."`, `aria-label="..."`).
        # 단순 변수 할당 (`var x = '..'`) 은 `=` 직전이 공백이므로 안전.
        prefix_str = m.group("prefix")
        if prefix_str == "=" and m.start() > 0:
            prev_char = source[m.start() - 1]
            if prev_char.isalnum() or prev_char in ("-", "_"):
                continue
        # JSX text `>한국어<` 회피
        if re.search(r">\s*$", source[max(0, m.start() - 5): m.start()]):
            continue
        # 객체 KEY 위치 회피: `... '한국어': value` — 닫는 quote 다음 즉시 `:` 면 KEY.
        # ',' / '{' 이후 등장하는 string 이 key 인 경우 발생.
        after = source[m.end(): m.end() + 8]
        if re.match(r"\s*:", after):
            continue
        # JSX 컨텍스트 안 ({ ... }) 의 expression 텍스트는 OK (mode === 'create' ? '...' : '...')
        # 슬러그
        slug = slug_for(body)
        full_key = f"{prefix}.{slug}"
        seeds[(full_key, body)] = True
        # 위치 분류:
        # - 컴포넌트 본문 (PascalCase) → t('ns:key') (useTranslation hook 주입)
        # - 그 외 함수 본문 (helper) → i18n.t('ns:key') (lazy import)
        # - utils/constants/api → 항상 i18n.t (component 가 없음)
        is_util_path = (
            rel.startswith("frontend/src/utils/")
            or rel.startswith("frontend/src/constants/")
            or rel.startswith("frontend/src/api/")
        )
        in_component = any(s < text_start < e for s, e in component_spans)
        if is_util_path or not in_component:
            replacement = f"i18n.t('{ns}:{full_key}')"
            used_i18n = True
        else:
            replacement = f"t('{ns}:{full_key}')"
            used_useTranslation = True
        # 원래 인용부호까지 (q + body + q) 치환
        edits.append(
            {
                "start": m.start("q"),
                "end": m.end("q") + 0,  # 끝 q 까지: m.start("body")-1 가 q, m.end("body")이 끝 q 시작
            }
        )
        # 정확한 끝 인용부호 위치 — m.end() 가 정답 (전체 매칭 끝)
        edits[-1]["end"] = m.end()
        # 정확한 시작 — 첫 q 위치
        # m.start("q") 는 첫 q 위치
        edits[-1]["replacement"] = replacement
        edits[-1]["text"] = body
        edits[-1]["key"] = full_key
        edits[-1]["ns"] = ns

    if not edits:
        return None

    # 중복 제거 (위치 겹침)
    edits.sort(key=lambda e: e["start"])
    accepted = []
    last_end = -1
    for e in edits:
        if e["start"] < last_end:
            continue
        accepted.append(e)
        last_end = e["end"]

    # 적용 (역순)
    out = source
    for e in reversed(accepted):
        out = out[: e["start"]] + e["replacement"] + out[e["end"]:]

    # import / hook 추가 — 사용된 형태에 따라 둘 다 추가 가능
    if used_i18n:
        out = ensure_i18n_import(out, rel)
    if used_useTranslation:
        out = ensure_useTranslation(out, ns)

    return {
        "rel": rel,
        "ns": ns,
        "edits": accepted,
        "seeds": seeds,
        "new_source": out,
    }


# ──────────────────── Wave-2 P2/P3 흡수 (JSX) ────────────────────
def wave2_process_file(rel: str, source: str, dry: bool):
    if rel in SKIP_FILES:
        return None
    ns, prefix = classify_namespace(rel)
    is_jsx = True  # P2/P3 대상은 모두 JSX
    mask = build_context_mask(source)
    edits = []
    seeds = OrderedDict()

    # P3 jsx text
    for m in P3_RE.finditer(source):
        body = m.group("body").strip()
        if not body:
            continue
        if not KOREAN_RE.search(body):
            continue
        # 본문 안에 quote 가 있다면 SKIP (안전)
        if "'" in body or '"' in body or "`" in body:
            continue
        ln = line_of(source, m.start())
        ls = line_str(source, ln)
        if COMMENT_LINE_RE.match(ls):
            continue
        # Inside t() / console / throw
        if is_inside_t_call(source, m.start()):
            continue
        if is_inside_console_or_throw(source, m.start()):
            continue
        # 단순 텍스트만 매칭 (template / expression 회피 — { 포함 시 P3_RE 가 이미 제외)
        slug = slug_for(body)
        full_key = f"{prefix}.{slug}"
        seeds[(full_key, body)] = True
        replacement = f">{m.group('lead')}{{t('{ns}:{full_key}')}}{m.group('trail')}<"
        edits.append({"start": m.start(), "end": m.end(), "replacement": replacement, "text": body, "key": full_key, "kind": "p3"})

    # P2 props attr="..." or attr='...'
    for m in P2_Q_RE.finditer(source):
        body = m.group("body").strip()
        if not body:
            continue
        if not KOREAN_RE.search(body):
            continue
        if "'" in body or '"' in body:
            continue
        ln = line_of(source, m.start())
        ls = line_str(source, ln)
        if COMMENT_LINE_RE.match(ls):
            continue
        if is_inside_t_call(source, m.start()):
            continue
        slug = slug_for(body)
        full_key = f"{prefix}.{slug}"
        seeds[(full_key, body)] = True
        replacement = f"{m.group('prop')}={{t('{ns}:{full_key}')}}"
        edits.append({"start": m.start(), "end": m.end(), "replacement": replacement, "text": body, "key": full_key, "kind": "p2-q"})

    # P2 attr={'...'} or attr={"..."}
    for m in P2_B_RE.finditer(source):
        body = m.group("body").strip()
        if not body:
            continue
        if not KOREAN_RE.search(body):
            continue
        if "'" in body or '"' in body:
            continue
        ln = line_of(source, m.start())
        if COMMENT_LINE_RE.match(line_str(source, ln)):
            continue
        if is_inside_t_call(source, m.start()):
            continue
        slug = slug_for(body)
        full_key = f"{prefix}.{slug}"
        seeds[(full_key, body)] = True
        replacement = f"{m.group('prop')}={{t('{ns}:{full_key}')}}"
        edits.append({"start": m.start(), "end": m.end(), "replacement": replacement, "text": body, "key": full_key, "kind": "p2-b"})

    if not edits:
        return None
    edits.sort(key=lambda e: e["start"])
    accepted = []
    last_end = -1
    for e in edits:
        if e["start"] < last_end:
            continue
        accepted.append(e)
        last_end = e["end"]
    out = source
    for e in reversed(accepted):
        out = out[: e["start"]] + e["replacement"] + out[e["end"]:]

    out = ensure_t_imports(out, rel, is_jsx, ns)
    return {"rel": rel, "ns": ns, "edits": accepted, "seeds": seeds, "new_source": out}


# ──────────────────── Wave-3 P5 throw new Error 흡수 ────────────────────
def wave3_process_file(rel: str, source: str, lines_to_absorb: list[int], dry: bool):
    is_jsx = detect_jsx(source)
    edits = []
    seeds = OrderedDict()
    for m in P5_RE.finditer(source):
        ln = line_of(source, m.start())
        if ln not in lines_to_absorb:
            continue
        body = m.group("body").strip()
        if not body:
            continue
        # generate error key
        key = error_key_for(rel, ln, body)
        full_ns = "error"
        seeds[(key, body)] = True
        if rel.startswith("frontend/src/utils/") or rel.startswith("frontend/src/constants/") or rel.startswith("frontend/src/api/"):
            replacement = f"throw new Error(i18n.t('{full_ns}:{key}'))"
        else:
            # JSX 컴포넌트는 useTranslation 의 t() 가 컴포넌트 본문 안에서만 가능 →
            # throw 는 보통 함수 본문에 있으므로 i18n.t 를 사용하는 게 안전
            replacement = f"throw new Error(i18n.t('{full_ns}:{key}'))"
        # m 전체 → throw new Error('한국어'  까지 치환 후 ')' 는 그대로 유지하되
        # 실제로는 m.end() 가 닫는 ' 까지 가므로, 이후 ')' 는 코드에 잔존
        # 단순화: m 끝 위치까지 치환 + 닫는 ')' 잔존
        edits.append({"start": m.start(), "end": m.end(), "replacement": replacement[: -1], "text": body, "key": key, "ns": full_ns})
        # 닫는 괄호 ')' 까지 흡수: 우리는 throw new Error( + ')' 까지 포괄 치환
        # 그래서 정확한 종료 위치는 다음 ')' 부터 — 단순하게 ')' 까지 체크
        # 본 코드 보정: replacement 에 닫는 ')' 추가 후 매칭 끝 + 1까지 흡수
        # → 다시 정밀히 처리:
        rest = source[m.end():]
        rmatch = re.match(r"\s*\)", rest)
        if rmatch:
            edits[-1]["end"] = m.end() + rmatch.end()
            edits[-1]["replacement"] = replacement
        else:
            # 닫는 ')' 찾기 실패 — 단순 매칭: t() 인자만 치환
            edits[-1]["replacement"] = f"i18n.t('{full_ns}:{key}')"
            edits[-1]["start"] = m.start("q")
            edits[-1]["end"] = m.end()
    if not edits:
        return None
    edits.sort(key=lambda e: e["start"])
    accepted = []
    last_end = -1
    for e in edits:
        if e["start"] < last_end:
            continue
        accepted.append(e)
        last_end = e["end"]
    out = source
    for e in reversed(accepted):
        out = out[: e["start"]] + e["replacement"] + out[e["end"]:]
    # i18n import 보장 (Wave-3 은 모두 lazy i18n 사용)
    out = ensure_i18n_import(out, rel)
    return {"rel": rel, "ns": "error", "edits": accepted, "seeds": seeds, "new_source": out}


# ──────────────────── import 처리 ────────────────────
def relpath_to_i18n(rel: str) -> str:
    """frontend/src/foo/bar/baz.js → 적절한 ../../i18n 상대경로."""
    parts = rel.split("/")
    # frontend/src 이후 디렉터리 깊이
    depth = len(parts) - 3  # frontend/src/<x>/...
    return "../" * depth + "i18n"


def find_import_block_end(source: str) -> int:
    """import 블록 끝 위치 (마지막 import 의 ; 다음)."""
    re_imp = re.compile(r"\bimport\s+[\s\S]*?from\s+['\"][^'\"]+['\"]\s*;?", re.M)
    re_side = re.compile(r"\bimport\s+['\"][^'\"]+['\"]\s*;?", re.M)
    last = -1
    for m in re_imp.finditer(source):
        last = max(last, m.end())
    for m in re_side.finditer(source):
        last = max(last, m.end())
    return last


def ensure_t_imports(source: str, rel: str, is_jsx: bool, ns: str) -> str:
    """useTranslation hook 또는 i18n import 추가."""
    is_util = rel.startswith("frontend/src/utils/") or rel.startswith("frontend/src/constants/") or rel.startswith("frontend/src/api/")
    if is_util or not is_jsx:
        return ensure_i18n_import(source, rel)
    return ensure_useTranslation(source, ns)


def ensure_i18n_import(source: str, rel: str) -> str:
    if re.search(r"\bimport\s+i18n\s+from\s+['\"][^'\"]+i18n['\"]", source):
        return source
    rel_path = relpath_to_i18n(rel)
    line = f"import i18n from '{rel_path}';\n"
    end = find_import_block_end(source)
    if end < 0:
        return line + source
    insert_at = end
    while insert_at < len(source) and source[insert_at] != "\n":
        insert_at += 1
    if insert_at < len(source) and source[insert_at] == "\n":
        insert_at += 1
    return source[:insert_at] + line + source[insert_at:]


def ensure_useTranslation(source: str, ns: str) -> str:
    """react-i18next의 useTranslation 훅 + 컴포넌트 본문 const { t } = useTranslation()."""
    # import 보장
    if re.search(r"from\s+['\"]react-i18next['\"]", source):
        if not re.search(r"\buseTranslation\b", source):
            source = re.sub(
                r"import\s*\{([^}]*)\}\s*from\s*(['\"])react-i18next\2",
                lambda mm: f"import {{ {mm.group(1).strip().rstrip(',').strip()}, useTranslation }} from {mm.group(2)}react-i18next{mm.group(2)}",
                source,
                count=1,
            )
    else:
        end = find_import_block_end(source)
        line = "import { useTranslation } from 'react-i18next';\n"
        if end < 0:
            source = line + source
        else:
            insert_at = end
            while insert_at < len(source) and source[insert_at] != "\n":
                insert_at += 1
            if insert_at < len(source) and source[insert_at] == "\n":
                insert_at += 1
            source = source[:insert_at] + line + source[insert_at:]
    # 훅 주입
    return inject_use_translation_hook(source)


def find_component_bodies(source: str):
    """함수형 컴포넌트 본문 시작 위치 (중괄호 { 의 인덱스) 추출.
    PascalCase 식별자 + `=` + 옵션 wrapper + `(...)` (균형) + `=> {` 또는 `function ... { 패턴.
    """
    bodies = []
    # const/let/var ComponentName = ...
    decl_re = re.compile(
        r"(?:^|[\n;}])\s*(?:export\s+(?:default\s+)?)?(?:const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*="
    )
    for m in decl_re.finditer(source):
        i = m.end()
        # skip wrappers: React.memo( / memo( / forwardRef( / observer(
        wrappers = 0
        while i < len(source):
            wrap = re.match(r"\s*(?:React\.)?(?:memo|forwardRef|observer)\s*\(", source[i:])
            if not wrap:
                break
            i += wrap.end()
            wrappers += 1
        # Skip whitespace
        while i < len(source) and source[i].isspace():
            i += 1
        # Either `(...) => {` or `name => {` or `function (...) {`
        if i >= len(source):
            continue
        if source[i] == "(":
            close = find_matching_paren(source, i)
            if close < 0:
                continue
            j = close + 1
        elif source[i].isalpha() or source[i] in "_$":
            j = i
            while j < len(source) and (source[j].isalnum() or source[j] in "_$"):
                j += 1
        else:
            continue
        while j < len(source) and source[j].isspace():
            j += 1
        # Expect `=>` then `{`
        if source[j: j + 2] == "=>":
            j += 2
            while j < len(source) and source[j].isspace():
                j += 1
            if j < len(source) and source[j] == "{":
                bodies.append({"name": m.group(1), "open": j})
                continue
        # Or function declaration
        # try `function ... {` after `=`
    # function ComponentName(...) {  -- top-level function declaration
    fn_re = re.compile(
        r"(?:^|[\n;}])\s*(?:export\s+(?:default\s+)?)?function\s+([A-Z][A-Za-z0-9_]*)\s*\("
    )
    for m in fn_re.finditer(source):
        # Find matching `(` close, then `{`
        open_paren = m.end() - 1
        close = find_matching_paren(source, open_paren)
        if close < 0:
            continue
        j = close + 1
        while j < len(source) and source[j].isspace():
            j += 1
        if j < len(source) and source[j] == "{":
            bodies.append({"name": m.group(1), "open": j})
    seen = set()
    out = []
    for b in bodies:
        if b["open"] in seen:
            continue
        seen.add(b["open"])
        out.append(b)
    out.sort(key=lambda x: x["open"])
    return out


def find_matching_paren(source: str, open_idx: int) -> int:
    """문자열·주석·템플릿 인지 균형 ()"""
    n = len(source)
    if open_idx >= n or source[open_idx] != "(":
        return -1
    depth = 1
    i = open_idx + 1
    in_single = in_double = in_tpl = in_line = in_block = False
    tpl_brace = 0
    while i < n and depth > 0:
        c = source[i]
        c2 = source[i: i + 2]
        if in_line:
            if c == "\n":
                in_line = False
            i += 1
            continue
        if in_block:
            if c2 == "*/":
                in_block = False
                i += 2
                continue
            i += 1
            continue
        if in_single:
            if c == "\\":
                i += 2
                continue
            if c == "'":
                in_single = False
            i += 1
            continue
        if in_double:
            if c == "\\":
                i += 2
                continue
            if c == '"':
                in_double = False
            i += 1
            continue
        if in_tpl:
            if tpl_brace > 0:
                if c == "{":
                    tpl_brace += 1
                elif c == "}":
                    tpl_brace -= 1
                i += 1
                continue
            if c == "\\":
                i += 2
                continue
            if c2 == "${":
                tpl_brace = 1
                i += 2
                continue
            if c == "`":
                in_tpl = False
            i += 1
            continue
        if c2 == "//":
            in_line = True
            i += 2
            continue
        if c2 == "/*":
            in_block = True
            i += 2
            continue
        if c == "'":
            in_single = True
            i += 1
            continue
        if c == '"':
            in_double = True
            i += 1
            continue
        if c == "`":
            in_tpl = True
            i += 1
            continue
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
        i += 1
    return i - 1 if depth == 0 else -1


def inject_use_translation_hook(source: str) -> str:
    """함수형 컴포넌트 본문 시작에 const { t } = useTranslation(); 추가.
    이미 본문에 useTranslation 호출이 있다면 SKIP.
    """
    bodies = find_component_bodies(source)
    # 역순 처리
    bodies_sorted = sorted(bodies, key=lambda b: -b["open"])
    out = source
    for b in bodies_sorted:
        close = find_matching_close(out, b["open"])
        if close < 0:
            continue
        body = out[b["open"] + 1: close]
        if not re.search(r"\bt\s*\(\s*['\"`][a-z][a-zA-Z0-9_]*:", body):
            # 본문에 우리가 추가한 t() 가 없음 (다른 컴포넌트일 수도)
            continue
        if re.search(r"\buseTranslation\s*\(", body):
            continue
        # indent 추출
        first_nl = body.find("\n")
        indent = "  "
        if first_nl >= 0:
            after_nl = body[first_nl + 1:]
            mi = re.match(r"^([ \t]+)\S", after_nl)
            if mi:
                indent = mi.group(1)
        injection = f"\n{indent}const {{ t }} = useTranslation();"
        out = out[: b["open"] + 1] + injection + out[b["open"] + 1:]
    return out


def find_matching_close(source: str, open_idx: int) -> int:
    n = len(source)
    depth = 1
    i = open_idx + 1
    in_single = in_double = in_tpl = in_line = in_block = False
    tpl_brace = 0
    while i < n and depth > 0:
        c = source[i]
        c2 = source[i: i + 2]
        if in_line:
            if c == "\n":
                in_line = False
            i += 1
            continue
        if in_block:
            if c2 == "*/":
                in_block = False
                i += 2
                continue
            i += 1
            continue
        if in_single:
            if c == "\\":
                i += 2
                continue
            if c == "'":
                in_single = False
            i += 1
            continue
        if in_double:
            if c == "\\":
                i += 2
                continue
            if c == '"':
                in_double = False
            i += 1
            continue
        if in_tpl:
            if tpl_brace > 0:
                if c == "{":
                    tpl_brace += 1
                elif c == "}":
                    tpl_brace -= 1
                i += 1
                continue
            if c == "\\":
                i += 2
                continue
            if c2 == "${":
                tpl_brace = 1
                i += 2
                continue
            if c == "`":
                in_tpl = False
            i += 1
            continue
        if c2 == "//":
            in_line = True
            i += 2
            continue
        if c2 == "/*":
            in_block = True
            i += 2
            continue
        if c == "'":
            in_single = True
            i += 1
            continue
        if c == '"':
            in_double = True
            i += 1
            continue
        if c == "`":
            in_tpl = True
            i += 1
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        i += 1
    return i - 1 if depth == 0 else -1


# ──────────────────── 메인 Wave 진입 ────────────────────
def run_wave(wave: int, dry_run: bool, fileset_override: list = None):
    if wave == 1:
        with INV_P1.open(encoding="utf-8") as f:
            inv = json.load(f)
        targets = [t["path"] for t in inv["top50_files"]]
    elif wave == 2:
        with INV_P2P3.open(encoding="utf-8") as f:
            inv = json.load(f)
        targets = [t["path"] for t in inv["top50_combined"]]
    elif wave == 3:
        with INV_P4P5.open(encoding="utf-8") as f:
            inv = json.load(f)
        # P5_locations_absorb 의 파일별로 라인 묶음
        by_file = defaultdict(list)
        for loc in inv["P5_locations_absorb"]:
            by_file[loc["path"]].append(loc["line"])
        targets = list(by_file.keys())
    else:
        raise ValueError(f"unknown wave {wave}")

    if fileset_override is not None:
        targets = fileset_override

    summary = {
        "wave": wave,
        "files_targeted": len(targets),
        "files_changed": 0,
        "files_skipped_data": 0,
        "files_skipped_no_match": 0,
        "edits_total": 0,
        "seeds_by_ns": defaultdict(int),
        "seeds_total": 0,
        "changed_files": [],
        "skipped_files": [],
    }

    # ko.json 로드
    ko_cache = {}
    def get_ns(ns):
        if ns not in ko_cache:
            ko_cache[ns] = load_ns(ns)
        return ko_cache[ns]

    for rel in targets:
        abs_path = ROOT / rel
        if not abs_path.exists():
            continue
        if rel in SKIP_FILES:
            summary["files_skipped_data"] += 1
            summary["skipped_files"].append({"path": rel, "reason": "data-table-guard"})
            continue
        source = abs_path.read_text(encoding="utf-8")
        if wave == 1:
            res = wave1_process_file(rel, source, dry_run)
        elif wave == 2:
            res = wave2_process_file(rel, source, dry_run)
        elif wave == 3:
            res = wave3_process_file(rel, source, by_file[rel], dry_run)
        if res is None:
            summary["files_skipped_no_match"] += 1
            continue
        # ko.json 시드
        for (key_path, body), _ in res["seeds"].items():
            target_ns = res["ns"]
            data = get_ns(target_ns)
            if set_nested(data, key_path, body):
                summary["seeds_by_ns"][target_ns] += 1
                summary["seeds_total"] += 1
        # 소스 수정
        if not dry_run:
            abs_path.write_text(res["new_source"], encoding="utf-8")
        summary["files_changed"] += 1
        summary["edits_total"] += len(res["edits"])
        summary["changed_files"].append({"path": rel, "edits": len(res["edits"]), "ns": res["ns"]})

    # ko.json 저장
    if not dry_run:
        for ns, data in ko_cache.items():
            save_ns(ns, data)

    return summary


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wave", type=int, required=True, choices=[1, 2, 3])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=None, help="대상 파일 제한 (디버그)")
    args = ap.parse_args()

    if args.wave == 1:
        with INV_P1.open(encoding="utf-8") as f:
            inv = json.load(f)
        files = [t["path"] for t in inv["top50_files"]]
    elif args.wave == 2:
        with INV_P2P3.open(encoding="utf-8") as f:
            inv = json.load(f)
        files = [t["path"] for t in inv["top50_combined"]]
    elif args.wave == 3:
        with INV_P4P5.open(encoding="utf-8") as f:
            inv = json.load(f)
        by_file = defaultdict(list)
        for loc in inv["P5_locations_absorb"]:
            by_file[loc["path"]].append(loc["line"])
        files = list(by_file.keys())
    if args.limit:
        files = files[: args.limit]
    summary = run_wave(args.wave, args.dry_run, fileset_override=files)
    summary["seeds_by_ns"] = dict(summary["seeds_by_ns"])
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
