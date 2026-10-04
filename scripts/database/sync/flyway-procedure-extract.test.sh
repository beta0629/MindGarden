#!/bin/bash
# flyway-procedure-extract.sh 단위 테스트. DB 접속·DDL 은 하지 않는다.
# 저장소 산출물이 원본과 같은지, 원본이 최신 마이그레이션이 아닐 때 check 가 막는지 확인한다.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
SCRIPT_REL="scripts/database/sync/flyway-procedure-extract.sh"
PROC_REL="database/schema/procedures_standardized"

pass=0
fail=0

ok() {
    pass=$((pass + 1))
    echo "ok - $1"
}

ng() {
    fail=$((fail + 1))
    echo "NOT ok - $1" >&2
}

WORK=$(mktemp -d "${TMPDIR:-/tmp}/mg-flyway-extract-test.XXXXXX")
trap 'rm -rf "$WORK"' EXIT

# 스크립트가 BASH_SOURCE 로 루트를 잡으므로, 같은 상대 경로를 가진 가짜 저장소를 만든다.
make_fake_root() {
    local dest="$1"
    mkdir -p "$dest/scripts/database/sync" \
        "$dest/src/main/resources/db/migration" \
        "$dest/src/main/resources/sql/procedures" \
        "$dest/src/main/java/com/coresolution/consultation/config" \
        "$dest/$PROC_REL"
    cp "$ROOT/$SCRIPT_REL" "$dest/$SCRIPT_REL"
    cat >"$dest/src/main/java/com/coresolution/consultation/config/PlSqlInitializer.java" <<'JAVA'
class PlSqlInitializer {
    static final String PINNED = "sql/procedures/pinned_proc.sql";
}
JAVA
}

# CASE 식(END 로 닫힘)과 CASE 문(END CASE)·END IF 가 섞인 본문.
# 예전 추출기는 CASE 식의 END 를 바깥 END 로 오인해 본문을 잘랐다.
write_migration() {
    local path="$1" name="$2" marker="$3"
    cat >"$path" <<SQL
-- 테스트 마이그레이션
DROP PROCEDURE IF EXISTS ${name};

DELIMITER \$\$

CREATE PROCEDURE ${name}(
    IN p_tenant_id VARCHAR(64),
    OUT p_success BOOLEAN
)
BEGIN
    DECLARE v_label VARCHAR(10);
    IF p_tenant_id IS NULL THEN
        SET p_success = FALSE;
    END IF;
    SET v_label = CASE
        WHEN p_tenant_id = 'a' THEN 'A'
        ELSE ''
    END;
    CASE p_tenant_id
        WHEN 'b' THEN SET v_label = 'B';
        ELSE SET v_label = '';
    END CASE;
    SET p_success = TRUE;
    SELECT '${marker}';
END\$\$

DELIMITER ;

-- 프로시저 뒤에 오는 다른 DDL (추출에 들어가면 안 됨)
CREATE TABLE IF NOT EXISTS tail_marker (id INT);
SQL
}

run_extract() {
    local dest="$1" mode="$2"
    (cd "$dest" && bash "$dest/$SCRIPT_REL" "$mode" 2>&1)
}

echo "=== 1) 저장소 산출물이 원본과 같다 (check) ==="
if out=$(bash "$ROOT/$SCRIPT_REL" check 2>&1); then
    ok "저장소 check 통과: $out"
else
    ng "저장소 check 실패: $out"
fi

echo "=== 2) CASE 식이 있어도 바깥 END 까지 전부 추출한다 ==="
FAKE="$WORK/case"
make_fake_root "$FAKE"
write_migration "$FAKE/src/main/resources/db/migration/V10__case_proc.sql" CaseProc TAIL_MARKER
printf 'CaseProc\tsrc/main/resources/db/migration/V10__case_proc.sql\tflyway-latest\n' \
    >"$FAKE/$PROC_REL/FLYWAY_SOURCES.tsv"
if out=$(run_extract "$FAKE" generate); then
    body="$FAKE/$PROC_REL/CaseProc_standardized.sql"
    if grep -q "TAIL_MARKER" "$body"; then
        ok "CASE 식 뒤 본문까지 추출"
    else
        ng "CASE 식에서 본문이 잘렸습니다"
    fi
    if grep -q "tail_marker" "$body"; then
        ng "프로시저 뒤 DDL 이 섞여 들어갔습니다"
    else
        ok "프로시저 뒤 DDL 은 제외"
    fi
    if grep -q '^DROP PROCEDURE IF EXISTS CaseProc //$' "$body" \
        && grep -q '^DELIMITER //$' "$body" \
        && grep -q '^END //$' "$body"; then
        ok "배포 SQL 형식(DELIMITER·DROP·END) 유지"
    else
        ng "배포 SQL 형식이 다릅니다"
    fi
else
    ng "generate 실패: $out"
fi

echo "=== 3) 더 높은 버전 마이그레이션이 생기면 check 가 막는다 ==="
write_migration "$FAKE/src/main/resources/db/migration/V20260901_001__case_proc_newer.sql" CaseProc NEWER
set +e
out=$(run_extract "$FAKE" check)
rc=$?
set -e
if [ "$rc" -ne 0 ] && printf '%s' "$out" | grep -q "최신 마이그레이션이 아닙니다"; then
    ok "낡은 MANIFEST 를 check 가 FAIL 처리"
else
    ng "낡은 MANIFEST 를 통과시켰습니다 (rc=$rc): $out"
fi

echo "=== 4) generate 로 갱신하면 최신 정의를 담는다 ==="
printf 'CaseProc\tsrc/main/resources/db/migration/V20260901_001__case_proc_newer.sql\tflyway-latest\n' \
    >"$FAKE/$PROC_REL/FLYWAY_SOURCES.tsv"
