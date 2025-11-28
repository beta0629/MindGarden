#!/usr/bin/env node

/**
 * 모든 컴포넌트의 아이콘을 중앙화된 시스템으로 일괄 변경하는 스크립트
 * 
 * 1. react-icons와 lucide-react 직접 import 제거
 * 2. ICONS, IconHelpers import 추가
 * 3. 아이콘 사용을 IconHelpers로 변경
 */

const fs = require('fs');
const path = require('path');

// 처리할 파일 목록
const filesToProcess = [
  'frontend/src/components/ui/ConsultantDetailModal.js',
  'frontend/src/components/ui/Card/ClientCard.js',
  'frontend/src/components/ui/Card/ConsultantCard.js',
  'frontend/src/components/ui/Notification/Toast.js',
  'frontend/src/components/ui/Modal/Modal.js',
  'frontend/src/components/hq/BranchFinancialManagement.js',
  'frontend/src/components/hq/HQDashboard.js',
  'frontend/src/components/wellness/WellnessNotificationDetail.js',
  'frontend/src/components/wellness/WellnessNotificationList.js',
  'frontend/src/components/layout/SimpleLayout.js',
  'frontend/src/components/admin/mapping/SessionExtensionModal.js',
  'frontend/src/components/admin/mapping/MappingDepositModal.js',
  'frontend/src/components/admin/mapping/MappingFilters.js',
  'frontend/src/components/admin/mapping/MappingCard.js',
  'frontend/src/components/admin/mapping/MappingDetailModal.js',
  'frontend/src/components/admin/DiscountPaymentConfirmationModal.js',
  'frontend/src/components/admin/WellnessManagement.js',
  'frontend/src/components/admin/SessionManagement.js',
  'frontend/src/components/admin/VacationManagementModal.js',
  'frontend/src/components/admin/ClientCard.js',
  'frontend/src/components/admin/ConsultantCard.js',
  'frontend/src/components/admin/StatisticsDashboard.js',
  'frontend/src/components/admin/ConsultantComprehensiveManagement.js'
];

