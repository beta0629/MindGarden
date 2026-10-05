import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");

function aliasFile(specifier) {
  const base = path.join(SRC_ROOT, specifier.slice(2));
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, "index.ts")];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
}

/**
 * node:test 가 `@/` 를 `frontend-ops/src` 로 해석하게 한다.
 * Jest moduleNameMapper 를 대체하며 패키지 의존성은 추가하지 않는다.
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const resolved = aliasFile(specifier);
    if (resolved) {
      return nextResolve(resolved, context);
    }
  }
  return nextResolve(specifier, context);
}
