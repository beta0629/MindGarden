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
 * <h3>401 보관 백업 (예외)</h3>
 * <p>세션 만료(401)로 로그인 화면으로 이동하면 페이지가 다시 로드되어 메모리 세션 키가 사라진다.
 * 이때 서버 초안도 저장되지 않았으므로, 401 직전 입력만은 <strong>보관용 키</strong>로 암호화한다.
 * 보관용 키도 추출 불가 CryptoKey 이며 IndexedDB 에만 있다. 이 백업은</p>
 * <ul>
 *   <li>세션 정리(401·중복 로그인 종료)에서는 지우지 않고,</li>
 *   <li>명시적 로그아웃·계정 전환·다른 사용자 로그인·복원/확정 저장·{@code TTL} 경과 시 지운다.</li>
 * </ul>
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
  CONSULTATION_LOG_BACKUP_RESCUE_KEY_RECORD,
  CONSULTATION_LOG_BACKUP_RESCUE_TTL_MS,
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

function isRescueKeyRecord(recordKey) {
  return recordKey === CONSULTATION_LOG_BACKUP_RESCUE_KEY_RECORD;
}

/**
 * 401 보관용 키를 IndexedDB 에서 읽고, 없으면 만들어 저장한다(추출 불가 CryptoKey).
 *
 * @param {{ create: boolean }} options create=false 면 읽기만
 * @returns {Promise<CryptoKey|null>}
 */
async function getRescueKey({ create }) {
  const cryptoObj = getCryptoSubtle();
  if (!cryptoObj) return null;
  const stored = await runStoreRequest('readonly', (store) => store.get(CONSULTATION_LOG_BACKUP_RESCUE_KEY_RECORD));
  if (stored && stored.key) return stored.key;
  if (!create) return null;
  let key;
  try {
    key = await cryptoObj.subtle.generateKey(
      { name: CONSULTATION_LOG_BACKUP_CRYPTO_ALGORITHM, length: CONSULTATION_LOG_BACKUP_CRYPTO_KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  } catch {
    return null;
  }
  const written = await runStoreRequest('readwrite', (store) =>
    store.put({ key, createdAt: Date.now() }, CONSULTATION_LOG_BACKUP_RESCUE_KEY_RECORD));
  return written === null ? null : key;
}

/** 모든 레코드 [key, value] 를 읽는다. IndexedDB 가 없으면 빈 배열. */
async function readAllEntries() {
  const entries = [];
  await runStoreRequest('readonly', (store) => {
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      entries.push([cursor.key, cursor.value]);
      cursor.continue();
    };
    return null;
  });
  return entries;
}

/** 주어진 레코드 키들을 지운다. */
async function deleteKeys(recordKeys) {
  if (recordKeys.length === 0) return;
  await runStoreRequest('readwrite', (store) => {
    recordKeys.forEach((recordKey) => store.delete(recordKey));
    return null;
  });
}

/** 남은 401 보관 백업이 없으면 보관용 키도 지운다. */
async function dropRescueKeyIfUnused() {
  const entries = await readAllEntries();
  const hasRescue = entries.some(([recordKey, value]) => !isRescueKeyRecord(recordKey) && value?.rescue === true);
  if (!hasRescue && entries.some(([recordKey]) => isRescueKeyRecord(recordKey))) {
    await deleteKeys([CONSULTATION_LOG_BACKUP_RESCUE_KEY_RECORD]);
  }
}

function isRescueExpired(value, now) {
  return typeof value?.savedAt !== 'number' || now - value.savedAt > CONSULTATION_LOG_BACKUP_RESCUE_TTL_MS;
}

/**
 * 초안 백업 저장. 메모리에 먼저 쓰고, 가능하면 암호화해 IndexedDB 에도 쓴다.
 *
 * <p>{@code rescue: true}(401 직전)면 세션 키 대신 보관용 키로 암호화해 새로고침·재로그인 뒤에도
 * 복원할 수 있게 하고, 쓴 뒤 레코드를 다시 읽어 실제로 남았는지 확인한다.</p>
 *
 * @param {{ userId: string|number, tenantId: string, consultationId: string|number }} scope
 * @param {string} payloadJson 서버 초안과 같은 JSON 문자열
 * @param {{ rescue?: boolean }} [options]
 * @returns {Promise<{ memory: boolean, persisted: boolean }>} persisted = IndexedDB 에 실제로 남음
 */
export async function saveDraftBackup(scope, payloadJson, options = {}) {
  const recordKey = buildDraftBackupRecordKey(scope);
  if (!recordKey) return { memory: false, persisted: false };
  const rescue = options.rescue === true;
  const savedAt = Date.now();
  memoryBackups.set(recordKey, { payloadJson, savedAt });

  const key = rescue ? await getRescueKey({ create: true }) : await getSessionKey();
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
    const value = { iv: Array.from(iv), cipher: Array.from(new Uint8Array(cipher)), savedAt };
    if (rescue) value.rescue = true;
    const written = await runStoreRequest('readwrite', (store) => store.put(value, recordKey));
    if (written === null) return { memory: true, persisted: false };
    if (!rescue) return { memory: true, persisted: true };
    const readBack = await runStoreRequest('readonly', (store) => store.get(recordKey));
    return { memory: true, persisted: Boolean(readBack && readBack.rescue === true && readBack.savedAt === savedAt) };
  } catch {
    return { memory: true, persisted: false };
  }
}

