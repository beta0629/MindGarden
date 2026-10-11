#!/usr/bin/env python3
"""Match a client inside a cancelled-schedule cohort without printing plaintext PII.

Reads a TSV of src, id, tenant_id, HEX(name). Decrypts AES-CBC (v1) and AES-GCM (v2)
the same way as PersonalDataEncryptionUtil, then writes integer ids and a masked label.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import os
import sys
import unicodedata
from dataclasses import dataclass


def decode_material(value: str) -> bytes:
    text = value.strip()
    try:
        return base64.b64decode(text, validate=True)
    except Exception:
        return text.encode("utf-8")


def normalize_key(raw: bytes) -> bytes:
    if len(raw) == 32:
        return raw
    if len(raw) > 32:
        return raw[:32]
    return hashlib.sha256(raw).digest()


def normalize_iv(raw: bytes) -> bytes:
    if len(raw) == 16:
        return raw
    if len(raw) > 16:
        return raw[:16]
    hashed = hashlib.sha256(raw).digest()
    return hashed[:16]


@dataclass
class KeyMaterial:
    key_id: str
    key: bytes
    iv: bytes


def parse_csv_map(raw: str) -> dict[str, str]:
    result: dict[str, str] = {}
    if not raw:
        return result
    for entry in raw.split(","):
        item = entry.strip()
        if not item or ":" not in item:
            continue
        key_id, value = item.split(":", 1)
        key_id = key_id.strip()
        value = value.strip()
        if key_id and value:
            result[key_id] = value
    return result


def load_keys() -> list[KeyMaterial]:
    keys = parse_csv_map(os.environ.get("PII_KEYS", ""))
    ivs = parse_csv_map(os.environ.get("PII_IVS", ""))
    legacy_key = os.environ.get("PII_LEGACY_KEY", "").strip()
    legacy_iv = os.environ.get("PII_LEGACY_IV", "").strip()
    if not keys and legacy_key:
        keys = {"legacy": legacy_key}
        if legacy_iv:
            ivs = {"legacy": legacy_iv}
    materials: list[KeyMaterial] = []
    for key_id, key_value in keys.items():
        iv_value = ivs.get(key_id) or legacy_iv
        if not iv_value:
            continue
        materials.append(
            KeyMaterial(
                key_id=key_id,
                key=normalize_key(decode_material(key_value)),
                iv=normalize_iv(decode_material(iv_value)),
            )
        )
    return materials


def mask_name(name: str) -> str:
    chars = list(name)
    if not chars:
        return ""
    if len(chars) == 1:
        return "*"
    if len(chars) == 2:
        return chars[0] + "*"
    return chars[0] + ("*" * (len(chars) - 2)) + chars[-1]


def normalize_plain(value: str) -> str:
    text = unicodedata.normalize("NFC", value).strip()
    if text.startswith("legacy::"):
        text = text[len("legacy::") :]
    return text.strip()


def decrypt_cbc(payload_b64: str, material: KeyMaterial) -> str:
    from cryptography.hazmat.primitives import padding
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

    raw = base64.b64decode(payload_b64)
    cipher = Cipher(algorithms.AES(material.key), modes.CBC(material.iv))
    decryptor = cipher.decryptor()
    padded = decryptor.update(raw) + decryptor.finalize()
    unpadder = padding.PKCS7(128).unpadder()
    data = unpadder.update(padded) + unpadder.finalize()
    return data.decode("utf-8")


def decrypt_gcm(payload_b64: str, material: KeyMaterial) -> str:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    payload = base64.b64decode(payload_b64)
    if len(payload) <= 12:
        raise ValueError("short gcm payload")
    nonce, cipher_and_tag = payload[:12], payload[12:]
    return AESGCM(material.key).decrypt(nonce, cipher_and_tag, None).decode("utf-8")


def split_cipher(stored: str) -> tuple[str, str, bool] | None:
    marker = "::"
    if marker not in stored:
        return None
    head, payload = stored.split(marker, 1)
    if not head or not payload:
        return None
    if head.endswith(":v2"):
        key_id = head[: -len(":v2")]
        if not key_id:
            return None
        return key_id, payload, True
    return head, payload, False


def decrypt_stored(stored: str, materials: list[KeyMaterial]) -> str | None:
    parsed = split_cipher(stored)
    if parsed is None:
        return None
    key_id, payload, random_iv = parsed
    ordered = [item for item in materials if item.key_id == key_id]
    ordered.extend(item for item in materials if item.key_id != key_id)
    for material in ordered:
        try:
            if random_iv:
                return decrypt_gcm(payload, material)
            return decrypt_cbc(payload, material)
        except Exception:
            continue
    return None


def names_equal(left: str, right: str) -> bool:
    return normalize_plain(left) == normalize_plain(right)


def match_candidates(lines: list[str], needle: str, materials: list[KeyMaterial]) -> dict:
    distinct_ids: set[int] = set()
    decrypt_ok = 0
    decrypt_fail = 0
    plaintext_match = 0
    cipher_match = 0
    matched: dict[int, str] = {}
    tenants: dict[int, str] = {}

    for line in lines:
        parts = line.rstrip("\n").split("\t")
        if len(parts) < 4:
            continue
        _src, id_text, tenant_id, name_hex = parts[0], parts[1], parts[2], parts[3]
        if not id_text.isdigit():
            continue
        client_id = int(id_text)
        distinct_ids.add(client_id)
        tenants.setdefault(client_id, tenant_id)
        if not name_hex or name_hex == "NULL":
            continue
        try:
            stored = bytes.fromhex(name_hex).decode("utf-8")
        except Exception:
            decrypt_fail += 1
            continue
        plain = None
        if split_cipher(stored) is None:
            plain = stored
            if names_equal(plain, needle):
                plaintext_match += 1
                matched[client_id] = normalize_plain(plain)
            continue
        plain = decrypt_stored(stored, materials)
        if plain is None:
            decrypt_fail += 1
            continue
        decrypt_ok += 1
        if names_equal(plain, needle):
            cipher_match += 1
            matched[client_id] = normalize_plain(plain)

    masked = [
        f"{client_id}:{mask_name(matched[client_id])}:tenant={tenants.get(client_id, '')}"
        for client_id in sorted(matched)
    ]
    return {
        "distinct_clients": len(distinct_ids),
        "decrypt_ok": decrypt_ok,
        "decrypt_fail": decrypt_fail,
        "plaintext_match": plaintext_match,
        "cipher_match": cipher_match,
        "matched_ids": sorted(matched),
        "masked": masked,
        "key_count": len(materials),
    }


def write_report(path: str, cohort_rows: int, result: dict) -> None:
    ids = result["matched_ids"]
    lines = [
        f"cohort_rows={cohort_rows}",
        f"distinct_clients={result['distinct_clients']}",
        f"key_count={result['key_count']}",
        f"decrypt_ok={result['decrypt_ok']}",
        f"decrypt_fail={result['decrypt_fail']}",
        f"plaintext_match={result['plaintext_match']}",
        f"cipher_match={result['cipher_match']}",
        "matched_ids=" + (",".join(str(item) for item in ids) if ids else ""),
        "masked=" + (";".join(result["masked"]) if result["masked"] else ""),
    ]
    with open(path, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")


def self_test() -> None:
    from cryptography.hazmat.primitives import padding
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

    needle = "홍길동"
    key = hashlib.sha256(b"self-test-key").digest()
    iv = hashlib.sha256(b"self-test-iv").digest()[:16]
    padder = padding.PKCS7(128).padder()
    padded = padder.update(needle.encode("utf-8")) + padder.finalize()
    encryptor = Cipher(algorithms.AES(key), modes.CBC(iv)).encryptor()
    raw = encryptor.update(padded) + encryptor.finalize()
    stored = "v1::" + base64.b64encode(raw).decode("ascii")
    os.environ["PII_KEYS"] = "v1:" + base64.b64encode(key).decode("ascii")
    os.environ["PII_IVS"] = "v1:" + base64.b64encode(iv).decode("ascii")
    materials = load_keys()
    plain = decrypt_stored(stored, materials)
    if plain != needle:
        raise SystemExit("self-test decrypt mismatch")
    if mask_name(needle) != "홍*동":
        raise SystemExit("self-test mask mismatch")
    line = "users\t7\ttenant-demo\t" + stored.encode("utf-8").hex()
    result = match_candidates([line, "users\t8\ttenant-demo\t" + "다른".encode("utf-8").hex()], needle, materials)
    if result["matched_ids"] != [7] or result["cipher_match"] != 1:
        raise SystemExit(f"self-test match mismatch: {result}")
    print("self-test ok")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--candidates")
    parser.add_argument("--ids-out")
    parser.add_argument("--report-out")
    parser.add_argument("--needle-b64")
    parser.add_argument("--needle-cps", help="comma-separated unicode code points")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0
    if not args.candidates or not args.ids_out or not args.report_out:
        print("name match arguments missing", file=sys.stderr)
        return 2
    if args.needle_cps:
        needle = "".join(chr(int(part)) for part in args.needle_cps.split(",") if part)
    elif args.needle_b64:
        needle = base64.b64decode(args.needle_b64).decode("utf-8")
    else:
        print("needle missing", file=sys.stderr)
        return 2
    with open(args.candidates, encoding="utf-8") as handle:
        lines = [line for line in handle if line.strip()]
    materials = load_keys()
    result = match_candidates(lines, needle, materials)
    write_report(args.report_out, len(lines), result)
    with open(args.ids_out, "w", encoding="utf-8") as handle:
        for client_id in result["matched_ids"]:
            handle.write(f"{client_id}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
