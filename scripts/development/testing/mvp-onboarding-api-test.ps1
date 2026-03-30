# MVP 온보딩 플로우 API 테스트 스크립트 (PowerShell)
# 1월 심사/발표를 위한 최소 기능 테스트

param(
    [string]$BaseUrl = "http://localhost:8080/api/v1",
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

Write-Host "=== MVP 온보딩 플로우 API 테스트 시작 ===" -ForegroundColor Green
Write-Host "테넌트 ID: $tenantId" -ForegroundColor Cyan
Write-Host "이메일: $email" -ForegroundColor Cyan
Write-Host ""

# Step 1: 온보딩 요청 생성
Write-Host "1. 온보딩 요청 생성..." -ForegroundColor Yellow
$requestBody = @{
    tenantId = $tenantId
    tenantName = $tenantName
    requestedBy = $email
    riskLevel = "LOW"
    businessType = $BusinessType
    checklistJson = "{`"adminPassword`": `"$password`"}"
    adminPassword = $password
} | ConvertTo-Json -Depth 10

try {
    $requestResponse = Invoke-RestMethod -Uri "$BaseUrl/onboarding/requests" `
        -Method Post `
        -ContentType "application/json" `
        -Body $requestBody
    
    $requestId = $requestResponse.data.id
    Write-Host "  ✅ 온보딩 요청 생성 성공 (ID: $requestId)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ 온보딩 요청 생성 실패: $_" -ForegroundColor Red
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
        -Body $opsLoginBody
    
    $opsToken = $opsLoginResponse.data.token
    $opsActorId = $opsLoginResponse.data.actorId
    $opsActorRole = $opsLoginResponse.data.actorRole
    
    Write-Host "  ✅ Ops Portal 로그인 성공" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Ops Portal 로그인 실패: $_" -ForegroundColor Red
    Write-Host "  ⚠️  승인 API는 인증이 필요합니다." -ForegroundColor Yellow
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
        -Body $approveBody
    
    Write-Host "  ✅ 온보딩 승인 성공" -ForegroundColor Green
} catch {
    Write-Host "  ❌ 온보딩 승인 실패: $_" -ForegroundColor Red
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
            -Headers $tenantListHeaders
        
        $tenant = $tenantListResponse.data | Where-Object { $_.tenantId -eq $tenantId } | Select-Object -First 1
        
        if ($tenant) {
            $tenantStatus = $tenant.status
            Write-Host "  ✅ 테넌트 확인 성공 (상태: $tenantStatus, 시도: $i/$maxRetries)" -ForegroundColor Green
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
                        Write-Host "    - $($_.tenantId) ($($_.tenantName))" -ForegroundColor Gray
                    }
                } else {
                    Write-Host "    (테넌트 목록이 비어있음)" -ForegroundColor Gray
                }
                exit 1
            }
        }
    } catch {
        if ($i -lt $maxRetries) {
            Write-Host "  ⚠️  테넌트 확인 실패. 재시도 중... ($i/$maxRetries): $_" -ForegroundColor Yellow
            Start-Sleep -Seconds $retryDelay
        } else {
            Write-Host "  ❌ 테넌트 확인 실패 (최대 재시도 횟수 초과): $_" -ForegroundColor Red
            exit 1
        }
    }
}

# Step 4: 관리자 계정 로그인
Write-Host "4. 관리자 계정 로그인..." -ForegroundColor Yellow
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody
    
    $token = $loginResponse.data.token
    $userRole = $loginResponse.data.user.role
    
    Write-Host "  ✅ 관리자 로그인 성공 (역할: $userRole)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ 관리자 로그인 실패: $_" -ForegroundColor Red
    Write-Host "  ⚠️  관리자 계정이 생성되지 않았을 수 있습니다." -ForegroundColor Yellow
    exit 1
}

# Step 5: 대시보드 조회
Write-Host "5. 대시보드 조회..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $dashboardResponse = Invoke-RestMethod -Uri "$BaseUrl/dashboards" `
        -Method Get `
        -Headers $headers
    
    $dashboardCount = $dashboardResponse.data.Count
    Write-Host "  ✅ 대시보드 조회 성공 (대시보드 수: $dashboardCount)" -ForegroundColor Green
    
    # 첫 번째 대시보드의 위젯 확인
    if ($dashboardResponse.data.Count -gt 0) {
        $firstDashboard = $dashboardResponse.data[0]
        $widgetCount = $firstDashboard.dashboardConfig.widgets.Count
        Write-Host "  ✅ 위젯 확인 (위젯 수: $widgetCount)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ 대시보드 조회 실패: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== 테스트 완료 ===" -ForegroundColor Green
Write-Host "테넌트 ID: $tenantId" -ForegroundColor Cyan
Write-Host "관리자 이메일: $email" -ForegroundColor Cyan
Write-Host "비밀번호: $password" -ForegroundColor Cyan

