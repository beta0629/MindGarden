# AGENTS.md

## Cursor Cloud specific instructions

This section captures durable, non-obvious setup/run knowledge for future cloud agents.
Dependencies are already refreshed by the environment update script (`npm ci` at root and in
`frontend/`); system tools (Java 21, Maven, Node 22, `mysql-client`) are provided by the base
environment. Do not duplicate dependency-install steps here.

### Scope that is set up in this environment

The core web platform is set up and verified:

- **Backend** — Spring Boot 3.2 (Java, `pom.xml`), runs on port **8080**.
- **Frontend** — React + CRACO in `frontend/` (`npm start`), runs on port **3000**, dev-proxies
  API calls to `localhost:8080` (see `frontend/package.json` `"proxy"`).

Other subprojects exist in the monorepo but are **not** wired up in this environment:
`frontend-ops` and `frontend-trinity` (Next.js), `backend-ops` (Kotlin/Gradle), and the mobile apps
`expo-app` and `mobile` (React Native). Set those up separately only if a task requires them.

### Running the backend (important gotchas)

Canonical local run (matches `start-local.sh`), but with the fixes below:

```bash
SPRING_PROFILES_ACTIVE=local \
MINDGARDEN_HQ_TENANT_ID=tenant-incheon-counseling-001 \
LOCAL_DEFAULT_TENANT_ID=tenant-incheon-counseling-001 \
OPENAI_API_KEY=test-openai-key \
SMS_API_KEY=test-sms-api-key SMS_API_SECRET=test-sms-api-secret SMS_SENDER_NUMBER=01000000000 \
mvn spring-boot:run
```

- **Profile MUST be passed via the `SPRING_PROFILES_ACTIVE` env var** (or `-Dspring-boot.run.profiles=local`).
  `mvn spring-boot:run -Dspring.profiles.active=local` (as written in `package.json`/`start-local.sh`)
  does **not** work: the plugin forks a JVM that ignores that system property, so the app falls back
  to the `default` profile and tries `localhost:3306` (Connection refused).
- **Required env vars with no default** (boot fails fast without them): `OPENAI_API_KEY`,
  `SMS_API_KEY`, `SMS_API_SECRET`, `SMS_SENDER_NUMBER` (dummy/test values are fine — SMS is in
  `test-mode`/simulation locally). `JWT_SECRET` and PII keys are already defaulted by the `local` profile.
- **`MINDGARDEN_HQ_TENANT_ID`** is required (`OpsTenantConstants` fail-fast). Use
  `tenant-incheon-counseling-001` (the canonical dev value, per `deploy-backend-dev.yml`).
- **`LOCAL_DEFAULT_TENANT_ID=tenant-incheon-counseling-001`**: the profile default
  (`tenant-incheon-consultation-006`) does not exist in the dev DB. Setting this makes plain
  `localhost` resolve to the only tenant that actually exists.
- The `local` profile connects to a **shared remote dev MySQL** at `114.202.247.246:3306`
  (`core_solution`), with credentials baked into `application-local.yml`. Egress is open in this
  environment and the DB is reachable. Flyway runs migrations against this shared DB — treat writes
  as affecting a shared dev database.

### Logging in locally (PII encryption gotcha)

Pre-existing user rows in the shared dev DB have PII (email/name/phone) encrypted with the **dev
server's** key (ciphertext prefix `v1::`), while the `local` profile uses the `legacy` key. As a
result you generally **cannot log into pre-existing accounts locally**. To get a working login,
**register a fresh account** through the UI at `http://localhost:3000/register` (it is encrypted
with the local key, then logs in cleanly). Registration needs no email/SMS verification locally.

Password policy (`PasswordPolicy`): 8+ chars, upper + lower + digit + special, special chars limited
to `@$!%*?&`, and no "common pattern" passwords (e.g. `Password1!` is rejected). A working example:
`Gv6@mPxr!qKd`.

### Frontend

`cd frontend && BROWSER=none npm start` (CRACO dev server on :3000). ESLint warnings are printed but
do not block the dev server.

### Lint / test / build commands

- Backend unit tests: `mvn test -Dspring.profiles.active=test` — uses in-memory **H2** (no external
  DB needed; `application-test.yml`). Note: one pre-existing unit test fails independently of the
  environment — `ScheduleServiceImplAdminStaffScheduleScopeTest` (an uninitialized Mockito mock, not
  a setup issue).
- Backend lint: `mvn checkstyle:check` (passes). SpotBugs: `mvn spotbugs:check`.
- Frontend lint: `cd frontend && npm run lint:check` — currently reports 3 pre-existing errors in
  committed test files (`no-var` / bad import) unrelated to environment setup.
- Frontend static checks used in CI: `cd frontend && npm run verify:erp`, and the
  `node frontend/scripts/verify-quick-action-*.mjs` scripts.
- Frontend prod build: `cd frontend && npm run build`.
