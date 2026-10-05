/**
 * [실수 유형: 공용 401 처리를 건너뛰는 로그인 이동] 회귀 방지 — 활동 ping 401 (K⑧ 경합).
 *
 * <p>세션 만료 뒤 첫 키 입력이 SessionContext 활동 ping(45s 스로틀)을 일으키고, ping 의 current-user 401 이
 * 3초 자동저장보다 먼저 /login 으로 보내면 작성 중 일지가 사라졌다. 이 테스트는 실제 SessionProvider·
 * sessionManager·sessionRedirect·백업 저장소·훅을 그대로 두고 <strong>네트워크(fetch)와 IndexedDB 만</strong> 가짜로 둔다.</p>
 *
 * <ul>
 *   <li>활동 ping 401 → 마지막 입력까지 보관 백업(암호문) → returnUrl(같은 오리진 상대 경로)로 로그인 이동.
 *       자동저장 PUT 은 아직 나가지 않았다(백업은 공용 이동 처리에서 나왔다).</li>
 *   <li>새로고침 후 같은 사용자가 같은 일정을 열면 그 입력의 복원을 제안한다.</li>
 *   <li>반례: 저장 안 된 입력이 없으면 백업·returnUrl 없이 기존처럼 로그인으로 이동한다.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
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
const PAGE_SEARCH = '?scheduleId=31';

const USER_ID = 42;
const TENANT_ID = 'tenant-a';
const CONSULTATION_ID = 'schedule-31';
const FIRST_TEXT = '만료 전 입력';
const LAST_TEXT = '만료 전 입력 + 마지막 키';
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

/** current-user 응답 상태 — 처음엔 200(세션 유효), 만료 후 401 */
let currentUserStatus;

const createFetchMock = () => jest.fn(async(url, init = {}) => {
  const u = String(url);
  if (u.includes('/api/v1/auth/csrf-token')) {
    return jsonResponse(200, { success: true, data: { token: 'csrf-test' } });
  }
  if (isDraftCall(url, init, 'PUT')) {
    return jsonResponse(401, { success: false });
  }
  if (isDraftCall(url, init, 'GET')) {
    return jsonResponse(200, { success: true, data: { hasDraft: false } });
  }
  if (u.includes('/api/v1/auth/current-user')) {
    return currentUserStatus === 200
      ? jsonResponse(200, { success: true, data: { id: USER_ID, tenantId: TENANT_ID, role: 'CONSULTANT' } })
      : jsonResponse(401, { success: false });
  }
  if (u.includes('/api/v1/auth/session-info')) {
    return jsonResponse(200, { success: true, data: {} });
  }
  return jsonResponse(404, {});
});

let fakeIdb;
let originalLocation;
let originalCrypto;
let originalFetch;
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

/** "페이지 로드" — 앱 모듈을 새로 읽는다. IndexedDB·fetch mock 만 유지된다. */
const loadPage = () => {
  jest.resetModules();
  jest.doMock('react', () => React);
  const { useConsultationLogDraftAutosave, DRAFT_RESTORE_SOURCE } = require('../useConsultationLogDraftAutosave');
  const sessionManager = require('../../utils/sessionManager').default;
  const { SessionProvider, SessionContext } = require('../../contexts/SessionContext');
  const holder = { latest: null, type: null, sessionUser: null };

  const Editor = ({ initialSnapshot, onRestoreCandidate }) => {
    const [snapshot, setSnapshot] = React.useState(initialSnapshot);
    const snapshotRef = React.useRef(snapshot);
    snapshotRef.current = snapshot;
    const dirtyRef = React.useRef(false);
    const session = React.useContext(SessionContext);
    holder.sessionUser = session?.user || null;
    holder.latest = useConsultationLogDraftAutosave({
      enabled: true,
      tenantId: TENANT_ID,
      userId: USER_ID,
      consultationId: CONSULTATION_ID,
      consultantId: USER_ID,
      legacyScope: null,
      snapshotRef,
      dirtyRef,
      onRestoreCandidate
    });
    const { notifyDirty } = holder.latest;
    holder.type = (text) => {
      notifyDirty();
      setSnapshot({ formData: { mainIssues: text }, memoDraft: '' });
    };
    return null;
  };

  const renderWithProvider = (initialSnapshot) => render(
    React.createElement(SessionProvider, null, React.createElement(Editor, { initialSnapshot }))
  );

  const renderStandalone = ({ initialSnapshot, onRestoreCandidate }) => {
    sessionManager.setUser({ id: USER_ID, tenantId: TENANT_ID, role: 'CONSULTANT' });
    sessionManager.lastVerifiedAt = Date.now();
    return render(React.createElement(Editor, { initialSnapshot, onRestoreCandidate }));
  };

  return { holder, renderWithProvider, renderStandalone, DRAFT_RESTORE_SOURCE };
};

