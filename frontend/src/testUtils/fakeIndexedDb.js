/**
 * 테스트 전용 최소 인메모리 IndexedDB (jsdom 에는 IndexedDB 가 없다).
 * 값은 참조 그대로 보관한다 — CryptoKey 처럼 구조화 복제가 필요한 값도 그대로 남는다.
 * 같은 인스턴스를 global.indexedDB 로 유지하면 jest.resetModules() 로 모듈을 재로드해도 데이터가 남아
 * "새로고침 후 복원" 을 흉내 낼 수 있다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

export const createFakeIndexedDb = () => {
  const databases = new Map();
  const later = (fn) => setTimeout(fn, 0);

  const makeRequest = (tx, run) => {
    const req = { result: undefined, onsuccess: null, onerror: null };
    tx.pending += 1;
    later(() => {
      req.result = run();
      if (req.onsuccess) req.onsuccess();
      tx.settle();
    });
    return req;
  };

  const makeTx = (db) => {
    const tx = {
      pending: 0,
      oncomplete: null,
      onerror: null,
      onabort: null,
      settle() {
        tx.pending -= 1;
        if (tx.pending === 0) {
          later(() => { if (tx.pending === 0 && tx.oncomplete) tx.oncomplete(); });
        }
      },
      objectStore(name) {
        const data = db.stores.get(name);
        return {
          get: (key) => makeRequest(tx, () => data.get(key)),
          put: (value, key) => makeRequest(tx, () => { data.set(key, value); return key; }),
          delete: (key) => makeRequest(tx, () => { data.delete(key); return undefined; }),
          clear: () => makeRequest(tx, () => { data.clear(); return undefined; }),
          openCursor: () => {
            const keys = Array.from(data.keys());
            let index = 0;
            const req = { result: null, onsuccess: null };
            const step = () => {
              tx.pending += 1;
              later(() => {
                if (index < keys.length) {
                  const key = keys[index];
                  req.result = {
                    key,
                    value: data.get(key),
                    continue: () => { index += 1; step(); }
                  };
                } else {
                  req.result = null;
                }
                if (req.onsuccess) req.onsuccess();
                tx.settle();
              });
            };
            step();
            return req;
          }
        };
      }
    };
    later(() => { if (tx.pending === 0 && tx.oncomplete) tx.oncomplete(); });
    return tx;
  };

  return {
    open(name) {
      const req = { result: null, onupgradeneeded: null, onsuccess: null, onerror: null };
      later(() => {
        let db = databases.get(name);
        const isNew = !db;
        if (!db) {
          db = {
            stores: new Map(),
            objectStoreNames: { contains: (n) => db.stores.has(n) },
            createObjectStore: (n) => { db.stores.set(n, new Map()); },
            transaction: () => makeTx(db),
            close: () => {}
          };
          databases.set(name, db);
        }
        req.result = db;
        if (isNew && req.onupgradeneeded) req.onupgradeneeded();
        if (req.onsuccess) req.onsuccess();
      });
      return req;
    },
    rawEntries(name) {
      const db = databases.get(name);
      const out = [];
      db?.stores.forEach((data) => data.forEach((value, key) => out.push([key, value])));
      return out;
    }
  };
};
