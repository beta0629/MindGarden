#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// React Icons to Lucide React 매핑
const iconMappings = {
  // 기본 아이콘
  'FaUser': 'ICONS.USER',
  'FaUsers': 'ICONS.USERS',
  'FaUserTie': 'ICONS.USER_TIE',
  'FaUserCog': 'ICONS.USER_COG',
  'FaUserPlus': 'ICONS.USER_PLUS',
  'FaUserMinus': 'ICONS.USER_MINUS',
  'FaUserCheck': 'ICONS.USER_CHECK',
  'FaUserX': 'ICONS.USER_X',
  'FaUserGraduate': 'ICONS.GRADUATION_CAP',
  
  // 네비게이션
  'FaArrowUp': 'ICONS.ARROW_UP',
  'FaArrowDown': 'ICONS.ARROW_DOWN',
  'FaArrowLeft': 'ICONS.ARROW_LEFT',
  'FaArrowRight': 'ICONS.ARROW_RIGHT',
  'FaChevronUp': 'ICONS.CHEVRON_UP',
  'FaChevronDown': 'ICONS.CHEVRON_DOWN',
  'FaChevronLeft': 'ICONS.CHEVRON_LEFT',
  'FaChevronRight': 'ICONS.CHEVRON_RIGHT',
  'FaExternalLinkAlt': 'ICONS.EXTERNAL_LINK',
  
  // 시간/날짜
  'FaCalendarAlt': 'ICONS.CALENDAR',
  'FaCalendarCheck': 'ICONS.CALENDAR_CHECK',
  'FaCalendarDay': 'ICONS.CALENDAR_DAYS',
  'FaClock': 'ICONS.CLOCK',
  'FaStopwatch': 'ICONS.STOPWATCH',
  'FaHourglassHalf': 'ICONS.HOURGLASS',
  
  // 금융/비즈니스
  'FaDollarSign': 'ICONS.DOLLAR',
  'FaCreditCard': 'ICONS.CREDIT_CARD',
  'FaReceipt': 'ICONS.RECEIPT',
  'FaChartLine': 'ICONS.TRENDING_UP',
  'FaChartBar': 'ICONS.BAR_CHART',
  'FaChartPie': 'ICONS.PIE_CHART',
  'FaChartArea': 'ICONS.ACTIVITY',
  'FaPercentage': 'ICONS.PERCENT',
  'FaBuilding': 'ICONS.BUILDING',
  'FaWarehouse': 'ICONS.WAREHOUSE',
  'FaStore': 'ICONS.STORE',
  'FaBank': 'ICONS.BANK',
  'FaHospital': 'ICONS.HOSPITAL',
  'FaSchool': 'ICONS.SCHOOL',
  
  // 파일/문서
  'FaFile': 'ICONS.FILE',
  'FaFileAlt': 'ICONS.FILE_TEXT',
  'FaFilePdf': 'ICONS.FILE',
  'FaFileWord': 'ICONS.FILE',
  'FaFileExcel': 'ICONS.FILE',
  'FaFileImage': 'ICONS.IMAGE',
  'FaFileVideo': 'ICONS.VIDEO',
  'FaFileAudio': 'ICONS.MUSIC',
  'FaFolder': 'ICONS.FOLDER',
  'FaFolderOpen': 'ICONS.FOLDER_OPEN',
  'FaDownload': 'ICONS.DOWNLOAD',
  'FaUpload': 'ICONS.UPLOAD',
  'FaClipboard': 'ICONS.CLIPBOARD',
  'FaClipboardList': 'ICONS.CLIPBOARD_LIST',
  'FaClipboardCheck': 'ICONS.CLIPBOARD_CHECK',
  
  // 통신
  'FaMailBulk': 'ICONS.MAIL',
  'FaPhone': 'ICONS.PHONE',
  'FaEnvelope': 'ICONS.MAIL',
  'FaComment': 'ICONS.MESSAGE',
  'FaComments': 'ICONS.MESSAGE',
  'FaBell': 'ICONS.BELL',
  'FaBellSlash': 'ICONS.BELL_OFF',
  'FaBullhorn': 'ICONS.MEGAPHONE',
  
  // 상태/액션
  'FaPlay': 'ICONS.PLAY',
  'FaPause': 'ICONS.PAUSE',
  'FaStop': 'ICONS.STOP',
  'FaSync': 'ICONS.REFRESH',
  'FaSyncAlt': 'ICONS.REFRESH',
  'FaRedo': 'ICONS.ROTATE_CW',
  'FaUndo': 'ICONS.ROTATE_CCW',
  'FaRepeat': 'ICONS.REPEAT',
  'FaRefresh': 'ICONS.REFRESH',
  'FaRedoAlt': 'ICONS.ROTATE_CW',
  
  // 기본 UI
  'FaEdit': 'ICONS.EDIT',
  'FaTrash': 'ICONS.DELETE',
  'FaTrashAlt': 'ICONS.DELETE',
  'FaPlus': 'ICONS.PLUS',
  'FaMinus': 'ICONS.MINUS',
  'FaTimes': 'ICONS.X',
  'FaCheck': 'ICONS.CHECK',
  'FaCheckCircle': 'ICONS.SUCCESS',
  'FaTimesCircle': 'ICONS.ERROR',
  'FaExclamationTriangle': 'ICONS.ALERT',
  'FaExclamationCircle': 'ICONS.ALERT',
  'FaInfoCircle': 'ICONS.INFO',
  'FaQuestionCircle': 'ICONS.HELP',
  'FaSearch': 'ICONS.SEARCH',
  'FaFilter': 'ICONS.FILTER',
  'FaSort': 'ICONS.SORT_ASC',
  'FaSortUp': 'ICONS.SORT_ASC',
  'FaSortDown': 'ICONS.SORT_DESC',
  'FaEllipsisH': 'ICONS.MORE_HORIZONTAL',
  'FaEllipsisV': 'ICONS.MORE_VERTICAL',
  
  // 기타
  'FaHeart': 'ICONS.HEART',
  'FaStar': 'ICONS.STAR',
  'FaBookmark': 'ICONS.BOOKMARK',
  'FaFlag': 'ICONS.FLAG',
  'FaEye': 'ICONS.EYE',
  'FaEyeSlash': 'ICONS.EYE_OFF',
  'FaLightbulb': 'ICONS.LIGHTBULB',
  'FaGift': 'ICONS.GIFT',
  'FaTrophy': 'ICONS.TROPHY',
  'FaAward': 'ICONS.AWARD',
  'FaCrown': 'ICONS.CROWN',
  'FaGem': 'ICONS.GEM',
  'FaFlower': 'ICONS.FLOWER',
  'FaLeaf': 'ICONS.LEAF',
  'FaSun': 'ICONS.SUN',
  'FaMoon': 'ICONS.MOON',
  'FaCloud': 'ICONS.CLOUD',
  'FaCloudRain': 'ICONS.CLOUD_RAIN',
  'FaCloudSnow': 'ICONS.CLOUD_SNOW',
  'FaWind': 'ICONS.WIND',
  'FaThermometerHalf': 'ICONS.THERMOMETER',
  'FaTint': 'ICONS.DROPLETS',
  'FaUmbrella': 'ICONS.UMBRELLA',
  
  // 특수 아이콘
  'FaDatabase': 'ICONS.DATABASE',
  'FaServer': 'ICONS.SERVER',
  'FaCpu': 'ICONS.CPU',
  'FaHdd': 'ICONS.HARD_DRIVE',
  'FaWifi': 'ICONS.WIFI',
  'FaWifiSlash': 'ICONS.WIFI_OFF',
  'FaSignal': 'ICONS.SIGNAL',
  'FaSignalZero': 'ICONS.SIGNAL_ZERO',
  'FaSignalLow': 'ICONS.SIGNAL_LOW',
  'FaSignalMedium': 'ICONS.SIGNAL_MEDIUM',
  'FaSignalHigh': 'ICONS.SIGNAL_HIGH',
  
  // 화살표/방향
  'FaArrowUpRight': 'ICONS.ARROW_UP_RIGHT',
  'FaArrowDownRight': 'ICONS.ARROW_DOWN_RIGHT',
  'FaArrowUpLeft': 'ICONS.ARROW_UP_LEFT',
  'FaArrowDownLeft': 'ICONS.ARROW_DOWN_LEFT',
  'FaArrowCircleRight': 'ICONS.ARROW_RIGHT_CIRCLE',
  'FaArrowCircleLeft': 'ICONS.ARROW_LEFT_CIRCLE',
  'FaArrowCircleUp': 'ICONS.ARROW_UP_CIRCLE',
  'FaArrowCircleDown': 'ICONS.ARROW_DOWN_CIRCLE',
  
  // 기하학적
  'FaCircle': 'ICONS.CIRCLE',
  'FaSquare': 'ICONS.SQUARE',
  'FaTriangle': 'ICONS.TRIANGLE',
  'FaHexagon': 'ICONS.HEXAGON',
  'FaOctagon': 'ICONS.OCTAGON',
  'FaDiamond': 'ICONS.DIAMOND',
  
  // 수학/통계
  'FaPlusCircle': 'ICONS.PLUS_CIRCLE',
  'FaMinusCircle': 'ICONS.MINUS_CIRCLE',
  'FaTimesCircle': 'ICONS.X_CIRCLE',
  'FaCheckCircle': 'ICONS.SUCCESS',
  'FaDivide': 'ICONS.DIVIDE',
  'FaEquals': 'ICONS.EQUAL',
  'FaNotEqual': 'ICONS.NOT_EQUAL',
  'FaGreaterThan': 'ICONS.GREATER_THAN',
  'FaLessThan': 'ICONS.LESS_THAN',
  'FaPercentage': 'ICONS.PERCENT',
  
  // 편집
  'FaEdit': 'ICONS.EDIT',
  'FaPencilAlt': 'ICONS.PENCIL',
  'FaPen': 'ICONS.PEN_TOOL',
  'FaType': 'ICONS.TYPE',
  'FaAlignLeft': 'ICONS.ALIGN_LEFT',
  'FaAlignCenter': 'ICONS.ALIGN_CENTER',
  'FaAlignRight': 'ICONS.ALIGN_RIGHT',
  'FaAlignJustify': 'ICONS.ALIGN_JUSTIFY',
  'FaBold': 'ICONS.BOLD',
  'FaItalic': 'ICONS.ITALIC',
  'FaUnderline': 'ICONS.UNDERLINE',
  'FaStrikethrough': 'ICONS.STRIKETHROUGH',
  
  // 레이아웃
  'FaTh': 'ICONS.GRID',
  'FaThLarge': 'ICONS.GRID_3X3',
  'FaLayout': 'ICONS.LAYOUT',
  'FaBars': 'ICONS.MENU',
  'FaSidebar': 'ICONS.SIDEBAR',
  'FaPanelLeft': 'ICONS.PANEL_LEFT',
  'FaPanelRight': 'ICONS.PANEL_RIGHT',
  'FaPanelTop': 'ICONS.PANEL_TOP',
  'FaPanelBottom': 'ICONS.PANEL_BOTTOM',
  
  // 미디어
  'FaImage': 'ICONS.IMAGE',
  'FaVideo': 'ICONS.VIDEO',
  'FaMusic': 'ICONS.MUSIC',
  'FaMicrophone': 'ICONS.MIC',
  'FaMicrophoneSlash': 'ICONS.MIC_OFF',
  'FaVolumeUp': 'ICONS.VOLUME_2',
  'FaVolumeMute': 'ICONS.VOLUME_X',
  'FaPlayCircle': 'ICONS.PLAY_CIRCLE',
  'FaPauseCircle': 'ICONS.PAUSE_CIRCLE',
  'FaStopCircle': 'ICONS.STOP_CIRCLE',
  
  // 도구
  'FaWrench': 'ICONS.WRENCH',
  'FaHammer': 'ICONS.HAMMER',
  'FaScrewdriver': 'ICONS.SCREWDRIVER',
  'FaNut': 'ICONS.NUT',
  'FaCog': 'ICONS.COG',
  'FaCogs': 'ICONS.COGS',
  'FaSlidersH': 'ICONS.SLIDERS',
  'FaToggleOff': 'ICONS.TOGGLE_LEFT',
  'FaToggleOn': 'ICONS.TOGGLE_RIGHT',
  'FaExchangeAlt': 'ICONS.SWITCH',
  
  // 교통
  'FaCar': 'ICONS.CAR',
  'FaTruck': 'ICONS.TRUCK',
  'FaBus': 'ICONS.BUS',
  'FaTrain': 'ICONS.TRAIN',
  'FaPlane': 'ICONS.PLANE',
  'FaShip': 'ICONS.SHIP',
  'FaBicycle': 'ICONS.BIKE',
  'FaWalking': 'ICONS.WALKING',
  
  // 건물/장소
  'FaBuilding': 'ICONS.BUILDING',
  'FaBuilding2': 'ICONS.BUILDING_2',
  'FaHome': 'ICONS.HOUSE',
  'FaStore': 'ICONS.STORE',
  'FaSchool': 'ICONS.SCHOOL',
  'FaHospital': 'ICONS.HOSPITAL',
  'FaBank': 'ICONS.BANK',
  'FaFactory': 'ICONS.FACTORY',
  'FaWarehouse': 'ICONS.WAREHOUSE',
  
  // 자연
  'FaTree': 'ICONS.TREE',
  'FaMountain': 'ICONS.MOUNTAIN',
  'FaWater': 'ICONS.WAVES',
  'FaFish': 'ICONS.FISH',
  'FaDove': 'ICONS.BIRD',
  'FaBug': 'ICONS.BUG',
  'FaCat': 'ICONS.CAT',
  'FaDog': 'ICONS.DOG',
  
  // 음식
  'FaCoffee': 'ICONS.COFFEE',
  'FaUtensils': 'ICONS.UTENSILS',
  'FaPizzaSlice': 'ICONS.PIZZA',
  'FaBirthdayCake': 'ICONS.CAKE',
  'FaAppleAlt': 'ICONS.APPLE',
  'FaCarrot': 'ICONS.CARROT',
  'FaGrape': 'ICONS.GRAPE',
  'FaCherry': 'ICONS.CHERRY',
  
  // 스포츠/게임
  'FaGamepad': 'ICONS.GAMEPAD',
  'FaJoystick': 'ICONS.JOYSTICK',
  'FaDiceOne': 'ICONS.DICE_1',
  'FaDiceTwo': 'ICONS.DICE_2',
  'FaDiceThree': 'ICONS.DICE_3',
  'FaDiceFour': 'ICONS.DICE_4',
  'FaDiceFive': 'ICONS.DICE_5',
  'FaDiceSix': 'ICONS.DICE_6',
  'FaChess': 'ICONS.CHESS',
  'FaCrown': 'ICONS.CROWN',
  
  // 의료/건강
  'FaHeart': 'ICONS.HEART',
  'FaHeartbeat': 'ICONS.HEART_PULSE',
  'FaStethoscope': 'ICONS.STETHOSCOPE',
  'FaPills': 'ICONS.PILL',
  'FaSyringe': 'ICONS.SYRINGE',
  'FaBandAid': 'ICONS.BANDAGE',
  'FaThermometerHalf': 'ICONS.THERMOMETER',
  
  // 교육
  'FaBook': 'ICONS.BOOK',
  'FaBookOpen': 'ICONS.BOOK_OPEN',
  'FaGraduationCap': 'ICONS.GRADUATION_CAP',
  'FaPen': 'ICONS.PEN_TOOL',
  'FaCalculator': 'ICONS.CALCULATOR',
  'FaCompass': 'ICONS.COMPASS',
  'FaGlobe': 'ICONS.GLOBE',
  'FaMap': 'ICONS.MAP',
  'FaMapMarkerAlt': 'ICONS.MAP_PIN',
  
  // 쇼핑
  'FaShoppingCart': 'ICONS.SHOPPING_CART',
  'FaShoppingBag': 'ICONS.SHOPPING_BAG',
  'FaBox': 'ICONS.BOX',
  'FaGift': 'ICONS.GIFT',
  'FaTag': 'ICONS.TAG',
  'FaPercentage': 'ICONS.PERCENT',
  
  // 소셜
  'FaShare': 'ICONS.SHARE',
  'FaShareAlt': 'ICONS.SHARE_2',
  'FaThumbsUp': 'ICONS.THUMBS_UP',
  'FaThumbsDown': 'ICONS.THUMBS_DOWN',
  'FaSmile': 'ICONS.SMILE',
  'FaFrown': 'ICONS.FROWN',
  'FaMeh': 'ICONS.MEH',
  'FaLaugh': 'ICONS.LAUGH',
  'FaAngry': 'ICONS.ANGRY',
  'FaSad': 'ICONS.SAD',
  
  // 보안
  'FaKey': 'ICONS.KEY',
  'FaFingerprint': 'ICONS.FINGERPRINT',
  'FaQrcode': 'ICONS.QR_CODE',
  'FaShieldAlt': 'ICONS.SHIELD',
  'FaShieldCheck': 'ICONS.SHIELD_CHECK',
  'FaShieldExclamation': 'ICONS.SHIELD_ALERT',
  'FaShieldX': 'ICONS.SHIELD_X',
  
  // 개발/기술
  'FaCode': 'ICONS.CODE',
  'FaTerminal': 'ICONS.TERMINAL',
  'FaDesktop': 'ICONS.MONITOR',
  'FaLaptop': 'ICONS.LAPTOP',
  'FaMobile': 'ICONS.SMARTPHONE',
  'FaTablet': 'ICONS.TABLET',
  'FaWatch': 'ICONS.WATCH',
  'FaHeadphones': 'ICONS.HEADPHONES',
  'FaCamera': 'ICONS.CAMERA',
  'FaCameraSlash': 'ICONS.CAMERA_OFF',
  
  // 기타 유틸리티
  'FaCopy': 'ICONS.COPY',
  'FaClipboard': 'ICONS.CLIPBOARD',
  'FaClipboardCheck': 'ICONS.CLIPBOARD_CHECK',
  'FaClipboardList': 'ICONS.CLIPBOARD_LIST',
  'FaClipboardPaste': 'ICONS.CLIPBOARD_PASTE',
  'FaClipboardX': 'ICONS.CLIPBOARD_X',
  'FaCut': 'ICONS.SCISSORS',
  'FaPaperclip': 'ICONS.PAPERCLIP',
  'FaLink': 'ICONS.LINK',
  'FaUnlink': 'ICONS.UNLINK',
  'FaLock': 'ICONS.LOCK',
  'FaLockOpen': 'ICONS.UNLOCK',
  'FaEye': 'ICONS.EYE',
  'FaEyeSlash': 'ICONS.EYE_OFF',
  
  // 특수 문자/기호
  'FaHashtag': 'ICONS.HASH',
  'FaAt': 'ICONS.AT_SIGN',
  'FaAsterisk': 'ICONS.ASTERISK',
  'FaPlus': 'ICONS.PLUS',
  'FaMinus': 'ICONS.MINUS',
  'FaTimes': 'ICONS.X',
  'FaSlash': 'ICONS.SLASH',
  'FaBackslash': 'ICONS.BACKSLASH',
  'FaPipe': 'ICONS.PIPE',
  'FaTilde': 'ICONS.TILDE',
  'FaCaretUp': 'ICONS.CARET_UP',
  'FaCaretDown': 'ICONS.CARET_DOWN',
  'FaCaretLeft': 'ICONS.CARET_LEFT',
  'FaCaretRight': 'ICONS.CARET_RIGHT',
  
  // 화폐
  'FaCoins': 'ICONS.COINS',
  'FaMoneyBill': 'ICONS.BANKNOTE',
  'FaWallet': 'ICONS.WALLET',
  'FaCreditCard': 'ICONS.CREDIT_CARD',
  'FaReceipt': 'ICONS.RECEIPT',
  
  // 시간 관련
  'FaHourglassHalf': 'ICONS.HOURGLASS',
  'FaStopwatch': 'ICONS.STOPWATCH',
  'FaClock': 'ICONS.CLOCK',
  
  // 날씨
  'FaSun': 'ICONS.SUN',
  'FaMoon': 'ICONS.MOON',
  'FaCloud': 'ICONS.CLOUD',
  'FaCloudRain': 'ICONS.CLOUD_RAIN',
  'FaCloudSnow': 'ICONS.CLOUD_SNOW',
  'FaBolt': 'ICONS.CLOUD_LIGHTNING',
  'FaCloudDrizzle': 'ICONS.CLOUD_DRIZZLE',
  'FaCloudFog': 'ICONS.CLOUD_FOG',
  'FaWind': 'ICONS.WIND',
  'FaTornado': 'ICONS.TORNADO',
  'FaHurricane': 'ICONS.HURRICANE',
  
  // 기타
  'FaZap': 'ICONS.ZAP',
  'FaSparkles': 'ICONS.SPARKLES',
  'FaStar': 'ICONS.STAR',
  'FaHeart': 'ICONS.HEART',
  'FaBookmark': 'ICONS.BOOKMARK',
  'FaFlag': 'ICONS.FLAG',
  'FaAward': 'ICONS.AWARD',
  'FaTrophy': 'ICONS.TROPHY',
  'FaCrown': 'ICONS.CROWN',
  'FaGem': 'ICONS.GEM',
  'FaFlower': 'ICONS.FLOWER',
  'FaLeaf': 'ICONS.LEAF'
};