/**
 * 초안 백업 읽기. 메모리 → IndexedDB 순. 세션 백업은 같은 세션 키로만, 401 보관 백업은
 * 보관용 키로 복호화한다. 보관 기간이 지난 401 백업은 지우고 null.
 *
 * @param {{ userId: string|number, tenantId: string, consultationId: string|number }} scope
 * @returns {Promise<{ payloadJson: string, savedAt: number }|null>}
 */
export async function readDraftBackup(scope) {
  const recordKey = buildDraftBackupRecordKey(scope);
  if (!recordKey) return null;
  const inMemory = memoryBackups.get(recordKey);
  if (inMemory) return inMemory;

  const cryptoObj = getCryptoSubtle();
  if (!cryptoObj) return null;
  const stored = await runStoreRequest('readonly', (store) => store.get(recordKey));
  if (!stored || !Array.isArray(stored.iv) || !Array.isArray(stored.cipher)) return null;
  if (stored.rescue === true && isRescueExpired(stored, Date.now())) {
    await deleteKeys([recordKey]);
    await dropRescueKeyIfUnused();
    return null;
  }
  const key = stored.rescue === true ? await getRescueKey({ create: false }) : await getSessionKey();
  if (!key) return null;
  try {
    const plain = await cryptoObj.subtle.decrypt(
      { name: CONSULTATION_LOG_BACKUP_CRYPTO_ALGORITHM, iv: new Uint8Array(stored.iv) },
      key,
      new Uint8Array(stored.cipher)
    );
    return { payloadJson: new TextDecoder().decode(plain), savedAt: stored.savedAt };
  } catch {
    // 다른 세션에서 쓴 세션 백업 — 키가 없어 복호화 불가. 설계상 정상.
    return null;
  }
}

/**
 * 단일 초안 백업 삭제 (확정 저장·버리기·복원 후 서버 저장 성공).
 *
 * @param {{ userId: string|number, tenantId: string, consultationId: string|number }} scope
 * @returns {Promise<void>}
 */
export async function removeDraftBackup(scope) {
  const recordKey = buildDraftBackupRecordKey(scope);
  if (!recordKey) return;
  memoryBackups.delete(recordKey);
  await deleteKeys([recordKey]);
  await dropRescueKeyIfUnused();
}

/**
 * 초안 백업 일괄 삭제. 세션 키는 항상 폐기한다.
 *
 * <ul>
 *   <li>기본(명시적 로그아웃·계정 전환): 401 보관 백업·보관용 키까지 전량 삭제.</li>
 *   <li>{@code keepRescue: true}(세션 정리 — 401·중복 로그인 종료): 401 보관 백업과 보관용 키는 남기고
 *       세션 백업만 지운다. 재로그인 뒤 같은 일정을 열면 복원을 제안하기 위함이다.</li>
 * </ul>
 *
 * @param {{ keepRescue?: boolean }} [options]
 * @returns {Promise<void>}
 */
export async function purgeAllDraftBackups(options = {}) {
  memoryBackups.clear();
  sessionKeyPromise = null;
  if (options.keepRescue !== true) {
    await runStoreRequest('readwrite', (store) => store.clear());
    return;
  }
  const entries = await readAllEntries();
  const sessionOnly = entries
    .filter(([recordKey, value]) => !isRescueKeyRecord(recordKey) && value?.rescue !== true)
    .map(([recordKey]) => recordKey);
  await deleteKeys(sessionOnly);
}

/**
 * 로그인한 사용자가 아닌 다른 사용자의 401 보관 백업을 지운다(공용 단말 잔존물 정리).
 *
 * @param {string|number} userId 지금 로그인한 사용자 ID
 * @returns {Promise<void>}
 */
export async function purgeRescueBackupsOfOtherUsers(userId) {
  if (userId == null || String(userId).trim() === '') return;
  const ownPrefix = `u${String(userId).trim()}:`;
  const entries = await readAllEntries();
  const others = entries
    .filter(([recordKey, value]) => !isRescueKeyRecord(recordKey) && value?.rescue === true
      && !String(recordKey).startsWith(ownPrefix))
    .map(([recordKey]) => recordKey);
  await deleteKeys(others);
  await dropRescueKeyIfUnused();
}

/**
 * 테스트 전용 — 메모리 백업만 비운다(IndexedDB·세션 키는 유지).
 */
export function __resetDraftBackupMemoryForTest() {
  memoryBackups.clear();
}