// 아이콘 매핑 (lucide-react -> ICONS)
const iconMapping = {
  'Users': 'USERS',
  'User': 'USER',
  'Calendar': 'CALENDAR',
  'CheckCircle': 'CHECK_CIRCLE',
  'XCircle': 'X_CIRCLE',
  'AlertCircle': 'ALERT_CIRCLE',
  'Info': 'INFO',
  'Settings': 'SETTINGS',
  'Edit': 'EDIT',
  'Trash2': 'TRASH',
  'Plus': 'PLUS',
  'X': 'X',
  'Check': 'CHECK',
  'Search': 'SEARCH',
  'Filter': 'FILTER',
  'Download': 'DOWNLOAD',
  'Upload': 'UPLOAD',
  'Save': 'SAVE',
  'Mail': 'MAIL',
  'Phone': 'PHONE',
  'MapPin': 'MAP_PIN',
  'Clock': 'CLOCK',
  'TrendingUp': 'TRENDING_UP',
  'TrendingDown': 'TRENDING_DOWN',
  'BarChart': 'BAR_CHART',
  'PieChart': 'PIE_CHART',
  'Activity': 'ACTIVITY',
  'Heart': 'HEART',
  'Star': 'STAR',
  'Award': 'AWARD',
  'Target': 'TARGET',
  'Shield': 'SHIELD',
  'Lock': 'LOCK',
  'Unlock': 'UNLOCK',
  'Eye': 'EYE',
  'EyeOff': 'EYE_OFF',
  'Bell': 'BELL',
  'BellOff': 'BELL_OFF',
  'MessageSquare': 'MESSAGE_SQUARE',
  'Send': 'SEND',
  'Paperclip': 'PAPERCLIP',
  'Image': 'IMAGE',
  'File': 'FILE',
  'FileText': 'FILE_TEXT',
  'Folder': 'FOLDER',
  'Home': 'HOME',
  'Building': 'BUILDING',
  'Briefcase': 'BRIEFCASE',
  'Package': 'PACKAGE',
  'ShoppingCart': 'SHOPPING_CART',
  'CreditCard': 'CREDIT_CARD',
  'DollarSign': 'DOLLAR',
  'Receipt': 'RECEIPT',
  'Wallet': 'WALLET',
  'Truck': 'TRUCK',
  'RotateCcw': 'ROTATE_CCW',
  'RefreshCw': 'REFRESH',
  'ChevronLeft': 'CHEVRON_LEFT',
  'ChevronRight': 'CHEVRON_RIGHT',
  'ChevronUp': 'CHEVRON_UP',
  'ChevronDown': 'CHEVRON_DOWN',
  'ArrowLeft': 'ARROW_LEFT',
  'ArrowRight': 'ARROW_RIGHT',
  'ArrowUp': 'ARROW_UP',
  'ArrowDown': 'ARROW_DOWN',
  'MoreVertical': 'MORE_VERTICAL',
  'MoreHorizontal': 'MORE_HORIZONTAL',
  'Menu': 'MENU',
  'Grid': 'GRID',
  'List': 'LIST',
  'Layout': 'LAYOUT',
  'Maximize': 'MAXIMIZE',
  'Minimize': 'MINIMIZE',
  'Copy': 'COPY',
  'Clipboard': 'CLIPBOARD',
  'ExternalLink': 'EXTERNAL_LINK',
  'Link': 'LINK',
  'Link2': 'LINK_2',
  'Zap': 'ZAP',
  'Sparkles': 'SPARKLES'
};

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  파일 없음: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // 1. lucide-react import 확인
  const hasLucideImport = content.includes("from 'lucide-react'");
  
  if (hasLucideImport) {
    // 2. ICONS import가 없으면 추가
    if (!content.includes("from '../../constants/icons'") && 
        !content.includes("from '../../../constants/icons'") &&
        !content.includes("from '../../../../constants/icons'")) {
      
      // 상대 경로 계산
      const depth = filePath.split('/').length - 3; // frontend/src/ 제외
      const relativePath = '../'.repeat(depth) + 'constants/icons';
      
      // import 추가
      const importStatement = `import { ICONS, ICON_SIZES, ICON_COLORS, IconHelpers } from '${relativePath}';\n`;
      
      // 첫 번째 import 문 뒤에 추가
      const firstImportIndex = content.indexOf('import');
      if (firstImportIndex !== -1) {
        const firstImportEnd = content.indexOf('\n', firstImportIndex);
        content = content.slice(0, firstImportEnd + 1) + importStatement + content.slice(firstImportEnd + 1);
        modified = true;
        console.log(`✅ ICONS import 추가: ${filePath}`);
      }
    }

    // 3. 아이콘 사용 패턴 변경
    // <IconName size={24} /> -> <ICONS.ICON_NAME size={24} />
    Object.entries(iconMapping).forEach(([lucideName, iconsName]) => {
      // JSX에서 사용되는 패턴
      const patterns = [
        // <IconName ... />
        new RegExp(`<${lucideName}([\\s/>])`, 'g'),
        // {IconName}
        new RegExp(`\\{${lucideName}\\}`, 'g')
      ];

      patterns.forEach(pattern => {
        if (pattern.test(content)) {
          content = content.replace(pattern, (match, suffix) => {
            if (suffix) {
              return `<ICONS.${iconsName}${suffix}`;
            }
            return `{ICONS.${iconsName}}`;
          });
          modified = true;
        }
      });
    });
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ 수정 완료: ${filePath}`);
  } else {
    console.log(`ℹ️  변경 없음: ${filePath}`);
  }
}

console.log('🚀 아이콘 통합 작업 시작...\n');

filesToProcess.forEach(processFile);

console.log('\n✅ 아이콘 통합 작업 완료!');
console.log('\n⚠️  주의: 일부 아이콘은 수동으로 확인이 필요할 수 있습니다.');
console.log('   - 색상이 지정된 아이콘');
console.log('   - 크기가 특별히 지정된 아이콘');
console.log('   - 조건부로 렌더링되는 아이콘');



