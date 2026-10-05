/**
 * [실수 유형: 공용 요청 계층을 mock 해서 실제 401 경로를 놓침] 회귀 방지.
 *
 * <p>#1436 의 훅 테스트는 어댑터를 mock 해 {@code notAuthenticated: true} 를 직접 돌려줬다. 실제로는
 * 공용 {@code apiPut} 이 401 을 받으면 스스로 /login 으로 보내고 null 을 반환해, 어댑터·훅이 401 을 몰랐다.
 * 이 테스트는 공용 요청 모듈(ajax·csrfTokenManager·sessionRedirect)·어댑터·백업 저장소·훅·sessionManager 를
 * 모두 실제 코드로 두고 <strong>네트워크(fetch)와 IndexedDB 만</strong> 가짜로 둔다.</p>
 *
 * <ul>
 *   <li>운영과 같은 비-localhost 호스트에서 실제 apiPut 이 401 을 받으면 → 보관용 백업이 IndexedDB 에 남고
 *       → returnUrl(같은 오리진 상대 경로)을 붙여 로그인으로 이동한다.</li>
 *   <li>새로고침(모듈 재로드 — 메모리·세션 키 소실) 뒤 같은 사용자가 같은 일정을 열면 복원을 제안한다.</li>
 *   <li>반례: 다른 사용자 로그인·명시적 로그아웃이면 복원되지 않는다. 백업이 남지 않으면 이동·'보관' 안내가 없다.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { webcrypto } from 'crypto';
import { TextDecoder, TextEncoder } from 'util';
import {
  CONSULTATION_LOG_BACKUP_DB_NAME,
  CONSULTATION_LOG_SERVER_DRAFT_API_PATH
} from '../../constants/consultationLogAutosaveConstants';
import { createFakeIndexedDb } from '../../testUtils/fakeIndexedDb';

const HOST = 'tenant.example.test';
const ORIGIN = `https://${HOST}`;
const PAGE_PATH = '/consultant/schedule';
const PAGE_SEARCH = '?scheduleId=30';

const USER_ID = 41;
const OTHER_USER_ID = 99;
const TENANT_ID = 'tenant-a';
const CONSULTATION_ID = 'schedule-30';
const TYPED_TEXT = '401 직전 입력';
const EMPTY_SNAPSHOT = { formData: { mainIssues: '' }, memoDraft: '' };

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name) => (String(name).toLowerCase() === 'content-type' ? 'application/json' : null) },
  json: async() => body,
  text: async() => JSON.stringify(body)
});

const methodOf = (init) => String(init?.method || 'GET').toUpperCase();
const isDraftCall = (url, init, method) =>
  String(url).includes(CONSULTATION_LOG_SERVER_DRAFT_API_PATH) && methodOf(init) === method;

/** 초안 PUT 응답 상태 — 기본 401, 세션 만료를 403 으로 돌려주는 경로도 확인한다. */
let draftPutStatus;

/** 네트워크만 가짜 — URL·메서드로 응답을 고른다. 초안 PUT·세션 재확인은 401(세션 만료). */
const createFetchMock = () => jest.fn(async(url, init = {}) => {
  const u = String(url);
  if (u.includes('/api/v1/auth/csrf-token')) {
    return jsonResponse(200, { success: true, data: { token: 'csrf-test' } });
  }
  if (isDraftCall(url, init, 'PUT')) {
    return jsonResponse(draftPutStatus, { success: false, message: 'unauthorized' });
  }
  if (isDraftCall(url, init, 'GET')) {
    return jsonResponse(200, { success: true, data: { hasDraft: false } });
  }
  if (u.includes('/api/v1/auth/current-user')) {
    return jsonResponse(401, { success: false });
  }
  if (u.includes('/api/v1/auth/logout')) {
    return jsonResponse(200, { success: true });
  }
  return jsonResponse(404, {});
});

let fakeIdb;
let originalLocation;
let originalCrypto;
let originalFetch;
/** sessionManager 가 window.fetch 를 감싸므로(실제 앱과 같음) 호출 기록은 원본 mock 에서 본다 */
let fetchMock;

const setNonLocalLocation = () => {
  delete window.location;
  window.location = {
    hostname: HOST,
    host: HOST,
    protocol: 'https:',
    origin: ORIGIN,
    pathname: PAGE_PATH,
    search: PAGE_SEARCH,
    hash: '',
    href: `${ORIGIN}${PAGE_PATH}${PAGE_SEARCH}`,
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn()
  };
};

