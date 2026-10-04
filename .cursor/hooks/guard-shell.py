#!/usr/bin/env python3
"""Cursor beforeShellExecution 훅 — 되돌릴 수 없는 명령만 막는다 (AGENTS.md §2·§4).

막는 것: force push, 개발·운영 브랜치 직접 push, 원격 브랜치 삭제, 운영 대상 PR 생성, --admin 머지,
운영 배포 워크플로 실행, 브랜치 보호·ruleset 변경 API, 원격 DB 데이터·스키마 쓰기(ssh 경유 포함).
명령을 ; && || | 줄바꿈 단위로 나눠 구간마다 판정한다(다른 구간의 브랜치명으로 오탐하지 않게).
네트워크 호출 없음. 브랜치명은 .cursor/harness.env, 끄기는 훅 프로세스 환경변수 MG_SHELL_GUARD=off.
입력: {"command": "...", "cwd": "..."} · 출력: {"permission": "allow"|"deny", ...}
"""
import json
import os
import re
import shlex
import subprocess
import sys
from pathlib import Path

SEPARATORS = {";", "&&", "||", "|", "&", "\n", ";;", "|&"}
PREFIX_WORDS = {"sudo", "command", "time", "env", "nohup", "exec", "builtin"}
DB_CLIENTS = {"mysql", "mariadb", "psql", "mongosh", "mongo"}
WRITE_SQL = re.compile(
    r"(?i)(^|[^a-z_])(update|insert|delete|replace|drop|truncate|alter|create|grant|revoke|rename|call)\s"
)
MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def load_env():
    conf = {"DEV_BRANCH": "release/dev", "PROD_BRANCH": "release/prod",
            "DB_WRITE_ALLOW_HOST_REGEX": r"^(localhost|127\.0\.0\.1|::1)$"}
    path = Path(__file__).resolve().parents[1] / "harness.env"
    try:
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            conf[key.strip()] = val.strip().strip("'\"")
    except OSError:
        pass
    return conf


def tokenize(cmd):
    lex = shlex.shlex(cmd, posix=True, punctuation_chars=";&|")
    lex.whitespace = " \t\r"
    lex.wordchars += ":@%+,^{}[]!#$<>"
    lex.commenters = ""
    try:
        return list(lex)
    except ValueError:
        return re.split(r"\s+", cmd.replace("\n", " ; "))


def segments(cmd):
    seg = []
    for tok in tokenize(cmd):
        if tok in SEPARATORS or (tok and set(tok) <= set(";&|")):
            if seg:
                yield seg
            seg = []
        else:
            seg.append(tok)
    if seg:
        yield seg


