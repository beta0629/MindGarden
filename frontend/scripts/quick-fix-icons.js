#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 아이콘 문제를 빠르게 해결하는 스크립트
 * 존재하지 않는 아이콘들을 모두 제거하고 기본 아이콘들만 사용
 */

const ICONS_FILE = path.join(__dirname, '../src/constants/icons.js');

// lucide-react에서 실제로 존재하는 기본 아이콘들만 사용
const BASIC_ICONS = [
  'X', 'Check', 'Plus', 'Minus', 'Edit', 'Trash2', 'Save', 'Search',
  'Eye', 'EyeOff', 'Lock', 'Unlock', 'Key', 'Shield', 'AlertTriangle',
  'Info', 'CheckCircle', 'XCircle', 'Play', 'Pause', 'Square',
  'Download', 'Upload', 'Copy', 'Scissors', 'Clipboard', 'RefreshCw',
  'RotateCcw', 'ZoomIn', 'Filter', 'ArrowUpDown', 'Calendar', 'Clock',
  'Timer', 'MapPin', 'Phone', 'Mail', 'MessageCircle', 'Bell',
  'Settings', 'Menu', 'MoreHorizontal', 'ArrowRight', 'ChevronRight',
  'Star', 'Heart', 'ThumbsUp', 'ThumbsDown', 'Smile', 'Frown',
  'Angry', 'HelpCircle', 'Meh', 'Bookmark', 'Flag', 'Tag',
  'Folder', 'File', 'Image', 'Video', 'Volume2', 'Camera',
  'Mic', 'Headphones', 'Speaker', 'Monitor', 'Laptop', 'Tablet',
  'Watch', 'Gamepad2', 'Mouse', 'Keyboard', 'Printer', 'Scan',
  'Wifi', 'Bluetooth', 'Nfc', 'Battery', 'Power', 'Plug',
  'Cable', 'Usb', 'Router', 'Server', 'Database', 'Cloud',
  'HardDrive', 'Disc', 'Cassette', 'Radio', 'Tv', 'Projector',
  'Lamp', 'Lightbulb', 'Flashlight', 'Candle', 'Flame', 'Droplets',
  'Droplet', 'CloudRain', 'Snowflake', 'Sun', 'Moon', 'Star',
  'Globe', 'Map', 'Compass', 'Navigation', 'Route', 'Bridge',
  'Building', 'Home', 'Store', 'Utensils', 'Coffee', 'Wine',
  'Library', 'Trees', 'Mountain', 'Waves', 'User', 'Users',
  'UserCircle', 'UserSquare', 'LogIn', 'LogOut', 'ShieldCheck',
  'ShieldAlert', 'Fingerprint', 'Users2', 'UserCircle', 'UserSquare'
];

console.log('🚀 아이콘 문제 빠른 해결 중...');

