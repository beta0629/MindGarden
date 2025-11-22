# MVP 온보딩 플로우 API 테스트 스크립트 (PowerShell)
# 1월 심사/발표를 위한 최소 기능 테스트

param(
    [string]$BaseUrl = "http://localhost:8080/api/v1",
    [string]$BusinessType = "CONSULTATION"
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
    businessType = $BusinessType
    checklistJson = "{`"adminPassword`": `"$password`"}"
} | ConvertTo-Json

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

# Step 2: 온보딩 승인
Write-Host "2. 온보딩 승인..." -ForegroundColor Yellow
$approveBody = @{
    status = "APPROVED"
    decidedBy = "system-admin"
    decisionNote = "MVP 테스트 승인"
} | ConvertTo-Json

try {
    $approveResponse = Invoke-RestMethod -Uri "$BaseUrl/onboarding/requests/$requestId/decide" `
        -Method Put `
        -ContentType "application/json" `
        -Body $approveBody
    
    Write-Host "  ✅ 온보딩 승인 성공" -ForegroundColor Green
} catch {
    Write-Host "  ❌ 온보딩 승인 실패: $_" -ForegroundColor Red
    exit 1
}

# 잠시 대기 (프로시저 실행 시간)
Start-Sleep -Seconds 2

# Step 3: 테넌트 확인
Write-Host "3. 테넌트 확인..." -ForegroundColor Yellow
try {
    $tenantResponse = Invoke-RestMethod -Uri "$BaseUrl/tenants/$tenantId" `
        -Method Get
    
    $tenantStatus = $tenantResponse.data.status
    $settingsJson = $tenantResponse.data.settingsJson
    
    Write-Host "  ✅ 테넌트 확인 성공 (상태: $tenantStatus)" -ForegroundColor Green
    
    # settings_json features 확인
    if ($settingsJson) {
        $features = $settingsJson.features
        if ($features) {
            Write-Host "  ✅ settings_json features 확인:" -ForegroundColor Green
            Write-Host "    - consultation: $($features.consultation)" -ForegroundColor Cyan
            Write-Host "    - academy: $($features.academy)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "  ❌ 테넌트 확인 실패: $_" -ForegroundColor Red
    exit 1
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

