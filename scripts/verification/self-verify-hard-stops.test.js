'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const OWN = path.join(ROOT, 'scripts/verification/check-client-admin-own-id.js');
const CONN = path.join(ROOT, 'scripts/verification/check-external-call-connection.js');

function run(script, args) {
  const res = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  return { code: res.status, out: (res.stdout || '') + (res.stderr || '') };
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-hard-stop-'));
  return dir;
}

const LEAK_CONTROLLER = `
@RestController
@RequestMapping("/api/v1/admin")
class AdminController {
  @GetMapping("/mappings/client")
  public Object getMappingsByClient(@RequestParam Long clientId) {
    return adminService.getMappingsByClient(clientId);
  }
}
`;

const OWN_CONTROLLER = `
@RestController
@RequestMapping("/api/v1/admin")
class AdminController {
  @GetMapping("/mappings/client")
  public Object getMappingsByClient(@RequestParam Long clientId, HttpSession session) {
    assertClientIsSelf(session, clientId);
    return adminService.getMappingsByClient(clientId);
  }

  private void assertClientIsSelf(HttpSession session, Long requestedId) {
    User currentUser = SessionUtils.getCurrentUser(session);
    Long currentUserId = currentUser.getId();
    if (currentUserId == null || requestedId == null || !requestedId.equals(currentUserId)) {
      throw new AccessDeniedException("denied");
    }
  }
}
`;

function testLeakFails() {
  const dir = fixture();
  write(path.join(dir, 'frontend/src/components/client/Pay.js'),
    "export const URL = '/api/v1/admin/mappings/client';\n");
  write(path.join(dir, 'src/main/java/com/example/AdminController.java'), LEAK_CONTROLLER);
  const changed = path.join(dir, 'changed.txt');
  write(changed, 'frontend/src/components/client/Pay.js\n');
  const res = run(OWN, ['--root', dir, '--changed', changed]);
  assert.strictEqual(res.code, 1, res.out);
  assert.match(res.out, /FAIL own-id/);
  assert.match(res.out, /호출자 id를 읽지 않음/);
}

function testOwnIdPasses() {
  const dir = fixture();
  write(path.join(dir, 'frontend/src/components/client/Pay.js'),
    "export const URL = '/api/v1/admin/mappings/client';\n");
  write(path.join(dir, 'src/main/java/com/example/AdminController.java'), OWN_CONTROLLER);
  const changed = path.join(dir, 'changed.txt');
  write(changed, 'frontend/src/components/client/Pay.js\n');
  const res = run(OWN, ['--root', dir, '--changed', changed]);
  assert.strictEqual(res.code, 0, res.out);
  assert.match(res.out, /PASS own-id/);
}

function testUnrelatedSkips() {
  const dir = fixture();
  write(path.join(dir, 'frontend/src/components/client/Pay.js'),
    "export const URL = '/api/v1/admin/mappings/client';\n");
  write(path.join(dir, 'src/main/java/com/example/AdminController.java'), LEAK_CONTROLLER);
  const changed = path.join(dir, 'changed.txt');
  write(changed, 'README.md\n');
  const res = run(OWN, ['--root', dir, '--changed', changed]);
  assert.strictEqual(res.code, 0, res.out);
  assert.match(res.out, /검사 대상 없음/);
}

const RESOLVE_HELPER = `
  private Long resolveMappingsClientIdForCaller(HttpSession session, Long requestedClientId) {
    User currentUser = SessionUtils.getCurrentUser(session);
    if (currentUser == null || currentUser.getRole() == null) {
      throw new org.springframework.security.access.AccessDeniedException("denied");
    }
    if (!currentUser.getRole().isClient()) {
      return requestedClientId;
    }
    Long ownId = currentUser.getId();
    if (ownId == null || !ownId.equals(requestedClientId)) {
      throw new org.springframework.security.access.AccessDeniedException("denied");
    }
    return ownId;
  }
`;

const RESOLVE_BEFORE_QUERY = `
@RestController
@RequestMapping("/api/v1/admin")
class AdminController {
  @GetMapping("/mappings/client")
  public Object getMappingsByClient(@RequestParam Long clientId, HttpSession session) {
    Long queryClientId = resolveMappingsClientIdForCaller(session, clientId);
    return adminService.getMappingsByClient(queryClientId);
  }
${RESOLVE_HELPER}
}
`;

const RESOLVE_AFTER_QUERY = `
@RestController
@RequestMapping("/api/v1/admin")
class AdminController {
  @GetMapping("/mappings/client")
  public Object getMappingsByClient(@RequestParam Long clientId, HttpSession session) {
    Object data = adminService.getMappingsByClient(clientId);
    resolveMappingsClientIdForCaller(session, clientId);
    return data;
  }
${RESOLVE_HELPER}
}
`;

const RESOLVE_WITHOUT_DENIAL = `
@RestController
@RequestMapping("/api/v1/admin")
class AdminController {
  @GetMapping("/mappings/client")
  public Object getMappingsByClient(@RequestParam Long clientId, HttpSession session) {
    Long queryClientId = resolveMappingsClientIdForCaller(session, clientId);
    return adminService.getMappingsByClient(queryClientId);
  }

  private Long resolveMappingsClientIdForCaller(HttpSession session, Long requestedClientId) {
    User currentUser = SessionUtils.getCurrentUser(session);
    if (currentUser == null || currentUser.getId() == null) {
      throw new org.springframework.security.access.AccessDeniedException("denied");
    }
    return requestedClientId;
  }
}
`;

