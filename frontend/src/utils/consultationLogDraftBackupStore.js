/**
 * 상담일지 초안 **브라우저 백업** 저장소 — 메모리 우선, 불가피할 때만 암호화 IndexedDB.
 *
 * <h3>왜 이렇게 하나</h3>
 * <p>초안 본문은 민감 상담 기록이다. 1차 저장소는 서버(암호화·작성자 전용)이며,
 * 이 모듈은 <strong>서버 저장 실패·오프라인</strong> 상황에서만 쓰는 2차 백업이다.</p>
 * <ul>
 *   <li>같은 탭이 살아 있는 동안은 <strong>메모리</strong>만 쓴다(디스크 흔적 없음).</li>
 *   <li>새로고침·탭 종료를 견디려면 디스크가 필요하므로 IndexedDB 에 쓰되,
 *       <strong>WebCrypto AES-GCM</strong> 으로 암호화한다.</li>
 *   <li>키는 {@code extractable: false} 로 생성해 메모리에만 둔다. 즉
 *       <strong>세션이 끝나면 복호화 자체가 불가능</strong>하다.</li>
 * </ul>
 *
 * <h3>트레이드오프 (의도된 설계)</h3>
 * <p>키를 디스크에 두지 않으므로 "탭을 완전히 닫았다가 다시 열어" 백업을 복구하는 일은
 * 불가능하다. 그 경우의 복구는 <strong>서버 초안</strong>이 담당한다. 재로그인 복구도
 * 서버 초안 경로다(브라우저 백업은 같은 세션의 오프라인 복구 전용). 키를 디스크에 두면
 * 분실 단말에서 본문이 복호화되므로, 복구 범위를 좁히는 쪽을 택했다.</p>
 *
 * <p>레코드 키에는 userId 를 포함해 계정 전환 시 다른 사용자가 읽지 못하게 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

import {
  CONSULTATION_LOG_BACKUP_CRYPTO_ALGORITHM,
  CONSULTATION_LOG_BACKUP_CRYPTO_IV_BYTES,
  CONSULTATION_LOG_BACKUP_CRYPTO_KEY_LENGTH,
  CONSULTATION_LOG_BACKUP_DB_NAME,
  CONSULTATION_LOG_BACKUP_DB_VERSION,
  CONSULTATION_LOG_BACKUP_STORE_NAME
} from '../constants/consultationLogAutosaveConstants';

/** 세션 동안만 유지되는 메모리 1차 백업: recordKey -> { payloadJson, savedAt } */
const memoryBackups = new Map();

/** 세션 AES-GCM 키 (non-extractable). 탭이 닫히면 사라진다. */
let sessionKeyPromise = null;

/**
 * 초안 백업 레코드 키. userId 를 포함해 계정 전환 시 교차 접근을 막는다.
 *
 * @param {{ userId: string|number, tenantId: string, consultationId: string|number }} scope
 * @returns {string}
 */
export function buildDraftBackupRecordKey({ userId, tenantId, consultationId } = {}) {
  const parts = [userId, tenantId, consultationId]
    .map((value) => (value == null ? '' : String(value).trim()));
  // 식별자가 하나라도 비면 다른 사용자·테넌트의 백업과 키가 겹칠 수 있으므로 키를 만들지 않는다
  if (parts.some((value) => value === '')) return null;
  return `u${parts[0]}:t${parts[1]}:c${parts[2]}`;
}

function getCryptoSubtle() {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  return cryptoObj && cryptoObj.subtle ? cryptoObj : null;
}

function hasIndexedDb() {
  return typeof indexedDB !== 'undefined' && indexedDB != null;
}

/**
 * 세션 키를 얻는다(없으면 생성). 추출 불가(extractable=false)로 만들어 메모리에만 존재한다.
 *
 * @returns {Promise<CryptoKey|null>} WebCrypto 미지원이면 null
 */
