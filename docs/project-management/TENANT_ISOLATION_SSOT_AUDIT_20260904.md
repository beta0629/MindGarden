# Tenant Isolation SSOT Audit (2026-09-04)

**Base**: `develop` @ `401e0765a` (branch `cursor/tenant-isolation-ssot-4028`)  
**Goal**: 센터(tenant) 격리를 공통 제어로 강제. 엔드포인트별 우회 해킹 금지.  
**Explicit**: no password UPDATE.

## Relation to open PRs

| PR | Scope | This PR |
|----|-------|---------|
| #822 | `TestDataController` @Profile(local), remove reset/delete/verify-password, no password overwrite | **Do not duplicate** — Fixed=N here; covered by #822 |
| #823 | `isLocalProfile` local-only + X-Forwarded-Host + diagnose workflow on Filter/Auth/OAuth2 | **Coexist/extend**: introduce `LocalProfileGuard` SSOT; Filter gets same semantics via shared helper + X-Forwarded-Host. Overlap on same files intentional (same end-state). Rebase after #823 merge if needed. |

## Findings

| ID | file:line (approx) | Severity | Issue | Fixed |
|----|-------------------|----------|-------|-------|
| F01 | `TenantContextFilter.java:56-67` | P0 | `isLocalProfile()` treats `dev` as local → localhost Host skips subdomain | Y (`LocalProfileGuard`) |
| F02 | `TenantContextFilter.java:463-498` | P0 | No X-Forwarded-Host retry when Host=localhost | Y |
| F03 | `AuthController.java:2201-2211` | P0 | Duplicate `isLocalProfile` includes `dev` | Y (LocalProfileGuard) |
| F04 | `OAuth2Controller.java:5017-5027` | P0 | Same as F03 | Y (LocalProfileGuard) |
| F05 | `AuthController.java:797-816` `forceLogout` | P0 | `findAllByEmail` → cross-tenant session kill | Y (tenant-scoped) |
| F06 | `AuthController.java:166-168` current-user JWT | P1 | tenant missing → `findAllByEmail` PII | Y (fail-closed → 401) |
| F07 | `AuthServiceImpl.java:239-252` refresh legacy | P1 | JWT tenant missing → `findAllByEmail` | Y (fail-closed) |
| F08 | `AuthController.java:436` duplicate-check | P1 | tenant missing → `existsByEmailAll` global | Y (fail-closed, no global scan) |
| F09 | `TestDataController.java` reset/delete + isDev | P0 | password/delete write on `.dev` if isDev | N — **#822** |
| F10 | `UserRepository.findAllByEmail` @Deprecated | P1 | Still callable from prod paths | Y (call sites closed; javadoc SSOT) |
| F11 | `BranchAccountCreator.java:86+` | P2 | findAllByEmail in deprecated util | Y (tenant-scoped exists) |
| F12 | `OnboardingController.java:108` | P2 | findAllByEmail for platform onboarding gate | N — follow-up (intentional platform check) |
| F13 | `PersonalDataEncryptionKeyProvider` / `AesGcm…` / `JwtSecretValidator` | — | `dev`\|\|`local` for **crypto/JWT secrets**, not tenant bypass | N/A (out of scope) |
| F14 | `PaymentTestController` `@ConditionalOnProperty(isDev)` | P1 | shared `.dev` write surface | N — follow-up (#822-style local-only) |
| F15 | `ThemeServiceImpl` `findByUserId` | P1 | cross-tenant userId | N |
| F16 | `AcademyRegistrationController` `findByEmail` / `existsByUserId` | P1 | global then filter | N |
| F17 | `SuperAdminController` `existsByEmail` fallback when tenant null | P1 | tenant-null fallback opens global email existence | N |
| F18 | `UserServiceImpl` `findByNickname` / `findAllWithNonBlankPhone` | P1 | global PII | N |
| F19 | `TenantContextFilter` `userRepository.findById` when no tenant hint | P1 | userId lookup without tenant hint | N |
| F20 | `UserRepository` deprecated no-tenant APIs still public | P1 | ArchUnit/ban follow-up | N (call sites partially closed) |
| F21 | WarmWords / DailyHumor native no `tenant_id` | P2 | likely shared catalog | N |

### Remaining call sites of `findAllByEmail` on develop after this PR

- `TestDataController` — covered by **#822** (do not duplicate here)
- `OnboardingController` — **F12** (platform onboarding gate; follow-up)

## FIX principles applied

1. High-risk write/cross-tenant PII first  
2. Common control: `LocalProfileGuard` + Filter Host/X-Forwarded-Host  
3. Fail-closed outside true `local`  
4. True `local` keeps `LOCAL_DEFAULT_TENANT_ID`  
5. No password UPDATE; no weakening #822/#823  

## Follow-up

- Merge/#rebase with #822 (TestDataController) and #823 (diagnose workflow docs optional)  
- OnboardingController platform email scan → dedicated platform service with audit log  
- Hibernate `@Filter` / repository AOP enforcement for tenant-owned entities (broader)  
- Native/JPQL tenant_id gap sweep (separate explore)  