if run_extract "$FAKE" generate >/dev/null && run_extract "$FAKE" check >/dev/null; then
    if grep -q "NEWER" "$FAKE/$PROC_REL/CaseProc_standardized.sql"; then
        ok "최신 마이그레이션 본문으로 갱신"
    else
        ng "갱신했는데 최신 본문이 아닙니다"
    fi
else
    ng "갱신 후 check 실패"
fi

echo "=== 5) 산출물을 손으로 고치면 check 가 막는다 ==="
echo "-- 손으로 고침" >>"$FAKE/$PROC_REL/CaseProc_standardized.sql"
set +e
out=$(run_extract "$FAKE" check)
rc=$?
set -e
if [ "$rc" -ne 0 ] && printf '%s' "$out" | grep -q "원본과 다릅니다"; then
    ok "손으로 고친 산출물을 FAIL 처리"
else
    ng "손으로 고친 산출물을 통과시켰습니다 (rc=$rc): $out"
fi

echo "=== 6) MANIFEST 에 없는 산출물이 남으면 막는다 ==="
run_extract "$FAKE" generate >/dev/null
cp "$FAKE/$PROC_REL/CaseProc_standardized.sql" "$FAKE/$PROC_REL/Orphan_standardized.sql"
set +e
out=$(run_extract "$FAKE" check)
rc=$?
set -e
if [ "$rc" -ne 0 ] && printf '%s' "$out" | grep -q "MANIFEST 에 없는 생성 파일"; then
    ok "고아 산출물을 FAIL 처리"
else
    ng "고아 산출물을 통과시켰습니다 (rc=$rc): $out"
fi
rm -f "$FAKE/$PROC_REL/Orphan_standardized.sql"

echo "=== 6-1) 손으로 관리하는 표준 SQL 은 목록 밖이어도 통과하고, 이름이 겹치면 막는다 ==="
printf -- '-- 손으로 관리\nDELIMITER //\nDROP PROCEDURE IF EXISTS HandProc //\nCREATE PROCEDURE HandProc() BEGIN SELECT 1; END //\nDELIMITER ;\n' \
    >"$FAKE/$PROC_REL/HandProc_standardized.sql"
if out=$(run_extract "$FAKE" check); then
    ok "목록 밖 손 관리 표준 SQL 은 건드리지 않고 통과"
else
    ng "손 관리 표준 SQL 때문에 check 가 실패했습니다: $out"
fi
cp "$FAKE/$PROC_REL/HandProc_standardized.sql" "$FAKE/$PROC_REL/CaseProc_standardized.sql"
set +e
out=$(run_extract "$FAKE" generate)
rc=$?
set -e
if [ "$rc" -ne 0 ] && printf '%s' "$out" | grep -q "이름이 겹칩니다" \
    && grep -q "손으로 관리" "$FAKE/$PROC_REL/CaseProc_standardized.sql"; then
    ok "손 관리 표준 SQL 을 generate 가 덮어쓰지 않음"
else
    ng "손 관리 표준 SQL 을 덮어썼거나 통과시켰습니다 (rc=$rc): $out"
fi
rm -f "$FAKE/$PROC_REL/HandProc_standardized.sql" "$FAKE/$PROC_REL/CaseProc_standardized.sql"

echo "=== 7) pinned 원본이 PlSqlInitializer 에서 쓰이지 않으면 막는다 ==="
PINNED="$WORK/pinned"
make_fake_root "$PINNED"
write_migration "$PINNED/src/main/resources/db/migration/V10__pinned.sql" PinnedProc FLYWAY
cp "$PINNED/src/main/resources/db/migration/V10__pinned.sql" \
    "$PINNED/src/main/resources/sql/procedures/pinned_proc.sql"
cp "$PINNED/src/main/resources/db/migration/V10__pinned.sql" \
    "$PINNED/src/main/resources/sql/procedures/unused_proc.sql"
printf 'PinnedProc\tsrc/main/resources/sql/procedures/pinned_proc.sql\tpinned\n' \
    >"$PINNED/$PROC_REL/FLYWAY_SOURCES.tsv"
if run_extract "$PINNED" generate >/dev/null && run_extract "$PINNED" check >/dev/null; then
    ok "PlSqlInitializer 가 참조하는 pinned 원본은 통과"
else
    ng "정상 pinned 원본을 막았습니다"
fi
printf 'PinnedProc\tsrc/main/resources/sql/procedures/unused_proc.sql\tpinned\n' \
    >"$PINNED/$PROC_REL/FLYWAY_SOURCES.tsv"
set +e
out=$(run_extract "$PINNED" check)
rc=$?
set -e
if [ "$rc" -ne 0 ] && printf '%s' "$out" | grep -q "PlSqlInitializer 에서 쓰이지 않습니다"; then
    ok "PlSqlInitializer 와 무관한 pinned 원본을 FAIL 처리"
else
    ng "무관한 pinned 원본을 통과시켰습니다 (rc=$rc): $out"
fi

echo "=== 8) 프로시저 이름 형식이 아니면 막는다 ==="
printf 'Bad Name;DROP\tsrc/main/resources/db/migration/V10__pinned.sql\tflyway-latest\n' \
    >"$PINNED/$PROC_REL/FLYWAY_SOURCES.tsv"
set +e
out=$(run_extract "$PINNED" check)
rc=$?
set -e
if [ "$rc" -ne 0 ] && printf '%s' "$out" | grep -q "이름 형식이 아닙니다"; then
    ok "이름 형식 검사"
else
    ng "이상한 이름을 통과시켰습니다 (rc=$rc): $out"
fi

echo ""
echo "flyway-procedure-extract.test summary pass=$pass fail=$fail"
[ "$fail" -eq 0 ] || exit 1
echo "PASS flyway-procedure-extract"
