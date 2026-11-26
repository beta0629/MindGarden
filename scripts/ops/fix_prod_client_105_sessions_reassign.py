#!/usr/bin/env python3
"""단건 운영 회기 정정 (client_id=105, 재학 승인 2026-11-26 14:23 KST 「정정 진행해줘」).

범위(이것만):
  - schedules 689: mapping 386 -> 388, session_sequence 2 -> 1
  - schedules 781: mapping 430 -> 388, session_sequence 1 -> 2
  - mapping 388: 5/0/5 -> 5/2/3 (ACTIVE 유지)
  - mapping 386: 변경 없음
  - mapping 430: PENDING_PAYMENT/PENDING -> CANCELLED/REJECTED (+terminated_at, termination_reason)
  - consultant_client_mapping_history 3행 (reason 「재학 승인 회기 정정 2026-11-26」)
결제·FT·전표·일지·급여는 변경하지 않는다.

게이트(하나라도 FAIL이면 쓰기 없이 종료):
  G1 이름: users.name 을 앱(PersonalDataEncryptionUtil)과 같은 방식으로 runner 메모리에서만 복호화해
     client 105 == '박혜선' 여부와 테넌트 내 동명이인 수만 출력. 평문·키는 출력하지 않는다.
  G2 DDL: information_schema 로 대상 컬럼·NOT NULL 기본값·enum 값 대조.
  G3 연관: 일지·급여·정산·기타 테이블이 mapping 386/388/430 또는 schedule 689/781 의 mapping 값을 참조하면 FAIL.
  G4 전값: RCA 값과 정확히 같아야 하며 430 결제/FT/전표 0건.
APPLY=true 일 때만 COMMIT, 기본은 ROLLBACK (dry-run). 영향 행 수 1/1/1/1/3 아니면 ROLLBACK.
"""
import base64
import hashlib
import json
import os
import sys

import pymysql
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

TENANT = "tenant-incheon-counseling-001"
CLIENT_ID = 105
CONSULTANT_ID = 3
TARGET_NAME = "\ubc15\ud61c\uc120"  # 박혜선
REASON = "재학 승인 회기 정정 2026-11-26"
APPLY = os.environ.get("APPLY", "false") == "true"

failures = []


def out(*a):
    print(*a, flush=True)


def gate(name, ok, detail=""):
    out(f"{'PASS' if ok else 'FAIL'}: {name}" + (f" — {detail}" if detail else ""))
    if not ok:
        failures.append(name)


# ---------- PII decrypt (PersonalDataEncryptionKeyProvider/Util parity) ----------
def _decode_material(v):
    v = v.strip()
    try:
        return base64.b64decode(v, validate=True)
    except Exception:
        return v.encode("utf-8")


def _norm_key(v):
    raw = _decode_material(v)
    if len(raw) >= 32:
        return raw[:32]
    return hashlib.sha256(raw).digest()


def _norm_iv(v):
    raw = _decode_material(v)
    if len(raw) >= 16:
        return raw[:16]
    return hashlib.sha256(raw).digest()[:16]


def _parse_map(cfg):
    res = {}
    if not cfg:
        return res
    for e in cfg.replace(";", ",").strip().split(","):
        if not e.strip():
            continue
        p = e.strip().split(":", 1)
        if len(p) == 2:
            res[p[0].strip()] = p[1].strip()
    return res


def load_keys():
    keys = _parse_map(os.environ.get("PII_KEYS", ""))
    ivs = _parse_map(os.environ.get("PII_IVS", ""))
    active = (os.environ.get("PII_ACTIVE_KEY_ID", "") or "").strip()
    mats = {}
    for kid, kv in keys.items():
        iv = ivs.get(kid)
        if not iv:
            continue
        mats[kid] = (_norm_key(kv), _norm_iv(iv))
    order = ([active] if active in mats else []) + [k for k in mats if k != active]
    return mats, order


def _dec(payload, mat):
    key, iv = mat
    ct = base64.b64decode(payload)
    d = Cipher(algorithms.AES(key), modes.CBC(iv)).decryptor()
    padded = d.update(ct) + d.finalize()
    u = padding.PKCS7(128).unpadder()
    return (u.update(padded) + u.finalize()).decode("utf-8")


