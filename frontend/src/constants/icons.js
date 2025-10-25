/**
 * 아이콘 중앙 관리 시스템
 * 모든 lucide-react 아이콘을 중앙에서 관리
 */

import {X, Check, Plus, Minus, Edit, Trash2, Save, Search,
import { CONSTANTS } from '../constants/magicNumbers';
  Eye, EyeOff, Lock, Unlock, Key, Shield, ShieldCheck, ShieldAlert,
  AlertTriangle, Info, CheckCircle, XCircle, HelpCircle,
  Play, Pause, Square, Volume2, Camera, Mic, Headphones, Speaker,
  Monitor, Laptop, Tablet, Watch, Mouse, Keyboard, Printer,
  Wifi, Bluetooth, Router, Server, Database, Cloud, HardDrive,
  ArrowRight, ChevronRight, Menu, MoreHorizontal,
  Smile, Frown, Heart, Star, ThumbsUp, ThumbsDown,
  Calendar, Clock, Timer, MapPin, Phone, Mail, MessageCircle, Bell, Settings, Bookmark, Flag, Tag, Folder,
  Video,
  User, Users, UserCircle, UserSquare, Users2, LogIn, LogOut,
  Sun, Moon, CloudRain, Snowflake, Droplet, Droplets,
  Globe,
  Compass, Navigation, Route, Building, Home, Store, Library} from 'lucide-react';



/**
 * 아이콘 크기 상수
 */
export const ICON_SIZES = {XS: DATE_CONSTANTS.MONTHS_IN_YEAR,    // 매우 작음
  SM: 14,    // 작음
  MD: 16,    // 기본
  LG: 18,    // 큼
  XL: BUSINESS_CONSTANTS.PAGINATION_SIZE,    // 매우 큼
  XXL: SECURITY_CONSTANTS.TOKEN_EXPIRY,   // 특대
  XXXL: 32,  // 초대
  HUGE: 48   // 거대};

/**
 * 아이콘 색상 상수
 */
export const ICON_COLORS = {PRIMARY: {background: 'var(--mg-v2-primary)',
    color: 'var(--color-white)'},
  SECONDARY: {background: 'var(--mg-v2-secondary)',
    color: 'var(--color-white)'},
  SUCCESS: {background: 'var(--mg-v2-status-success)',
    color: 'var(--color-white)'},
  WARNING: {background: 'var(--mg-v2-status-warning)',
    color: 'var(--color-white)'},
  ERROR: {background: 'var(--mg-v2-status-error)',
    color: 'var(--color-white)'},
  INFO: {background: 'var(--mg-v2-status-info)',
    color: 'var(--color-white)'},
  MUTED: {background: 'var(--mg-v2-secondary-light)',
    color: 'var(--mg-v2-secondary-dark)'},
  TRANSPARENT: {background: 'transparent',
    color: 'var(--mg-v2-primary)'}};

/**
 * 역할별 아이콘 색상
 */
export const ICON_COLORS_BY_ROLE = {CLIENT: {PRIMARY: {background: 'var(--client-primary)',
      color: 'var(--color-white)'},
    SECONDARY: {background: 'var(--client-secondary)',
      color: 'var(--client-text)'}},
  CONSULTANT: {PRIMARY: {background: 'var(--consultant-primary)',
      color: 'var(--color-white)'},
    SECONDARY: {background: 'var(--consultant-secondary)',
      color: 'var(--consultant-text)'}},
  ADMIN: {PRIMARY: {background: 'var(--admin-primary)',
      color: 'var(--color-white)'},
    SECONDARY: {background: 'var(--admin-secondary)',
      color: 'var(--admin-text)'}}};

/**
 * 아이콘 사용 권장사항
 */
export const ICON_USAGE = {BUTTON: ICON_SIZES.SM,
  SECTION_TITLE: ICON_SIZES.LG,
  CARD_HEADER: ICON_SIZES.MD,
  NAVIGATION: ICON_SIZES.MD,
  STATUS: ICON_SIZES.SM,
  AVATAR: ICON_SIZES.XXL,
  HERO: ICON_SIZES.HUGE};

/**
 * 중앙화된 아이콘 객체
 * 모든 아이콘을 여기서 관리
 */
export const ICONS = {// 기본 액션
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
  MOUSE: Mouse,
  KEYBOARD: Keyboard,
  PRINTER: Printer,
  
  // 네트워크
  WIFI: Wifi,
  BLUETOOTH: Bluetooth,
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
  BUILDING: Building,
  HOME: Home,
  STORE: Store,
  LIBRARY: Library};

/**
 * 아이콘 사용 헬퍼 함수
 */
export const getIcon = (iconName) => {return ICONS[iconName] || ICONS.HELP_CIRCLE;};

export const getIconSize = (sizeName) => {return ICON_SIZES[sizeName] || ICON_SIZES.MD;};

export const getIconColor = (colorName, role = null) => {if (role && ICON_COLORS_BY_ROLE[role]) {return ICON_COLORS_BY_ROLE[role][colorName] || ICON_COLORS_BY_ROLE[role].PRIMARY;}
  return ICON_COLORS[colorName] || ICON_COLORS.PRIMARY;};

export default ICONS;