def strip_prefix(seg):
    i = 0
    while i < len(seg) and (re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", seg[i]) or seg[i] in PREFIX_WORDS):
        i += 1
    return seg[i:]


def current_branch(cwd):
    try:
        out = subprocess.run(["git", "-C", cwd or ".", "symbolic-ref", "--short", "-q", "HEAD"],
                             capture_output=True, text=True, timeout=3)
        return out.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return ""


def branch_name(ref):
    ref = ref.lstrip("+")
    return ref[len("refs/heads/"):] if ref.startswith("refs/heads/") else ref


def check_git(args, conf, cwd):
    i = 0
    while i < len(args) and args[i].startswith("-"):
        i += 2 if args[i] in ("-C", "-c") else 1
    if i >= len(args) or args[i] != "push":
        return None
    rest = args[i + 1:]
    opts = [a for a in rest if a.startswith("-")]
    pos = [a for a in rest if not a.startswith("-")]
    for o in opts:
        if o in ("--force", "--mirror") or o.startswith("--force-with-lease") or (
                re.match(r"^-[A-Za-z]+$", o) and "f" in o):
            return "force push 금지"
        if o in ("--delete", "-d"):
            return "원격 브랜치 삭제 금지"
    refspecs = pos[1:]
    for spec in refspecs:
        if spec.startswith("+"):
            return "force push(+refspec) 금지"
        if spec.startswith(":"):
            return "원격 브랜치 삭제 금지"
    protected = {conf["DEV_BRANCH"]: "개발", conf["PROD_BRANCH"]: "운영"}
    dests = [branch_name(s.split(":", 1)[-1]) for s in refspecs if s != "HEAD"]
    if not refspecs or "HEAD" in refspecs:
        dests.append(current_branch(cwd))
    for dest in dests:
        if dest in protected:
            return f"{protected[dest]} 브랜치({dest}) 직접 push 금지 — 새 브랜치에서 PR로만"
    return None


def opt_value(args, names):
    for idx, a in enumerate(args):
        for n in names:
            if a == n and idx + 1 < len(args):
                return args[idx + 1]
            if a.startswith(n + "="):
                return a.split("=", 1)[1]
    return None


def check_gh(args, conf):
    if len(args) >= 2 and args[0] == "pr" and args[1] == "create":
        if opt_value(args, ("--base", "-B")) == conf["PROD_BRANCH"]:
            return "운영 브랜치 대상 PR 생성 금지(리드 전담)"
    if len(args) >= 2 and args[0] == "pr" and args[1] == "merge" and "--admin" in args:
        return "--admin 머지(보호 규칙 우회) 금지"
    if len(args) >= 2 and args[0] == "workflow" and args[1] == "run":
        target = " ".join(a for a in args[2:] if not a.startswith("-"))
        ref = opt_value(args, ("--ref", "-r")) or ""
        if re.search(r"(?i)prod|production|운영", target) or ref == conf["PROD_BRANCH"]:
            return "운영 배포 워크플로 실행 금지(리드 전담)"
    if args and args[0] == "api":
        method = (opt_value(args, ("-X", "--method")) or "").upper()
        has_fields = any(a in ("-f", "-F", "--field", "--raw-field", "--input") or
                         a.startswith(("--field=", "--raw-field=", "--input=")) for a in args)
        if method in MUTATING_METHODS or (not method and has_fields):
            path = " ".join(a for a in args[1:] if "/" in a)
            if re.search(r"/protection\b|/rulesets\b", path):
                return "브랜치 보호·ruleset 변경 금지(리드 전담)"
            if conf["PROD_BRANCH"] in path:
                return "운영 브랜치 ref 변경 API 금지"
    return None


def db_host(args):
    for idx, a in enumerate(args):
        if a in ("-h", "--host") and idx + 1 < len(args):
            return args[idx + 1]
        if a.startswith("--host="):
            return a.split("=", 1)[1]
        if a.startswith("-h") and len(a) > 2 and not a.startswith("--"):
            return a[2:]
        m = re.match(r"^(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?)://(?:[^@/]*@)?([^/:?]+)", a)
        if m:
            return m.group(1)
    return ""


def check_db(name, args, whole_cmd, conf):
    text = " ".join(args) + " " + whole_cmd
    host = db_host(args)
    remote = bool(host) and not re.match(conf["DB_WRITE_ALLOW_HOST_REGEX"], host)
    if remote and (WRITE_SQL.search(text) or "<" in args):
        return "원격 DB 데이터·스키마 쓰기 금지(heal·수동 보정 금지) — 코드·표준 마이그레이션/배포 SQL로만"
    return None


def check_segment(seg, whole_cmd, conf, cwd, depth=0):
    seg = strip_prefix(seg)
    if not seg:
        return None
    prog = os.path.basename(seg[0])
    args = seg[1:]
    if prog == "git":
        return check_git(args, conf, cwd)
    if prog == "gh":
        return check_gh(args, conf)
    if prog in DB_CLIENTS:
        return check_db(prog, args, whole_cmd, conf)
    if prog in ("bash", "sh", "zsh") and "-c" in args and depth < 3:
        inner = args[args.index("-c") + 1] if args.index("-c") + 1 < len(args) else ""
        return check_command(inner, conf, cwd, depth + 1)
    if prog == "ssh" and depth < 3:
        remote_cmd = " ".join(a for a in args if " " in a or a in DB_CLIENTS)
        if any(re.search(rf"(^|[\s;&|]){c}(\s|$)", remote_cmd) for c in DB_CLIENTS) and WRITE_SQL.search(remote_cmd):
            return "원격 서버 DB 데이터·스키마 쓰기 금지(heal·수동 보정 금지) — 코드·표준 마이그레이션/배포 SQL로만"
        if remote_cmd:
            return check_command(remote_cmd, conf, cwd, depth + 1)
    return None


def check_command(cmd, conf, cwd, depth=0):
    for seg in segments(cmd):
        reason = check_segment(seg, cmd, conf, cwd, depth)
        if reason:
            return reason
    return None


def main():
    try:
        data = json.load(sys.stdin)
    except (ValueError, OSError):
        data = {}
    cmd = data.get("command") or ""
    if not cmd or os.environ.get("MG_SHELL_GUARD", "on") == "off":
        print(json.dumps({"permission": "allow"}))
        return
    reason = check_command(cmd, load_env(), data.get("cwd") or os.getcwd())
    if not reason:
        print(json.dumps({"permission": "allow"}))
        return
    print(json.dumps({
        "permission": "deny",
        "user_message": "셸 가드 훅이 막음: " + reason,
        "agent_message": "이 명령은 AGENTS.md §2·§4 / 00-guardrails.mdc 로 금지됨: " + reason
                         + ". 우회하지 말고 사용자에게 보고하세요.",
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