const draftCalls = (method) => fetchMock.mock.calls.filter(([url, init]) => isDraftCall(url, init, method));
const rescueEntries = () => fakeIdb.rawEntries(CONSULTATION_LOG_BACKUP_DB_NAME)
  .filter(([, value]) => value && value.rescue === true);

/** 세션 유효 상태로 화면을 열고, 서버 세션을 만료시킨다. */
const openEditorThenExpire = async(initialSnapshot) => {
  const page = loadPage();
  const view = page.renderWithProvider(initialSnapshot);
  await waitFor(() => expect(page.holder.sessionUser).not.toBeNull());
  await waitFor(() => expect(draftCalls('GET')).toHaveLength(1));
  currentUserStatus = 401;
  return { page, view };
};

beforeEach(() => {
  currentUserStatus = 200;
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

describe('[실수 유형: 공용 401 처리를 건너뛰는 로그인 이동] 활동 ping 401 → 보관 백업 → returnUrl → 복원', () => {
  test('만료 후 첫 키 입력의 활동 ping 401 → 마지막 입력까지 보관 백업 → returnUrl 로 로그인 이동', async() => {
    const { page, view } = await openEditorThenExpire({ formData: { mainIssues: FIRST_TEXT }, memoDraft: '' });

    act(() => {
      page.holder.type(LAST_TEXT);
    });
    fireEvent.keyDown(document, { key: 'a' });

    await waitFor(() => expect(window.location.href).toBe(
      `${ORIGIN}/login?redirect=${encodeURIComponent(`${PAGE_PATH}${PAGE_SEARCH}`)}`
    ));
    expect(draftCalls('PUT')).toHaveLength(0);
    const rescue = rescueEntries();
    expect(rescue).toHaveLength(1);
    expect(rescue[0][0]).toBe(`u${USER_ID}:t${TENANT_ID}:c${CONSULTATION_ID}`);
    expect(JSON.stringify(fakeIdb.rawEntries(CONSULTATION_LOG_BACKUP_DB_NAME))).not.toContain(LAST_TEXT);
    view.unmount();

    const reloaded = loadPage();
    const onRestoreCandidate = jest.fn();
    reloaded.renderStandalone({ initialSnapshot: EMPTY_SNAPSHOT, onRestoreCandidate });
    await waitFor(() => expect(onRestoreCandidate).toHaveBeenCalledTimes(1));
    const candidate = onRestoreCandidate.mock.calls[0][0];
    expect(candidate.source).toBe(reloaded.DRAFT_RESTORE_SOURCE.BACKUP);
    expect(candidate.snapshot.formData.mainIssues).toBe(LAST_TEXT);
  });

  test('반례: 저장 안 된 입력이 없으면 백업·returnUrl 없이 로그인으로 이동한다', async() => {
    const { view } = await openEditorThenExpire(EMPTY_SNAPSHOT);

    fireEvent.keyDown(document, { key: 'a' });

    await waitFor(() => expect(window.location.href).toBe(`${ORIGIN}/login`));
    expect(rescueEntries()).toHaveLength(0);
    view.unmount();
  });
});