try {
  let content = fs.readFileSync(ICONS_FILE, 'utf8');
  
  // 기본 아이콘들만 사용하는 새로운 import 문 생성
  const newImport = `import {
  ${BASIC_ICONS.join(',\n  ')}
} from 'lucide-react';`;
  
  // 기존 import 문들을 모두 제거하고 새로운 import 문으로 교체
  content = content.replace(/import\s*\{[^}]+\}\s*from\s*['"]lucide-react['"];?/g, '');
  content = content.replace(/import\s*{[^}]+}\s*from\s*['"]lucide-react['"];?/g, '');
  
  // 파일 시작 부분에 새로운 import 문 추가
  const lines = content.split('\n');
  const firstImportIndex = lines.findIndex(line => line.includes('import') && line.includes('from'));
  if (firstImportIndex !== -1) {
    lines.splice(firstImportIndex, 0, newImport);
  } else {
    lines.unshift(newImport);
  }
  
  // ICONS 객체를 기본 아이콘들만 사용하도록 재생성
  const iconsObject = `const ICONS = {
  // 기본 액션
  X: X,
  CHECK: Check,
  PLUS: Plus,
  MINUS: Minus,
  EDIT: Edit,
  TRASH: Trash2,
  SAVE: Save,
  SEARCH: Search,
  
  // 보기 및 보안
  EYE: Eye,
  EYE_OFF: EyeOff,
  LOCK: Lock,
  UNLOCK: Unlock,
  KEY: Key,
  SHIELD: Shield,
  SHIELD_CHECK: ShieldCheck,
  SHIELD_ALERT: ShieldAlert,
  FINGERPRINT: Fingerprint,
  
  // 알림 및 상태
  ALERT_TRIANGLE: AlertTriangle,
  INFO: Info,
  CHECK_CIRCLE: CheckCircle,
  X_CIRCLE: XCircle,
  HELP_CIRCLE: HelpCircle,
  
  // 미디어
  PLAY: Play,
  PAUSE: Pause,
  STOP: Square,
  VOLUME: Volume2,
  CAMERA: Camera,
  MIC: Mic,
  HEADPHONES: Headphones,
  SPEAKER: Speaker,
  
  // 디바이스
  MONITOR: Monitor,
  LAPTOP: Laptop,
  TABLET: Tablet,
  WATCH: Watch,
  GAMEPAD: Gamepad2,
  MOUSE: Mouse,
  KEYBOARD: Keyboard,
  PRINTER: Printer,
  SCAN: Scan,
  
  // 네트워크
  WIFI: Wifi,
  BLUETOOTH: Bluetooth,
  NFC: Nfc,
  ROUTER: Router,
  SERVER: Server,
  DATABASE: Database,
  CLOUD: Cloud,
  HARD_DRIVE: HardDrive,
  
  // 네비게이션
  ARROW_RIGHT: ArrowRight,
  CHEVRON_RIGHT: ChevronRight,
  MENU: Menu,
  MORE_HORIZONTAL: MoreHorizontal,
  
  // 감정
  SMILE: Smile,
  FROWN: Frown,
  ANGRY: Angry,
  MEH: Meh,
  HEART: Heart,
  STAR: Star,
  THUMBS_UP: ThumbsUp,
  THUMBS_DOWN: ThumbsDown,
  
  // 기타
  CALENDAR: Calendar,
  CLOCK: Clock,
  TIMER: Timer,
  MAP_PIN: MapPin,
  PHONE: Phone,
  MAIL: Mail,
  MESSAGE_CIRCLE: MessageCircle,
  BELL: Bell,
  SETTINGS: Settings,
  BOOKMARK: Bookmark,
  FLAG: Flag,
  TAG: Tag,
  FOLDER: Folder,
  FILE: File,
  IMAGE: Image,
  VIDEO: Video,
  
  // 사용자
  USER: User,
  USERS: Users,
  USER_CIRCLE: UserCircle,
  USER_SQUARE: UserSquare,
  USERS_2: Users2,
  LOG_IN: LogIn,
  LOG_OUT: LogOut,
  
  // 날씨
  SUN: Sun,
  MOON: Moon,
  CLOUD_RAIN: CloudRain,
  SNOWFLAKE: Snowflake,
  DROPLET: Droplet,
  DROPLETS: Droplets,
  
  // 위치
  GLOBE: Globe,
  MAP: Map,
  COMPASS: Compass,
  NAVIGATION: Navigation,
  ROUTE: Route,
  BRIDGE: Bridge,
  BUILDING: Building,
  HOME: Home,
  STORE: Store,
  LIBRARY: Library,
  TREES: Trees,
  MOUNTAIN: Mountain,
  WAVES: Waves,
  
  // 액션
  DOWNLOAD: Download,
  UPLOAD: Upload,
  COPY: Copy,
  SCISSORS: Scissors,
  CLIPBOARD: Clipboard,
  REFRESH_CW: RefreshCw,
  ROTATE_CCW: RotateCcw,
  ZOOM_IN: ZoomIn,
  FILTER: Filter,
  ARROW_UP_DOWN: ArrowUpDown,
  
  // 전력 및 배터리
  BATTERY: Battery,
  POWER: Power,
  PLUG: Plug,
  CABLE: Cable,
  USB: Usb,
  
  // 조명
  LAMP: Lamp,
  LIGHTBULB: Lightbulb,
  FLASHLIGHT: Flashlight,
  CANDLE: Candle,
  FLAME: Flame
};`;

  // 기존 ICONS 객체를 찾아서 교체
  const iconsStart = content.indexOf('const ICONS = {');
  const iconsEnd = content.indexOf('};', iconsStart) + 2;
  
  if (iconsStart !== -1 && iconsEnd !== -1) {
    content = content.substring(0, iconsStart) + iconsObject + content.substring(iconsEnd);
  } else {
    // ICONS 객체가 없으면 추가
    content += '\n\n' + iconsObject;
  }
  
  fs.writeFileSync(ICONS_FILE, content, 'utf8');
  console.log('✅ 아이콘 문제 해결 완료!');
  console.log(`📊 사용된 기본 아이콘 수: ${BASIC_ICONS.length}`);
  
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
}