function runOwnFixture(controllerSrc) {
  const dir = fixture();
  write(path.join(dir, 'frontend/src/components/client/Pay.js'),
    "export const URL = '/api/v1/admin/mappings/client';\n");
  write(path.join(dir, 'src/main/java/com/example/AdminController.java'), controllerSrc);
  const changed = path.join(dir, 'changed.txt');
  write(changed, 'frontend/src/components/client/Pay.js\n');
  return run(OWN, ['--root', dir, '--changed', changed]);
}

function testResolveHelperBeforeQueryPasses() {
  const res = runOwnFixture(RESOLVE_BEFORE_QUERY);
  assert.strictEqual(res.code, 0, res.out);
  assert.match(res.out, /PASS own-id/);
}

function testResolveHelperAfterQueryFails() {
  const res = runOwnFixture(RESOLVE_AFTER_QUERY);
  assert.strictEqual(res.code, 1, res.out);
  assert.match(res.out, /조회보다 먼저 본인 id를 거부하지 않음/);
}

function testResolveHelperWithoutCompareFails() {
  const res = runOwnFixture(RESOLVE_WITHOUT_DENIAL);
  assert.strictEqual(res.code, 1, res.out);
  assert.match(res.out, /FAIL own-id/);
  assert.doesNotMatch(res.out, /PASS own-id/);
}

function testMissingHandlerFails() {
  const dir = fixture();
  write(path.join(dir, 'frontend/src/components/client/Pay.js'),
    "export const URL = '/api/v1/admin/no-such';\n");
  const changed = path.join(dir, 'changed.txt');
  write(changed, 'frontend/src/components/client/Pay.js\n');
  const res = run(OWN, ['--root', dir, '--changed', changed]);
  assert.strictEqual(res.code, 1, res.out);
  assert.match(res.out, /핸들러 없음/);
}

const CALLER = `
class PayService {
  String fetch() {
    return portOneClient.fetchPaymentStatus(tenantId, paymentId);
  }
}
`;

const BAD_TEST = `
class PayServiceTest {
  void flagsOnly() {
    when(portOneClient.fetchPaymentStatus(any(), any())).thenAnswer(invocation -> {
      assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
      return "ok";
    });
  }
}
`;

const GOOD_TEST = `
class PayServiceTest {
  void atCall() {
    when(portOneClient.fetchPaymentStatus(any(), any())).thenAnswer(invocation -> {
      assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
      assertFalse(TransactionSynchronizationManager.isSynchronizationActive());
      assertNull(TransactionSynchronizationManager.getResource(entityManagerFactory));
      assertEquals(0, hikariDataSource.getHikariPoolMXBean().getActiveConnections());
      return "ok";
    });
  }
}
`;

const STUB_TEST = `
class PayServiceTest {
  void stubbed() {
    when(pool.getActiveConnections()).thenReturn(0);
    when(portOneClient.fetchPaymentStatus(any(), any())).thenAnswer(invocation -> {
      assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
      assertFalse(TransactionSynchronizationManager.isSynchronizationActive());
      assertNull(TransactionSynchronizationManager.getResource(entityManagerFactory));
      assertEquals(0, hikariDataSource.getHikariPoolMXBean().getActiveConnections());
      return "ok";
    });
  }
}
`;

function testConnectionMissingFails() {
  const dir = fixture();
  write(path.join(dir, 'src/main/java/com/example/PayService.java'), CALLER);
  write(path.join(dir, 'src/test/java/com/example/PayServiceTest.java'), BAD_TEST);
  const changed = path.join(dir, 'changed.txt');
  write(changed, 'src/main/java/com/example/PayService.java\n');
  const res = run(CONN, ['--root', dir, '--changed', changed]);
  assert.strictEqual(res.code, 1, res.out);
  assert.match(res.out, /#1328/);
}

function testConnectionAnswerPasses() {
  const dir = fixture();
  write(path.join(dir, 'src/main/java/com/example/PayService.java'), CALLER);
  write(path.join(dir, 'src/test/java/com/example/PayServiceTest.java'), GOOD_TEST);
  const changed = path.join(dir, 'changed.txt');
  write(changed, 'src/main/java/com/example/PayService.java\n');
  const res = run(CONN, ['--root', dir, '--changed', changed]);
  assert.strictEqual(res.code, 0, res.out);
  assert.match(res.out, /PASS connection/);
}

function testConnectionStubFails() {
  const dir = fixture();
  write(path.join(dir, 'src/main/java/com/example/PayService.java'), CALLER);
  write(path.join(dir, 'src/test/java/com/example/PayServiceTest.java'), STUB_TEST);
  const changed = path.join(dir, 'changed.txt');
  write(changed, 'src/main/java/com/example/PayService.java\n');
  const res = run(CONN, ['--root', dir, '--changed', changed]);
  assert.strictEqual(res.code, 1, res.out);
  assert.match(res.out, /thenReturn\(0\)/);
}

function testNoExternalSkips() {
  const dir = fixture();
  write(path.join(dir, 'src/main/java/com/example/PayService.java'), 'class PayService { int n() { return 1; } }\n');
  const changed = path.join(dir, 'changed.txt');
  write(changed, 'src/main/java/com/example/PayService.java\n');
  const res = run(CONN, ['--root', dir, '--changed', changed]);
  assert.strictEqual(res.code, 0, res.out);
  assert.match(res.out, /외부 호출 변경 없음/);
}

testLeakFails();
testOwnIdPasses();
testResolveHelperBeforeQueryPasses();
testResolveHelperAfterQueryFails();
testResolveHelperWithoutCompareFails();
testUnrelatedSkips();
testMissingHandlerFails();
testConnectionMissingFails();
testConnectionAnswerPasses();
testConnectionStubFails();
testNoExternalSkips();
console.log('self-verify hard-stop scripts: 11 passed');