// 파일 목록
const filesToProcess = [
  'frontend/src/components/admin/ConsultantComprehensiveManagement.js',
  'frontend/src/components/admin/StatisticsDashboard.js',
  'frontend/src/components/hq/BranchStatisticsDashboard.js',
  'frontend/src/components/hq/FinancialReports.js',
  'frontend/src/components/hq/BranchManagement.js',
  'frontend/src/components/admin/ClientComprehensiveManagement.js',
  'frontend/src/components/admin/ConsultantManagement.js',
  'frontend/src/components/admin/UserManagement.js',
  'frontend/src/components/erp/RefundManagement.js',
  'frontend/src/components/admin/VacationStatistics.js',
  'frontend/src/components/admin/system/SystemStatus.js',
  'frontend/src/components/admin/TodayStatistics.js',
  'frontend/src/components/hq/HQBranchManagement.js',
  'frontend/src/components/hq/ConsolidatedFinancial.js',
  'frontend/src/components/hq/BranchUserTransfer.js',
  'frontend/src/components/hq/BranchRegistrationModal.js',
  'frontend/src/components/hq/BranchList.js',
  'frontend/src/components/hq/BranchForm.js',
  'frontend/src/components/hq/BranchDetail.js',
  'frontend/src/components/erp/refund/RefundFilters.js',
  'frontend/src/components/auth/AccountIntegrationModal.js'
];

