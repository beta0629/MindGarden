/**
 * 401 보관 백업 회귀 — 세션 정리 뒤에도 IndexedDB 에 일지 백업이 실제로 남고, 재로드(메모리·세션 키
 * 소실) 뒤에도 복호화되는지. 명시적 로그아웃·다른 사용자·보관 기간 경과에서는 지워지는지.
 *
 * jsdom 에는 IndexedDB 가 없어 최소 인메모리 구현({@code testUtils/fakeIndexedDb})을 쓴다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
import { webcrypto } from 'crypto';
import { TextDecoder, TextEncoder } from 'util';
import {
  CONSULTATION_LOG_BACKUP_DB_NAME,
  CONSULTATION_LOG_BACKUP_RESCUE_TTL_MS
} from '../../constants/consultationLogAutosaveConstants';
import { createFakeIndexedDb } from '../../testUtils/fakeIndexedDb';

jest.mock('../consultationLogLocalDraft', () => ({
  purgeAllLegacyConsultationLogLocalDrafts: jest.fn()
}));

const SCOPE = { userId: 41, tenantId: 'tenant-a', consultationId: 'schedule-30' };
const OTHER_USER_SCOPE = { userId: 99, tenantId: 'tenant-a', consultationId: 'schedule-77' };
const PAYLOAD = JSON.stringify({ formData: { mainIssues: '401 직전 입력' }, memoDraft: '' });

let fakeIdb;
let store;
let sessionManager;
let originalCrypto;

beforeEach(() => {
  jest.resetModules();
  fakeIdb = createFakeIndexedDb();
  global.indexedDB = fakeIdb;
  originalCrypto = globalThis.crypto;
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
  store = require('../consultationLogDraftBackupStore');
  sessionManager = require('../sessionManager').default;
  sessionManager.user = null;
});

afterEach(() => {
  delete global.indexedDB;
  Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true });
  jest.restoreAllMocks();
});

/** 리다이렉트 재로드 흉내: 메모리 백업·세션 키가 사라진 새 모듈 인스턴스 (IndexedDB 는 유지) */
const reloadStoreModule = () => {
  jest.resetModules();
  return require('../consultationLogDraftBackupStore');
};

describe('401 보관 백업 — 세션 정리 이후에도 IndexedDB 에 남는다', () => {
  test('401 백업 → 세션 정리(applyClientLogoutCleanupPreserveSubdomain) → 재로드 후에도 복호화된다', async() => {
    const saved = await store.saveDraftBackup(SCOPE, PAYLOAD, { rescue: true });
    expect(saved).toEqual({ memory: true, persisted: true });

    await sessionManager.applyClientLogoutCleanupPreserveSubdomain();

    const raw = fakeIdb.rawEntries(CONSULTATION_LOG_BACKUP_DB_NAME);
    expect(raw.some(([, value]) => value?.rescue === true)).toBe(true);
    expect(JSON.stringify(raw)).not.toContain('401 직전 입력');

    const reloaded = reloadStoreModule();
    const restored = await reloaded.readDraftBackup(SCOPE);
    expect(restored).not.toBeNull();
    expect(restored.payloadJson).toBe(PAYLOAD);
  });

  test('세션 정리는 일반(세션 키) 백업은 지운다', async() => {
    const sessionScope = { ...SCOPE, consultationId: 'schedule-31' };
    await store.saveDraftBackup(sessionScope, PAYLOAD);
    await store.saveDraftBackup(SCOPE, PAYLOAD, { rescue: true });

    await store.purgeAllDraftBackups({ keepRescue: true });

    const reloaded = reloadStoreModule();
    expect(await reloaded.readDraftBackup(sessionScope)).toBeNull();
    expect(await reloaded.readDraftBackup(SCOPE)).not.toBeNull();
  });

  test('명시적 로그아웃 정리(기본 purge)는 401 보관 백업과 보관용 키까지 지운다', async() => {
    await store.saveDraftBackup(SCOPE, PAYLOAD, { rescue: true });

    await store.purgeAllDraftBackups();

    const reloaded = reloadStoreModule();
    expect(await reloaded.readDraftBackup(SCOPE)).toBeNull();
    expect(fakeIdb.rawEntries(CONSULTATION_LOG_BACKUP_DB_NAME)).toHaveLength(0);
  });

  test('다른 사용자가 로그인하면 이전 사용자의 401 보관 백업을 지운다 (본인 것은 유지)', async() => {
    await store.saveDraftBackup(SCOPE, PAYLOAD, { rescue: true });
    await store.saveDraftBackup(OTHER_USER_SCOPE, PAYLOAD, { rescue: true });

    await store.purgeRescueBackupsOfOtherUsers(SCOPE.userId);

    const reloaded = reloadStoreModule();
    expect(await reloaded.readDraftBackup(OTHER_USER_SCOPE)).toBeNull();
    expect(await reloaded.readDraftBackup(SCOPE)).not.toBeNull();
  });

  test('보관 기간(TTL)이 지난 401 백업은 읽지 않고 지운다', async() => {
    const t0 = 1_800_000_000_000;
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(t0);
    await store.saveDraftBackup(SCOPE, PAYLOAD, { rescue: true });

    nowSpy.mockReturnValue(t0 + CONSULTATION_LOG_BACKUP_RESCUE_TTL_MS + 1);
    const reloaded = reloadStoreModule();
    expect(await reloaded.readDraftBackup(SCOPE)).toBeNull();
    expect(fakeIdb.rawEntries(CONSULTATION_LOG_BACKUP_DB_NAME)).toHaveLength(0);
  });

  test('IndexedDB 를 쓸 수 없으면 persisted=false — 화면이 "보관" 이라고 말하면 안 된다', async() => {
    delete global.indexedDB;
    const noIdbStore = reloadStoreModule();

    const saved = await noIdbStore.saveDraftBackup(SCOPE, PAYLOAD, { rescue: true });

    expect(saved.persisted).toBe(false);
  });
});
