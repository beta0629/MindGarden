# 개발 서버 온보딩 플로우 테스트 스크립트 (PowerShell)

param(
    [string]$BaseUrl = "https://ops.dev.e-trinity.co.kr/api/v1",
    [string]$BusinessType = "CONSULTATION",
    [string]$OpsUsername = "superadmin@mindgarden.com",
    [string]$OpsPassword = "admin123"
)

$ErrorActionPreference = "Stop"

# 타임스탬프 생성
$timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$tenantId = "test-$BusinessType-$timestamp"
$tenantName = "테스트 $BusinessType $timestamp"
$email = "admin@$BusinessType-$timestamp.com"
$password = "test1234"

Write-Host "=== 개발 서버 온보딩 플로우 테스트 시작 ===" -ForegroundColor Green
Write-Host "Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "테넌트 ID: $tenantId" -ForegroundColor Cyan
Write-Host "이메일: $email" -ForegroundColor Cyan
Write-Host ""

# Step 1: 온보딩 요청 생성
Write-Host "1. 온보딩 요청 생성..." -ForegroundColor Yellow
$requestBody = @{
    tenantId = $null
    tenantName = $tenantName
    requestedBy = $email
    riskLevel = "LOW"
    businessType = $BusinessType
    checklistJson = "{`"adminPassword`": `"$password`"}"
} | ConvertTo-Json -Depth 10

try {
    $requestResponse = Invoke-RestMethod -Uri "$BaseUrl/onboarding/requests" `
        -Method Post `
        -ContentType "application/json" `
        -Body $requestBody `
        -SkipCertificateCheck
    
    $requestId = $requestResponse.id
    Write-Host "  ✅ 온보딩 요청 생성 성공 (ID: $requestId)" -ForegroundColor Green
    Write-Host "  📋 요청 상태: $($requestResponse.status)" -ForegroundColor Cyan
} catch {
    Write-Host "  ❌ 온보딩 요청 생성 실패" -ForegroundColor Red
    Write-Host "  오류: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  상세: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Step 1.5: Ops Portal 로그인 (승인 API 인증 필요)
Write-Host "1.5. Ops Portal 로그인..." -ForegroundColor Yellow
$opsLoginBody = @{
    username = $OpsUsername
    password = $OpsPassword
} | ConvertTo-Json

try {
    $opsLoginResponse = Invoke-RestMethod -Uri "$BaseUrl/ops/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $opsLoginBody `
        -SkipCertificateCheck
    
    $opsToken = $opsLoginResponse.data.token
    $opsActorId = $opsLoginResponse.data.actorId
    $opsActorRole = $opsLoginResponse.data.actorRole
    
    Write-Host "  ✅ Ops Portal 로그인 성공" -ForegroundColor Green
    Write-Host "  📋 Actor ID: $opsActorId, Role: $opsActorRole" -ForegroundColor Cyan
} catch {
    Write-Host "  ❌ Ops Portal 로그인 실패" -ForegroundColor Red
    Write-Host "  오류: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  상세: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Step 2: 온보딩 승인
Write-Host "2. 온보딩 승인..." -ForegroundColor Yellow
$approveBody = @{
    status = "APPROVED"
    actorId = $opsActorId
    note = "MVP 테스트 승인"
} | ConvertTo-Json

$approveHeaders = @{
    "Authorization" = "Bearer $opsToken"
    "X-Actor-Id" = $opsActorId
    "X-Actor-Role" = $opsActorRole
}

try {
    $approveResponse = Invoke-RestMethod -Uri "$BaseUrl/onboarding/requests/$requestId/decision" `
        -Method Post `
        -ContentType "application/json" `
        -Headers $approveHeaders `
        -Body $approveBody `
        -SkipCertificateCheck
    
    Write-Host "  ✅ 온보딩 승인 성공" -ForegroundColor Green
    Write-Host "  📋 승인 후 상태: $($approveResponse.status)" -ForegroundColor Cyan
    if ($approveResponse.tenantId) {
        Write-Host "  📋 생성된 테넌트 ID: $($approveResponse.tenantId)" -ForegroundColor Cyan
        $tenantId = $approveResponse.tenantId
    }
} catch {
    Write-Host "  ❌ 온보딩 승인 실패" -ForegroundColor Red
    Write-Host "  오류: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  상세: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# 잠시 대기 (프로시저 실행 시간)
Write-Host "  ⏳ 테넌트 생성 대기 중..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 3: 테넌트 확인 (재시도 로직 포함)
Write-Host "3. 테넌트 확인..." -ForegroundColor Yellow
$tenantListHeaders = @{
    "Authorization" = "Bearer $opsToken"
    "X-Actor-Id" = $opsActorId
    "X-Actor-Role" = $opsActorRole
}

$maxRetries = 5
$retryDelay = 3
$tenant = $null

for ($i = 1; $i -le $maxRetries; $i++) {
    try {
        $tenantListResponse = Invoke-RestMethod -Uri "$BaseUrl/ops/tenants" `
            -Method Get `
            -Headers $tenantListHeaders `
            -SkipCertificateCheck
        
        $tenant = $tenantListResponse.data | Where-Object { $_.tenantId -eq $tenantId } | Select-Object -First 1
        
        if ($tenant) {
            $tenantStatus = $tenant.status
            Write-Host "  ✅ 테넌트 확인 성공 (상태: $tenantStatus, 시도: $i/$maxRetries)" -ForegroundColor Green
            Write-Host "  📋 테넌트명: $($tenant.name)" -ForegroundColor Cyan
            break
        } else {
            if ($i -lt $maxRetries) {
                Write-Host "  ⏳ 테넌트를 찾을 수 없음. 재시도 중... ($i/$maxRetries)" -ForegroundColor Yellow
                Start-Sleep -Seconds $retryDelay
            } else {
                Write-Host "  ❌ 테넌트를 찾을 수 없음: $tenantId (최대 재시도 횟수 초과)" -ForegroundColor Red
                Write-Host "  📋 현재 테넌트 목록:" -ForegroundColor Yellow
                if ($tenantListResponse.data) {
                    $tenantListResponse.data | ForEach-Object {
                        Write-Host "    - $($_.tenantId) ($($_.name))" -ForegroundColor Gray
                    }
                } else {
                    Write-Host "    (테넌트 목록이 비어있음)" -ForegroundColor Gray
                }
                exit 1
            }
        }
    } catch {
        if ($i -lt $maxRetries) {
            Write-Host "  ⚠️  테넌트 확인 실패. 재시도 중... ($i/$maxRetries): $($_.Exception.Message)" -ForegroundColor Yellow
            Start-Sleep -Seconds $retryDelay
        } else {
            Write-Host "  ❌ 테넌트 확인 실패 (최대 재시도 횟수 초과): $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""
Write-Host "=== 테스트 완료 ===" -ForegroundColor Green
Write-Host "테넌트 ID: $tenantId" -ForegroundColor Cyan
Write-Host "관리자 이메일: $email" -ForegroundColor Cyan
Write-Host "비밀번호: $password" -ForegroundColor Cyan