// 아이콘 교체 함수
function replaceIcons(content) {
  let newContent = content;
  
  // React Icons import 제거
  newContent = newContent.replace(
    /import\s*{\s*[^}]*}\s*from\s*['"]react-icons\/fa['"];?\s*\n?/g,
    ''
  );
  
  // React Icons import 제거 (다른 패키지들)
  newContent = newContent.replace(
    /import\s*{\s*[^}]*}\s*from\s*['"]react-icons\/[^'"]*['"];?\s*\n?/g,
    ''
  );
  
  // 통일된 아이콘 상수 import 추가 (아직 없는 경우)
  if (!newContent.includes("import { ICONS, ICON_SIZES, ICON_COLORS } from '../../constants/icons';") &&
      !newContent.includes("import { ICONS, ICON_SIZES, ICON_COLORS } from '../../../constants/icons';") &&
      !newContent.includes("import { ICONS, ICON_SIZES, ICON_COLORS } from '../../../../constants/icons';")) {
    
    // 상대 경로 계산
    const depth = newContent.split('/').length - 1;
    const relativePath = '../'.repeat(depth) + 'constants/icons';
    
    // 첫 번째 import 뒤에 추가
    const firstImportIndex = newContent.indexOf('import ');
    if (firstImportIndex !== -1) {
      const nextLineIndex = newContent.indexOf('\n', firstImportIndex);
      newContent = newContent.slice(0, nextLineIndex) + 
                   `\nimport { ICONS, ICON_SIZES, ICON_COLORS } from '${relativePath}';` + 
                   newContent.slice(nextLineIndex);
    }
  }
  
  // 아이콘 사용 패턴 교체
  for (const [oldIcon, newIcon] of Object.entries(iconMappings)) {
    // JSX에서 사용되는 패턴들
    const patterns = [
      // <FaIcon />
      new RegExp(`<${oldIcon}\\s*/>`, 'g'),
      // <FaIcon className="..." />
      new RegExp(`<${oldIcon}\\s+className="[^"]*"\\s*/>`, 'g'),
      // <FaIcon size={...} />
      new RegExp(`<${oldIcon}\\s+size={[^}]*}\\s*/>`, 'g'),
      // <FaIcon className="..." size={...} />
      new RegExp(`<${oldIcon}\\s+className="[^"]*"\\s+size={[^}]*}\\s*/>`, 'g'),
      // <FaIcon size={...} className="..." />
      new RegExp(`<${oldIcon}\\s+size={[^}]*}\\s+className="[^"]*"\\s*/>`, 'g'),
      // <FaIcon {...props} />
      new RegExp(`<${oldIcon}\\s+[^>]*/>`, 'g'),
      // icon: FaIcon
      new RegExp(`icon:\\s*${oldIcon}`, 'g'),
      // icon={FaIcon}
      new RegExp(`icon=\\{${oldIcon}\\}`, 'g')
    ];
    
    patterns.forEach(pattern => {
      newContent = newContent.replace(pattern, (match) => {
        // className 추출
        const classNameMatch = match.match(/className="([^"]*)"/);
        const className = classNameMatch ? classNameMatch[1] : '';
        
        // size 추출
        const sizeMatch = match.match(/size=\{([^}]*)\}/);
        const size = sizeMatch ? sizeMatch[1] : 'ICON_SIZES.MD';
        
        // color 추출
        const colorMatch = match.match(/color="([^"]*)"/);
        const color = colorMatch ? colorMatch[1] : 'ICON_COLORS.PRIMARY';
        
        // 새로운 JSX 생성
        let newJSX = `<${newIcon}`;
        
        if (size !== 'ICON_SIZES.MD') {
          newJSX += ` size={${size}}`;
        } else {
          newJSX += ` size={ICON_SIZES.MD}`;
        }
        
        if (color !== 'ICON_COLORS.PRIMARY') {
          newJSX += ` color={${color}}`;
        } else {
          newJSX += ` color={ICON_COLORS.PRIMARY}`;
        }
        
        if (className) {
          newJSX += ` className="${className}"`;
        }
        
        newJSX += ' />';
        
        return newJSX;
      });
    });
  }
  
  return newContent;
}

// 파일 처리 함수
function processFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
      return;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const newContent = replaceIcons(content);
    
    if (content !== newContent) {
      fs.writeFileSync(fullPath, newContent, 'utf8');
      console.log(`✅ 처리 완료: ${filePath}`);
    } else {
      console.log(`⏭️  변경사항 없음: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ 오류 발생: ${filePath}`, error.message);
  }
}

// 메인 실행
console.log('🚀 아이콘 교체 스크립트 시작...\n');

filesToProcess.forEach(processFile);

console.log('\n✅ 모든 파일 처리 완료!');
