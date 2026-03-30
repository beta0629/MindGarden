#!/usr/bin/env node

/**
 * React Hooks 규칙 위반 수정 스크립트
 * 조건부 return 이전에 모든 hooks를 호출하도록 수정
 */

const fs = require('fs');
const path = require('path');

// 수정할 파일 패턴
const widgetFiles = [
  'frontend/src/components/dashboard/widgets/ConsultationRecordWidget.js',
  'frontend/src/components/dashboard/widgets/HealingCardWidget.js',
  'frontend/src/components/dashboard/widgets/PaymentSessionsWidget.js',
  'frontend/src/components/dashboard/widgets/PersonalizedMessagesWidget.js',
  'frontend/src/components/dashboard/widgets/RatableConsultationsWidget.js',
  'frontend/src/components/dashboard/widgets/ScheduleWidget.js',
  'frontend/src/components/dashboard/widgets/SummaryPanelsWidget.js',
  'frontend/src/components/dashboard/widgets/SystemNotificationWidget.js',
  'frontend/src/components/dashboard/widgets/admin/PendingDepositsWidget.js',
  'frontend/src/components/dashboard/widgets/admin/PermissionWidget.js',
  'frontend/src/components/dashboard/widgets/admin/StatisticsGridWidget.js',
  'frontend/src/components/dashboard/widgets/admin/SystemStatusWidget.js',
  'frontend/src/components/dashboard/widgets/consultation/ClientRegistrationWidget.js',
  'frontend/src/components/dashboard/widgets/consultation/ConsultantClientWidget.js',
  'frontend/src/components/dashboard/widgets/consultation/ConsultantRegistrationWidget.js',
  'frontend/src/components/dashboard/widgets/consultation/ConsultationRecordWidget.js',
  'frontend/src/components/dashboard/widgets/consultation/ConsultationScheduleWidget.js',
  'frontend/src/components/dashboard/widgets/consultation/ConsultationStatsWidget.js',
  'frontend/src/components/dashboard/widgets/consultation/ConsultationSummaryWidget.js',
  'frontend/src/components/dashboard/widgets/consultation/MappingManagementWidget.js',
  'frontend/src/components/dashboard/widgets/consultation/PendingDepositWidget.js',
  'frontend/src/components/dashboard/widgets/consultation/ScheduleRegistrationWidget.js',
  'frontend/src/components/dashboard/widgets/consultation/SessionManagementWidget.js',
  'frontend/src/components/dashboard/widgets/erp/ErpManagementGridWidget.js',
  'frontend/src/components/dashboard/widgets/erp/ErpStatsGridWidget.js'
];

function fixReactHooksInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 파일 없음: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 패턴 1: 조건부 return 이후의 useNavigate 수정
  const pattern1 = /const (\w+Widget) = \(\{ widget, user \}\) => \{[\s\S]*?if \([^)]+\) \{[\s\S]*?return null;[\s\S]*?\}[\s\S]*?const navigate = useNavigate\(\);/;
  if (pattern1.test(content)) {
    content = content.replace(
      /(const \w+Widget = \(\{ widget, user \}\) => \{[\s\S]*?)if \([^)]+\) \{[\s\S]*?return null;[\s\S]*?\}([\s\S]*?)const navigate = useNavigate\(\);/,
      '$1const navigate = useNavigate();$2if (!RoleUtils.isClient(user)) {\n    return null;\n  }'
    );
    modified = true;
  }

  // 패턴 2: useState hooks도 조건부 return 이전으로 이동
  const pattern2 = /if \([^)]+\) \{[\s\S]*?return null;[\s\S]*?\}[\s\S]*?const \[.*?\] = useState\(/;
  if (pattern2.test(content)) {
    // 더 복잡한 패턴 매칭이 필요하므로 수동으로 처리
    console.log(`⚠️  복잡한 패턴 발견: ${filePath} - 수동 확인 필요`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ 수정 완료: ${filePath}`);
    return true;
  }

  return false;
}

console.log('🔧 React Hooks 규칙 위반 수정 시작...\n');

let fixedCount = 0;
let totalCount = 0;

for (const filePath of widgetFiles) {
  totalCount++;
  if (fixReactHooksInFile(filePath)) {
    fixedCount++;
  }
}

console.log(`\n📊 수정 완료: ${fixedCount}/${totalCount} 파일`);

if (fixedCount > 0) {
  console.log('\n💡 수정된 파일들을 확인하고 추가 수정이 필요한지 검토하세요.');
} else {
  console.log('\n✅ 모든 파일이 이미 올바른 상태입니다.');
}