def decrypt(text, mats, order):
    """returns (plain or None, decrypted_flag)"""
    if text is None:
        return None, False
    if text.startswith("legacy::"):
        text = text[len("legacy::"):]
    if "::" in text:
        kid, payload = text.split("::", 1)
        if kid in mats:
            try:
                return _dec(payload, mats[kid]), True
            except Exception:
                pass
        text = payload
    for kid in order:
        try:
            return _dec(text, mats[kid]), True
        except Exception:
            continue
    return text, False  # 앱과 동일: 복호화 실패 시 원문(평문 저장) 취급


def _is_true(v):
    """MySQL BIT(1)/TINYINT 안전 판정 (b'\\x00' -> False)."""
    if v is None:
        return False
    if isinstance(v, (bytes, bytearray)):
        return any(v)
    return bool(v)


def main():
    conn = pymysql.connect(
        host=os.environ["DB_HOST"], user=os.environ["DB_USER"], password=os.environ["MYSQL_PWD"],
        database=os.environ["DB_NAME"], charset="utf8mb4", autocommit=False,
        cursorclass=pymysql.cursors.DictCursor, connect_timeout=10)
    cur = conn.cursor()
    out(f"mode={'APPLY(COMMIT)' if APPLY else 'DRY-RUN(ROLLBACK)'}")

    # ---------- G1 name ----------
    mats, order = load_keys()
    out(f"G1 key ids loaded={sorted(mats.keys())} active_first={order[:1]}")
    cur.execute("SELECT id, role, name FROM users WHERE tenant_id=%s AND (is_deleted=0 OR is_deleted IS NULL)", (TENANT,))
    rows = cur.fetchall()
    match_ids, undecryptable, target_ok, target_dec = [], 0, False, False
    for r in rows:
        plain, ok = decrypt(r["name"], mats, order)
        if not ok:
            undecryptable += 1
        if plain is not None and plain.strip().replace(" ", "") == TARGET_NAME:
            match_ids.append((r["id"], r["role"]))
        if r["id"] == CLIENT_ID:
            target_dec = ok
            target_ok = plain is not None and plain.strip().replace(" ", "") == TARGET_NAME
        r["name"] = None
    del rows
    others = [m for m in match_ids if m[0] != CLIENT_ID]
    out(f"G1 tenant users scanned (non-deleted), undecryptable(plain-or-fail)={undecryptable}")
    out(f"G1 client105_decrypted={'Y' if target_dec else 'N'} name_match={'Y' if target_ok else 'N'}")
    out(f"G1 same-name others (id,role)={others}")
    gate("G1_name_match_105", target_ok)
    gate("G1_no_homonym", len(others) == 0)

    # ---------- G2 DDL ----------
    need = {
        "schedules": ["id", "tenant_id", "mapping_id", "session_sequence", "client_id", "updated_at", "is_deleted"],
        "consultant_client_mappings": ["id", "tenant_id", "status", "payment_status", "used_sessions",
                                       "remaining_sessions", "total_sessions", "terminated_at",
                                       "termination_reason", "updated_at"],
        "consultant_client_mapping_history": ["tenant_id", "mapping_id", "client_id", "consultant_id", "event_type",
                                              "before_state_json", "after_state_json", "triggered_by_user_id",
                                              "reason", "created_at"],
    }
    for t, cols in need.items():
        cur.execute("""SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
                       FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s""", (t,))
        info = {c["COLUMN_NAME"]: c for c in cur.fetchall()}
        missing = [c for c in cols if c not in info]
        gate(f"G2_{t}_columns", not missing, f"missing={missing}")
        if t == "consultant_client_mapping_history":
            unfilled = [c for c, v in info.items() if c not in cols and v["IS_NULLABLE"] == "NO"
                        and v["COLUMN_DEFAULT"] is None and "auto_increment" not in (v["EXTRA"] or "")]
            gate("G2_history_no_unfilled_notnull", not unfilled, f"unfilled={unfilled}")
            et = info.get("event_type", {}).get("COLUMN_TYPE", "")
            out(f"G2 history.event_type type={et}")
            if et.lower().startswith("enum"):
                gate("G2_history_event_enum", all(f"'{v}'" in et for v in ("SESSION_USED", "STATUS_CHANGED", "UPDATED")))
        if t == "consultant_client_mappings":
            for c in ("status", "payment_status"):
                ct = info.get(c, {}).get("COLUMN_TYPE", "")
                out(f"G2 mappings.{c} type={ct}")
                if ct.lower().startswith("enum"):
                    v = "CANCELLED" if c == "status" else "REJECTED"
                    gate(f"G2_mappings_{c}_enum", f"'{v}'" in ct)
            out(f"G2 termination_reason type={info.get('termination_reason', {}).get('COLUMN_TYPE')}")

    # ---------- G3 links ----------
    def has_col(t, c):
        cur.execute("""SELECT COUNT(*) n FROM information_schema.COLUMNS
                       WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s AND COLUMN_NAME=%s""", (t, c))
        return cur.fetchone()["n"] > 0

    def cnt(t, where, args):
        cur.execute(f"SELECT COUNT(*) n FROM `{t}` WHERE {where}", args)
        return cur.fetchone()["n"]

    blocking_mapping_refs = [
        ("shop_client_order_lines", "consultant_client_mapping_id"),
        ("session_compensation_history", "mapping_id"),
        ("session_extension_requests", "mapping_id"),
        ("discount_accounting_transactions", "mapping_id"),
        ("client_satisfaction_surveys", "mapping_id"),
        ("institution_link_consultation_logs", "mapping_id"),
        ("session_recovery_alerts", "mapping_id"),
        ("special_support_monthly_payouts", "mapping_id"),
        ("visit_prediction_settings", "mapping_id"),
    ]
    for t, c in blocking_mapping_refs:
        if not has_col(t, c):
            out(f"G3 info: {t}.{c} not present — skip")
            continue
        n = cnt(t, f"`{c}` IN (386,388,430)", ())
        gate(f"G3_{t}_mapping_ref_zero", n == 0, f"rows={n}")
    sched_mapping_tables = ["client_satisfaction_surveys",
                            "institution_link_consultation_logs", "session_recovery_alerts"]
    for t in sched_mapping_tables:
        if has_col(t, "schedule_id"):
            n = cnt(t, "schedule_id IN (689,781)", ())
            gate(f"G3_{t}_schedule_ref_zero", n == 0, f"rows={n}")
    # client_schedule_notes: 재학 결정 B(2026-11-26 15:17) — 변경하지 않음, 경고만 + 현재 행 출력(내용 미출력)
    if has_col("client_schedule_notes", "mapping_id"):
        cur.execute("""SELECT id, schedule_id, mapping_id, created_at FROM client_schedule_notes
                       WHERE tenant_id=%s AND (client_id=%s OR mapping_id IN (386,388,430)
                             OR schedule_id IN (687,689,781))
                       ORDER BY id""", (TENANT, CLIENT_ID))
        nrows = cur.fetchall()
        for r in nrows:
            out(f"NOTE row id={r['id']} schedule_id={r['schedule_id']} mapping_id={r['mapping_id']} created_at={r['created_at']}")
        linked = [r for r in nrows if r["mapping_id"] in (386, 430) or r["schedule_id"] in (689, 781)]
        out(f"WARN: G3_client_schedule_notes rows={len(nrows)} linked_to_386_430_or_689_781={len(linked)} "
            "— 변경하지 않음(결정 B), 통과")
    # 정보용: 일정 id만 참조(매핑 값 비저장) → 이번 변경 영향 없음
    for t, c in (("consultation_records", "consultation_id"), ("consultant_ratings", "schedule_id"),
                 ("consultation_record_alerts", "schedule_id"), ("admin_request_idempotency", "mapping_id")):
        if has_col(t, c):
            ids = "(386,388,430)" if c == "mapping_id" else "(687,689,781)"
            out(f"G3 info: {t}.{c} IN {ids} rows={cnt(t, f'`{c}` IN {ids}', ())} (mapping 값 비저장, 변경 영향 없음)")
    if has_col("consultation_records", "mapping_id"):
        n = cnt("consultation_records", "mapping_id IN (386,430)", ())
        gate("G3_consultation_records_mapping_ref_zero", n == 0, f"rows={n}")
    if has_col("salary_calculations", "calculation_period_start") and has_col("salary_calculations", "tenant_id"):
        cur.execute("""SELECT COUNT(*) n FROM salary_calculations WHERE tenant_id=%s AND consultant_id=%s
                       AND calculation_period_start <= '2026-11-30' AND calculation_period_end >= '2026-11-01'""",
                    (TENANT, CONSULTANT_ID))
        out(f"G3 info: salary_calculations consultant3 2026-11 rows={cur.fetchone()['n']} "
            "(완료 일정 건수 기준 — 일정 상태·건수 불변이라 영향 없음)")

    # ---------- G4 pre-values (locked) ----------
    conn.begin()
    cur.execute("""SELECT id, consultant_id, client_id, status, payment_status, payment_timing, total_sessions,
                          used_sessions, remaining_sessions, package_name, payment_amount, payment_date, is_deleted
                   FROM consultant_client_mappings WHERE tenant_id=%s AND id IN (386,388,430) ORDER BY id FOR UPDATE""",
                (TENANT,))
    m = {r["id"]: r for r in cur.fetchall()}
    exp_m = {
        386: dict(status="SESSIONS_EXHAUSTED", payment_status="APPROVED", payment_timing="SAME_DAY_CARD",
                  total_sessions=1, used_sessions=1, remaining_sessions=0),
        388: dict(status="ACTIVE", payment_status="APPROVED", payment_timing="ADVANCE",
                  total_sessions=5, used_sessions=0, remaining_sessions=5),
        430: dict(status="PENDING_PAYMENT", payment_status="PENDING", payment_timing="SAME_DAY_CARD",
                  total_sessions=1, used_sessions=0, remaining_sessions=0),
    }
    for mid, exp in exp_m.items():
        r = m.get(mid)
        ok = r is not None and r["consultant_id"] == CONSULTANT_ID and r["client_id"] == CLIENT_ID \
            and not _is_true(r["is_deleted"]) and all(r[k] == v for k, v in exp.items())
        if mid == 430:
            ok = ok and r["payment_date"] is None
        show = {k: (str(v) if v is not None else None) for k, v in (r or {}).items()}
        out(f"PRE mapping {mid}: {json.dumps(show, ensure_ascii=False)}")
        gate(f"G4_mapping_{mid}_pre", ok)

    cur.execute("""SELECT id, mapping_id, client_id, consultant_id, date, status, session_sequence, is_deleted
                   FROM schedules WHERE tenant_id=%s AND client_id=%s AND (is_deleted=0 OR is_deleted IS NULL)
                   ORDER BY id FOR UPDATE""", (TENANT, CLIENT_ID))
    s = {r["id"]: r for r in cur.fetchall()}
    for r in s.values():
        out(f"PRE schedule {r['id']}: mapping={r['mapping_id']} date={r['date']} status={r['status']} seq={r['session_sequence']}")
    gate("G4_client_schedules_exact_set", sorted(s) == [687, 689, 781], f"ids={sorted(s)}")
    exp_s = {687: (386, 1), 689: (386, 2), 781: (430, 1)}
    for sid, (mid, seq) in exp_s.items():
        r = s.get(sid)
        gate(f"G4_schedule_{sid}_pre", r is not None and r["mapping_id"] == mid and r["session_sequence"] == seq
             and r["consultant_id"] == CONSULTANT_ID and r["status"] == "COMPLETED")
    cur.execute("SELECT COUNT(*) n FROM schedules WHERE tenant_id=%s AND mapping_id=388", (TENANT,))
    gate("G4_no_schedule_on_388", cur.fetchone()["n"] == 0)
    cur.execute("""SELECT COUNT(*) n FROM financial_transactions WHERE tenant_id=%s AND related_entity_id=430
                   AND related_entity_type LIKE '%%MAPPING%%'""", (TENANT,))
    ft430 = cur.fetchone()["n"]
    gate("G4_430_no_ft", ft430 == 0, f"rows={ft430}")
    cur.execute("""SELECT COUNT(*) n FROM accounting_entries a JOIN financial_transactions f
                   ON f.id=a.financial_transaction_id WHERE a.tenant_id=%s AND f.related_entity_id=430
                   AND f.related_entity_type LIKE '%%MAPPING%%'""", (TENANT,))
    gate("G4_430_no_journal", cur.fetchone()["n"] == 0)
    if has_col("payments", "payer_id") and has_col("payments", "tenant_id"):
        cur.execute("""SELECT COUNT(*) n FROM payments WHERE tenant_id=%s AND payer_id=%s
                       AND created_at >= '2026-11-26'""", (TENANT, CLIENT_ID))
        n = cur.fetchone()["n"]
        gate("G4_no_payment_rows_client105_today", n == 0, f"rows={n}")
    cur.execute("""SELECT COUNT(*) n FROM shop_client_order_lines WHERE consultant_client_mapping_id=430""")
    gate("G4_430_no_order_line", cur.fetchone()["n"] == 0)

    if failures:
        conn.rollback()
        out(f"RESULT: GATE FAIL {failures} — no write executed, ROLLBACK")
        sys.exit(2)

    # ---------- writes ----------
    rc = []
    cur.execute("""UPDATE schedules SET mapping_id=388, session_sequence=1, updated_at=NOW()
                   WHERE tenant_id=%s AND id=689 AND client_id=%s AND mapping_id=386 AND session_sequence=2""",
                (TENANT, CLIENT_ID)); rc.append(cur.rowcount)
    cur.execute("""UPDATE schedules SET mapping_id=388, session_sequence=2, updated_at=NOW()
                   WHERE tenant_id=%s AND id=781 AND client_id=%s AND mapping_id=430 AND session_sequence=1""",
                (TENANT, CLIENT_ID)); rc.append(cur.rowcount)
    cur.execute("""UPDATE consultant_client_mappings SET used_sessions=2, remaining_sessions=3, updated_at=NOW()
                   WHERE tenant_id=%s AND id=388 AND client_id=%s AND status='ACTIVE'
                     AND total_sessions=5 AND used_sessions=0 AND remaining_sessions=5""",
                (TENANT, CLIENT_ID)); rc.append(cur.rowcount)
    cur.execute("""UPDATE consultant_client_mappings SET status='CANCELLED', payment_status='REJECTED',
                          terminated_at=NOW(), termination_reason=%s, updated_at=NOW()
                   WHERE tenant_id=%s AND id=430 AND client_id=%s AND status='PENDING_PAYMENT'
                     AND payment_status='PENDING' AND used_sessions=0 AND payment_date IS NULL""",
                (REASON + ": 일정 781을 배정 388로 이관", TENANT, CLIENT_ID)); rc.append(cur.rowcount)
    hist = [
        (TENANT, 388, CLIENT_ID, CONSULTANT_ID, "SESSION_USED",
         json.dumps({"totalSessions": 5, "usedSessions": 0, "remainingSessions": 5, "status": "ACTIVE"}),
         json.dumps({"totalSessions": 5, "usedSessions": 2, "remainingSessions": 3, "status": "ACTIVE"}),
         REASON + " (schedule 689,781 이관)"),
        (TENANT, 430, CLIENT_ID, CONSULTANT_ID, "STATUS_CHANGED",
         json.dumps({"status": "PENDING_PAYMENT", "paymentStatus": "PENDING", "totalSessions": 1, "usedSessions": 0, "remainingSessions": 0}),
         json.dumps({"status": "CANCELLED", "paymentStatus": "REJECTED", "totalSessions": 1, "usedSessions": 0, "remainingSessions": 0}),
         REASON + " (가예약 배정 취소, 일정 781 -> 388)"),
        (TENANT, 386, CLIENT_ID, CONSULTANT_ID, "UPDATED",
         json.dumps({"totalSessions": 1, "usedSessions": 1, "remainingSessions": 0, "status": "SESSIONS_EXHAUSTED", "usedBySchedule": 689}),
         json.dumps({"totalSessions": 1, "usedSessions": 1, "remainingSessions": 0, "status": "SESSIONS_EXHAUSTED", "usedBySchedule": 687}),
         REASON + " (차감 근거 687로 정정, 값 불변)"),
    ]
    cur.executemany("""INSERT INTO consultant_client_mapping_history
        (tenant_id, mapping_id, client_id, consultant_id, event_type, before_state_json, after_state_json,
         triggered_by_user_id, reason, created_at)
        VALUES (%s,%s,%s,%s,%s,%s,%s,NULL,%s,NOW())""", hist); rc.append(cur.rowcount)
    out(f"ROWCOUNTS sched689/sched781/map388/map430/history = {rc}")
    if rc != [1, 1, 1, 1, 3]:
        conn.rollback()
        out("RESULT: ROWCOUNT MISMATCH — ROLLBACK")
        sys.exit(3)

    cur.execute("""SELECT id, status, payment_status, total_sessions, used_sessions, remaining_sessions,
                   terminated_at IS NOT NULL AS has_terminated_at FROM consultant_client_mappings
                   WHERE tenant_id=%s AND id IN (386,388,430) ORDER BY id""", (TENANT,))
    for r in cur.fetchall():
        out(f"IN-TX mapping {r}")
    cur.execute("""SELECT id, mapping_id, session_sequence, status FROM schedules
                   WHERE tenant_id=%s AND id IN (687,689,781) ORDER BY id""", (TENANT,))
    for r in cur.fetchall():
        out(f"IN-TX schedule {r}")

    if APPLY:
        conn.commit()
        out("RESULT: COMMIT")
    else:
        conn.rollback()
        out("RESULT: DRY-RUN PASS — ROLLBACK (no change persisted)")
    conn.close()


if __name__ == "__main__":
    main()
