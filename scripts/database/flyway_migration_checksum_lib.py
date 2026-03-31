#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Flyway 9.x Community와 동일한 마이그레이션 체크섬(CRC32) 계산.

알고리즘: flyway-core 9.22.x ChecksumCalculator / BomFilter
- UTF-8 텍스트로 디코딩 후 BufferedReader.readLine()과 동등한 줄 단위 처리
- 첫 줄에 한해 선두 U+FEFF(BOM) 1글자 제거
- 각 줄을 UTF-8 바이트로 CRC32 갱신(Java CRC32.getValue()의 부호 있는 int와 동일)

주의: flyway_schema_history의 script/checksum만 소스와 맞춰도 DB 실제 스키마가 같다는 보장은 없습니다.
본문·적용 이력이 어긋난 채 이력만 정리하면 validate는 통과할 수 있으나 데이터 손상·런타임 장애 위험이 있습니다.
운영 적용 전 백업·스키마 diff·검증을 수행하세요.
"""

from __future__ import annotations

import argparse
import io
import sys
import zipfile
import zlib
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

def split_versioned_migration_basename(basename: str) -> Optional[Tuple[str, str]]:
    """V{version}__{description}.sql — 첫 '__'만 구분자(Flyway 규칙). 반환: (raw_version, script_basename)."""
    if not basename.startswith("V") or not basename.endswith(".sql"):
        return None
    if basename.endswith(".sql.backup"):
        return None
    body = basename[1:-4]
    sep = "__"
    if sep not in body:
        return None
    i = body.index(sep)
    raw_ver = body[:i]
    if not raw_ver:
        return None
    return raw_ver, basename


def crc32_to_signed_java(crc: int) -> int:
    v = crc & 0xFFFFFFFF
    if v >= 0x80000000:
        return v - 0x100000000
    return v


def flyway_checksum_from_text(text: str) -> int:
    crc = zlib.crc32(b"")
    reader = io.StringIO(text)
    first_line = True
    while True:
        line = reader.readline()
        if not line:
            break
        if line.endswith("\n"):
            line = line[:-1]
        if line.endswith("\r"):
            line = line[:-1]
        if first_line:
            if line and line[0] == "\ufeff":
                line = line[1:]
            first_line = False
        crc = zlib.crc32(line.encode("utf-8"), crc)
    return crc32_to_signed_java(crc)


def flyway_checksum_from_path(path: Path) -> int:
    raw = path.read_bytes()
    text = raw.decode("utf-8")
    return flyway_checksum_from_text(text)


def flyway_version_display(script_basename: str) -> Optional[str]:
    sp = split_versioned_migration_basename(script_basename)
    if sp is None:
        return None
    raw_ver, _ = sp
    return raw_ver.replace("_", ".")


def is_versioned_migration_sql(name: str) -> bool:
    base = Path(name).name
    return split_versioned_migration_basename(base) is not None


def sort_key_version(display_ver: str) -> Tuple:
    parts = display_ver.split(".")
    key: List[int] = []
    for p in parts:
        try:
            key.append(int(p))
        except ValueError:
            key.append(-1)
    return tuple(key)


def list_dir_migrations(migration_dir: Path) -> List[Path]:
    if not migration_dir.is_dir():
        raise SystemExit(f"디렉터리가 없습니다: {migration_dir}")
    files = sorted(
        p for p in migration_dir.iterdir() if p.is_file() and is_versioned_migration_sql(p.name)
    )
    return files


def list_jar_migrations(jar_path: Path) -> List[str]:
    if not jar_path.is_file():
        raise SystemExit(f"JAR 파일이 없습니다: {jar_path}")
    prefix = "BOOT-INF/classes/db/migration/"
    names: List[str] = []
    with zipfile.ZipFile(jar_path, "r") as zf:
        for name in zf.namelist():
            if not name.startswith(prefix) or "/" in name[len(prefix) :]:
                continue
            base = name[len(prefix) :]
            if not base or not is_versioned_migration_sql(base):
                continue
            names.append(name)
    return sorted(names)


def read_jar_entry_text(jar_path: Path, entry: str) -> str:
    with zipfile.ZipFile(jar_path, "r") as zf:
        return zf.read(entry).decode("utf-8")


def mysql_escape_literal(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "''")


def collect_rows_from_dir(migration_dir: Path) -> List[Tuple[str, str, int]]:
    rows: List[Tuple[str, str, int]] = []
    for path in list_dir_migrations(migration_dir):
        script = path.name
        ver = flyway_version_display(script)
        if ver is None:
            continue
        chk = flyway_checksum_from_path(path)
        rows.append((ver, script, chk))
    rows.sort(key=lambda r: sort_key_version(r[0]))
    return rows


def collect_rows_from_jar(jar_path: Path) -> List[Tuple[str, str, int]]:
    rows: List[Tuple[str, str, int]] = []
    for entry in list_jar_migrations(jar_path):
        script = Path(entry).name
        ver = flyway_version_display(script)
        if ver is None:
            continue
        text = read_jar_entry_text(jar_path, entry)
        chk = flyway_checksum_from_text(text)
        rows.append((ver, script, chk))
    rows.sort(key=lambda r: sort_key_version(r[0]))
    return rows


def print_table(rows: Iterable[Tuple[str, str, int]]) -> None:
    print("version\tscript\tchecksum")
    for ver, script, chk in rows:
        print(f"{ver}\t{script}\t{chk}")


def print_sql_updates(rows: Iterable[Tuple[str, str, int]]) -> None:
    print(
        "-- 운영 DB에 적용하기 전에 반드시 백업(flyway_schema_history 포함) 후, "
        "스키마 diff 등으로 실제 적용된 스키마와 마이그레이션 SQL 본문이 일치하는지 검증하세요."
    )
    print(
        "-- 아래 UPDATE는 flyway_schema_history의 script/checksum만 소스(JAR/디렉터리)와 맞추는 '제안'입니다. "
        "이력만 맞추고 DB 실제 스키마가 다르면 이후 마이그레이션·런타임에서 데이터 손상·장애가 발생할 수 있습니다."
    )
    for ver, script, chk in rows:
        esc = mysql_escape_literal(script)
        print(
            f"UPDATE flyway_schema_history SET script='{esc}', checksum={chk} "
            f"WHERE version='{mysql_escape_literal(ver)}' AND success=1;"
        )


def default_repo_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def default_migration_dir() -> Path:
    return default_repo_root() / "src" / "main" / "resources" / "db" / "migration"


def default_jar_glob() -> Path:
    root = default_repo_root()
    matches = sorted(root.glob("target/consultation-management-system-*.jar"), key=lambda p: p.stat().st_mtime)
    if not matches:
        raise SystemExit(
            "JAR를 찾을 수 없습니다: target/consultation-management-system-*.jar "
            "(mvn package 후 재시도하거나 --jar 로 경로를 지정하세요)"
        )
    return matches[-1]


def parse_args(argv: List[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Flyway 9.x Community와 동일한 규칙으로 버전 마이그레이션 체크섬을 계산합니다."
    )
    src = p.add_mutually_exclusive_group()
    src.add_argument(
        "--dir",
        type=Path,
        metavar="PATH",
        help="마이그레이션 디렉터리 (기본: <repo>/src/main/resources/db/migration)",
    )
    src.add_argument(
        "--jar",
        type=Path,
        metavar="PATH",
        nargs="?",
        const=Path("__AUTO__"),
        help="Spring Boot fat JAR (--jar 단독이면 target/consultation-management-system-*.jar 중 최신)",
    )
    p.add_argument(
        "--sql-update",
        action="store_true",
        help="MySQL용 flyway_schema_history UPDATE 제안문을 추가로 출력",
    )
    return p.parse_args(argv)


def main(argv: List[str]) -> int:
    args = parse_args(argv)
    if args.jar is not None:
        jar_path = default_jar_glob() if args.jar == Path("__AUTO__") else args.jar
        rows = collect_rows_from_jar(jar_path)
    else:
        mdir = args.dir if args.dir is not None else default_migration_dir()
        rows = collect_rows_from_dir(mdir)
    print_table(rows)
    if args.sql_update:
        print("")
        print_sql_updates(rows)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