async function getSessionKey() {
  const cryptoObj = getCryptoSubtle();
  if (!cryptoObj) return null;
  if (!sessionKeyPromise) {
    sessionKeyPromise = cryptoObj.subtle.generateKey(
      { name: CONSULTATION_LOG_BACKUP_CRYPTO_ALGORITHM, length: CONSULTATION_LOG_BACKUP_CRYPTO_KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    ).catch(() => null);
  }
  return sessionKeyPromise;
}

function openBackupDb() {
  return new Promise((resolve) => {
    if (!hasIndexedDb()) {
      resolve(null);
      return;
    }
    let request;
    try {
      request = indexedDB.open(CONSULTATION_LOG_BACKUP_DB_NAME, CONSULTATION_LOG_BACKUP_DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CONSULTATION_LOG_BACKUP_STORE_NAME)) {
        db.createObjectStore(CONSULTATION_LOG_BACKUP_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

function runStoreRequest(mode, action) {
  return openBackupDb().then((db) => {
    if (!db) return null;
    return new Promise((resolve) => {
      let tx;
      try {
        tx = db.transaction(CONSULTATION_LOG_BACKUP_STORE_NAME, mode);
      } catch {
        db.close();
        resolve(null);
        return;
      }
      const store = tx.objectStore(CONSULTATION_LOG_BACKUP_STORE_NAME);
      let result = null;
      try {
        const req = action(store);
        if (req) {
          req.onsuccess = () => { result = req.result; };
        }
      } catch {
        // 아래 oncomplete/onerror 에서 정리
      }
      tx.oncomplete = () => { db.close(); resolve(result); };
      tx.onerror = () => { db.close(); resolve(null); };
      tx.onabort = () => { db.close(); resolve(null); };
    });
  });
}

/**
 * 초안 백업 저장. 메모리에 먼저 쓰고, 가능하면 암호화해 IndexedDB 에도 쓴다.
 *
 * @param {{ userId: string|number, tenantId: string, consultationId: string|number }} scope
 * @param {string} payloadJson 서버 초안과 같은 JSON 문자열
 * @returns {Promise<{ memory: boolean, persisted: boolean }>}
 */
export async function saveDraftBackup(scope, payloadJson) {
  const recordKey = buildDraftBackupRecordKey(scope);
  if (!recordKey) return { memory: false, persisted: false };
  const savedAt = Date.now();
  memoryBackups.set(recordKey, { payloadJson, savedAt });

  const key = await getSessionKey();
  const cryptoObj = getCryptoSubtle();
  if (!key || !cryptoObj) {
    return { memory: true, persisted: false };
  }
  try {
    const iv = cryptoObj.getRandomValues(new Uint8Array(CONSULTATION_LOG_BACKUP_CRYPTO_IV_BYTES));
    const cipher = await cryptoObj.subtle.encrypt(
      { name: CONSULTATION_LOG_BACKUP_CRYPTO_ALGORITHM, iv },
      key,
      new TextEncoder().encode(payloadJson)
    );
    const written = await runStoreRequest('readwrite', (store) =>
      store.put({ iv: Array.from(iv), cipher: Array.from(new Uint8Array(cipher)), savedAt }, recordKey));
    return { memory: true, persisted: written !== null };
  } catch {
    return { memory: true, persisted: false };
  }
}

/**
 * 초안 백업 읽기. 메모리 → IndexedDB(같은 세션 키로만 복호화 가능) 순.
 *
 * @param {{ userId: string|number, tenantId: string, consultationId: string|number }} scope
 * @returns {Promise<{ payloadJson: string, savedAt: number }|null>}
 */
export async function readDraftBackup(scope) {
  const recordKey = buildDraftBackupRecordKey(scope);
  if (!recordKey) return null;
  const inMemory = memoryBackups.get(recordKey);
  if (inMemory) return inMemory;

  const key = await getSessionKey();
  const cryptoObj = getCryptoSubtle();
  if (!key || !cryptoObj) return null;
  const stored = await runStoreRequest('readonly', (store) => store.get(recordKey));
  if (!stored || !Array.isArray(stored.iv) || !Array.isArray(stored.cipher)) return null;
  try {
    const plain = await cryptoObj.subtle.decrypt(
      { name: CONSULTATION_LOG_BACKUP_CRYPTO_ALGORITHM, iv: new Uint8Array(stored.iv) },
      key,
      new Uint8Array(stored.cipher)
    );
    return { payloadJson: new TextDecoder().decode(plain), savedAt: stored.savedAt };
  } catch {
    // 다른 세션에서 쓴 백업 — 키가 없어 복호화 불가. 설계상 정상.
    return null;
  }
}

/**
 * 단일 초안 백업 삭제 (확정 저장·버리기).
 *
 * @param {{ userId: string|number, tenantId: string, consultationId: string|number }} scope
 * @returns {Promise<void>}
 */
export async function removeDraftBackup(scope) {
  const recordKey = buildDraftBackupRecordKey(scope);
  if (!recordKey) return;
  memoryBackups.delete(recordKey);
  await runStoreRequest('readwrite', (store) => store.delete(recordKey));
}

/**
 * 모든 초안 백업 삭제 (로그아웃·계정 전환). 세션 키도 폐기한다.
 *
 * @returns {Promise<void>}
 */
export async function purgeAllDraftBackups() {
  memoryBackups.clear();
  sessionKeyPromise = null;
  await runStoreRequest('readwrite', (store) => store.clear());
}

/**
 * 테스트 전용 — 메모리 백업만 비운다(IndexedDB·세션 키는 유지).
 */
export function __resetDraftBackupMemoryForTest() {
  memoryBackups.clear();
}