/**
 * "페이지 로드" — 앱 모듈을 전부 새로 읽는다(메모리 백업·세션 키·리다이렉트 플래그·CSRF 캐시 초기화).
 * IndexedDB(global.indexedDB)·fetch mock 만 유지된다. React 는 testing-library 와 같은 인스턴스를 쓴다.
 */
const loadPage = () => {
  jest.resetModules();
  jest.doMock('react', () => React);
  const { useConsultationLogDraftAutosave, DRAFT_RESTORE_SOURCE } = require('../useConsultationLogDraftAutosave');
  const sessionManager = require('../../utils/sessionManager').default;
  const { SessionContext } = require('../../contexts/SessionContext');
  const holder = { latest: null };

  const Harness = ({ snapshot, userId, onRestoreCandidate }) => {
    const snapshotRef = React.useRef(snapshot);
    const dirtyRef = React.useRef(false);
    holder.latest = useConsultationLogDraftAutosave({
      enabled: true,
      tenantId: TENANT_ID,
      userId,
      consultationId: CONSULTATION_ID,
      consultantId: userId,
      legacyScope: null,
      snapshotRef,
      dirtyRef,
      onRestoreCandidate
    });
    return null;
  };

  /**
   * @param {object} [options]
   * @param {object} [options.sessionContextValue] SessionContext 값(예: 실제 sessionManager 로 세션 재확인)
   */
  const renderEditor = ({ userId = USER_ID, snapshot, onRestoreCandidate, sessionContextValue } = {}) => {
    const editor = React.createElement(Harness, {
      userId,
      snapshot: snapshot || { formData: { mainIssues: TYPED_TEXT }, memoDraft: '' },
      onRestoreCandidate
    });
    return render(sessionContextValue
      ? React.createElement(SessionContext.Provider, { value: sessionContextValue }, editor)
      : editor);
  };

  /** 로그인 상태(서버 세션은 이미 만료) — 직전 확인이 최근이라 요청마다 세션을 다시 확인하지 않는다. */
  const signIn = (userId = USER_ID) => {
    sessionManager.setUser({ id: userId, tenantId: TENANT_ID, role: 'CONSULTANT' });
    sessionManager.lastVerifiedAt = Date.now();
  };

  return { renderEditor, holder, sessionManager, signIn, DRAFT_RESTORE_SOURCE };
};

const draftCalls = (method) => fetchMock.mock.calls.filter(([url, init]) => isDraftCall(url, init, method));

const rescueEntries = () => fakeIdb.rawEntries(CONSULTATION_LOG_BACKUP_DB_NAME)
  .filter(([, value]) => value && value.rescue === true);

/** 1번째 페이지: 로그인 상태에서 입력 → 저장 → 실제 apiPut 401 */
const typeThenHit401 = async(renderOptions = {}) => {
  const page = loadPage();
  page.signIn();
  const view = page.renderEditor(renderOptions);
  await waitFor(() => expect(draftCalls('GET')).toHaveLength(1));
  await act(async() => {
    await page.holder.latest.saveNow({ force: true });
  });
  return { page, view };
};

beforeEach(() => {
  draftPutStatus = 401;
  fakeIdb = createFakeIndexedDb();
  global.indexedDB = fakeIdb;
  originalCrypto = globalThis.crypto;
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
  originalFetch = global.fetch;
  fetchMock = createFetchMock();
  global.fetch = fetchMock;
  originalLocation = window.location;
  setNonLocalLocation();
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  delete global.indexedDB;
  Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true });
  global.fetch = originalFetch;
  window.location = originalLocation;
  localStorage.clear();
  sessionStorage.clear();
});

describe('[실수 유형: 공용 요청 계층을 mock 해서 실제 401 경로를 놓침] 상담일지 401 → 보관 백업 → 새로고침 후 복원', () => {
  test('실제 apiPut 401 → 보관용 백업 저장(암호문) → returnUrl 로 로그인 이동, "보관" 상태', async() => {
    const { page, view } = await typeThenHit401();

    expect(draftCalls('PUT')).toHaveLength(1);
    expect(page.holder.latest.backupKept).toBe(true);
    expect(window.location.href).toBe(
      `${ORIGIN}/login?redirect=${encodeURIComponent(`${PAGE_PATH}${PAGE_SEARCH}`)}`
    );
    const rescue = rescueEntries();
    expect(rescue).toHaveLength(1);
    expect(rescue[0][0]).toBe(`u${USER_ID}:t${TENANT_ID}:c${CONSULTATION_ID}`);
    expect(JSON.stringify(fakeIdb.rawEntries(CONSULTATION_LOG_BACKUP_DB_NAME))).not.toContain(TYPED_TEXT);
    view.unmount();
  });

  test('세션 재확인(실제 sessionManager)이 먼저 /login 으로 보내도 returnUrl 이 붙고 백업은 이미 남아 있다', async() => {
    let sessionManagerRef = null;
    const sessionContextValue = {
      checkSession: (force) => sessionManagerRef.checkSession(force)
    };
    const page = loadPage();
    sessionManagerRef = page.sessionManager;
    page.signIn();
    const view = page.renderEditor({ sessionContextValue });
    await waitFor(() => expect(draftCalls('GET')).toHaveLength(1));
    await act(async() => {
      await page.holder.latest.saveNow({ force: true });
    });

    expect(window.location.href).toBe(
      `${ORIGIN}/login?redirect=${encodeURIComponent(`${PAGE_PATH}${PAGE_SEARCH}`)}`
    );
    expect(rescueEntries()).toHaveLength(1);
    view.unmount();
  });

  test('새로고침(모듈 재로드) 후 같은 사용자가 같은 일정을 열면 401 직전 입력 복원을 제안한다', async() => {
    const first = await typeThenHit401();
    first.view.unmount();

    const page = loadPage();
    page.signIn();
    const onRestoreCandidate = jest.fn();
    page.renderEditor({ snapshot: EMPTY_SNAPSHOT, onRestoreCandidate });

    await waitFor(() => expect(onRestoreCandidate).toHaveBeenCalledTimes(1));
    const candidate = onRestoreCandidate.mock.calls[0][0];
    expect(candidate.source).toBe(page.DRAFT_RESTORE_SOURCE.BACKUP);
    expect(candidate.snapshot.formData.mainIssues).toBe(TYPED_TEXT);
  });

  test('반례: 다른 사용자가 같은 단말에서 로그인하면 이전 사용자의 401 백업을 복원하지 않는다', async() => {
    const first = await typeThenHit401();
    first.view.unmount();

    const page = loadPage();
    page.signIn(OTHER_USER_ID);
    const onRestoreCandidate = jest.fn();
    page.renderEditor({ userId: OTHER_USER_ID, snapshot: EMPTY_SNAPSHOT, onRestoreCandidate });

    await waitFor(() => expect(rescueEntries()).toHaveLength(0));
    await waitFor(() => expect(draftCalls('GET').length).toBeGreaterThanOrEqual(2));
    await act(async() => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(onRestoreCandidate).not.toHaveBeenCalled();
  });

  test('반례: 명시적 로그아웃 뒤에는 401 백업이 남지 않아 복원되지 않는다', async() => {
    const first = await typeThenHit401();
    first.view.unmount();

    const page = loadPage();
    page.signIn();
    await page.sessionManager.logout();
    expect(fakeIdb.rawEntries(CONSULTATION_LOG_BACKUP_DB_NAME)).toHaveLength(0);

    const reloaded = loadPage();
    const onRestoreCandidate = jest.fn();
    reloaded.renderEditor({ snapshot: EMPTY_SNAPSHOT, onRestoreCandidate });
    await waitFor(() => expect(draftCalls('GET').length).toBeGreaterThanOrEqual(2));
    await act(async() => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(onRestoreCandidate).not.toHaveBeenCalled();
  });

  test('세션이 끊긴 상태의 403 도 공용 모듈이 먼저 이동하지 않고 보관 백업 → returnUrl 이동', async() => {
    draftPutStatus = 403;

    const { page, view } = await typeThenHit401();

    expect(page.holder.latest.backupKept).toBe(true);
    expect(rescueEntries()).toHaveLength(1);
    expect(window.location.href).toBe(
      `${ORIGIN}/login?redirect=${encodeURIComponent(`${PAGE_PATH}${PAGE_SEARCH}`)}`
    );
    view.unmount();
  });

  test('반례: 보관용 백업이 남지 않으면(IndexedDB 불가) 로그인으로 보내지 않고 "보관" 이라고 하지 않는다', async() => {
    delete global.indexedDB;
    const before = window.location.href;

    const { page, view } = await typeThenHit401();

    expect(draftCalls('PUT')).toHaveLength(1);
    expect(page.holder.latest.backupKept).toBe(false);
    expect(window.location.href).toBe(before);
    view.unmount();
  });
});
