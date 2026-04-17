/**
 * Icon registry — central lucide-react mapping for Icon component
 */

import {
  X,
  Check,
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Search,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  HelpCircle,
  Play,
  Pause,
  Square,
  Volume2,
  Camera,
  Mic,
  Headphones,
  Speaker,
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Watch,
  Mouse,
  Keyboard,
  Printer,
  Wifi,
  Bluetooth,
  Router,
  Server,
  Database,
  Cloud,
  HardDrive,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  MoreHorizontal,
  Smile,
  Frown,
  Heart,
  Star,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Clock,
  Timer,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Bell,
  Settings,
  Bookmark,
  Flag,
  Tag,
  Folder,
  File,
  FileText,
  Image,
  Map,
  Video,
  User,
  Users,
  UserCircle,
  UserSquare,
  Users2,
  LogIn,
  LogOut,
  Sun,
  Moon,
  CloudRain,
  Snowflake,
  Droplet,
  Droplets,
  Globe,
  Compass,
  Navigation,
  Route,
  Building,
  Home,
  Store,
  Library,
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  PieChart,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Package,
  Link as LucideLink,
  Link2,
  Zap,
  MessageSquare,
  AlertCircle,
  Megaphone,
  Sparkles,
  Receipt,
  TrendingUp,
  Building2,
  BarChart3,
  BarChart2,
  BarChart,
  CloudSun,
  Wind,
  RefreshCw,
  Cpu,
  BookOpen,
  UserPlus,
  UserCheck,
  Umbrella,
  RotateCcw,
  CalendarPlus,
  CalendarCheck,
  Award,
  Briefcase,
  Calculator,
  Target,
  ArrowUpCircle,
  ArrowDownCircle,
  ShoppingBag,
  Code,
  History,
  Move,
  Brain,
  FileEdit,
  Activity,
  Lightbulb,
  HeartPulse,
  Book,
  Wrench,
  ArrowRightCircle,
  ExternalLink,
  UserCog,
  Cog,
  LayoutGrid,
  Grid2X2,
  List,
  LayoutList
} from 'lucide-react';

/** Icon pixel sizes */
export const ICON_SIZES = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 24,
  XXXL: 32,
  HUGE: 48
};

/** Icon color tokens */
export const ICON_COLORS = {
  PRIMARY: {
    background: 'var(--mg-v2-primary)',
    color: 'var(--color-white)'
  },
  SECONDARY: {
    background: 'var(--mg-v2-secondary)',
    color: 'var(--color-white)'
  },
  SUCCESS: {
    background: 'var(--mg-v2-status-success)',
    color: 'var(--color-white)'
  },
  WARNING: {
    background: 'var(--mg-v2-status-warning)',
    color: 'var(--color-white)'
  },
  ERROR: {
    background: 'var(--mg-v2-status-error)',
    color: 'var(--color-white)'
  },
  INFO: {
    background: 'var(--mg-v2-status-info)',
    color: 'var(--color-white)'
  },
  MUTED: {
    background: 'var(--mg-v2-secondary-light)',
    color: 'var(--mg-v2-secondary-dark)'
  },
  TRANSPARENT: {
    background: 'transparent',
    color: 'var(--mg-v2-primary)'
  }
};

/** Role-themed icon colors */
export const ICON_COLORS_BY_ROLE = {
  CLIENT: {
    PRIMARY: {
      background: 'var(--client-primary)',
      color: 'var(--color-white)'
    },
    SECONDARY: {
      background: 'var(--client-secondary)',
      color: 'var(--client-text)'
    }
  },
  CONSULTANT: {
    PRIMARY: {
      background: 'var(--consultant-primary)',
      color: 'var(--color-white)'
    },
    SECONDARY: {
      background: 'var(--consultant-secondary)',
      color: 'var(--consultant-text)'
    }
  },
  ADMIN: {
    PRIMARY: {
      background: 'var(--admin-primary)',
      color: 'var(--color-white)'
    },
    SECONDARY: {
      background: 'var(--admin-secondary)',
      color: 'var(--admin-text)'
    }
  }
};

/** Recommended icon sizes by context */
export const ICON_USAGE = {
  BUTTON: ICON_SIZES.SM,
  SECTION_TITLE: ICON_SIZES.LG,
  CARD_HEADER: ICON_SIZES.MD,
  NAVIGATION: ICON_SIZES.MD,
  STATUS: ICON_SIZES.SM,
  AVATAR: ICON_SIZES.XXL,
  HERO: ICON_SIZES.HUGE
};

/** Named icon map (keys match Icon name prop) */
export const ICONS = {
  X,
  CHECK: Check,
  PLUS: Plus,
  MINUS: Minus,
  EDIT: Edit,
  TRASH: Trash2,
  SAVE: Save,
  SEARCH: Search,

  EYE: Eye,
  EYE_OFF: EyeOff,
  LOCK: Lock,
  UNLOCK: Unlock,
  KEY: Key,
  SHIELD: Shield,
  SHIELD_CHECK: ShieldCheck,
  SHIELD_ALERT: ShieldAlert,

  ALERT_TRIANGLE: AlertTriangle,
  INFO: Info,
  CHECK_CIRCLE: CheckCircle,
  /** Lucide/레거시 명명 호환 (CHECK_CIRCLE 동일) */
  CHECK_CIRCLE_2: CheckCircle,
  X_CIRCLE: XCircle,
  HELP_CIRCLE: HelpCircle,

  PLAY: Play,
  PAUSE: Pause,
  STOP: Square,
  VOLUME: Volume2,
  CAMERA: Camera,
  MIC: Mic,
  HEADPHONES: Headphones,
  SPEAKER: Speaker,

  MONITOR: Monitor,
  LAPTOP: Laptop,
  TABLET: Tablet,
  SMARTPHONE: Smartphone,
  WATCH: Watch,
  MOUSE: Mouse,
  KEYBOARD: Keyboard,
  PRINTER: Printer,

  WIFI: Wifi,
  BLUETOOTH: Bluetooth,
  ROUTER: Router,
  SERVER: Server,
  DATABASE: Database,
  CLOUD: Cloud,
  HARD_DRIVE: HardDrive,

  ARROW_RIGHT: ArrowRight,
  CHEVRON_RIGHT: ChevronRight,
  CHEVRON_DOWN: ChevronDown,
  CHEVRON_UP: ChevronUp,
  MENU: Menu,
  MORE_HORIZONTAL: MoreHorizontal,

  SMILE: Smile,
  FROWN: Frown,
  HEART: Heart,
  STAR: Star,
  THUMBS_UP: ThumbsUp,
  THUMBS_DOWN: ThumbsDown,

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
  FILE_TEXT: FileText,
  UMBRELLA: Umbrella,
  IMAGE: Image,
  MAP: Map,
  VIDEO: Video,

  USER: User,
  USERS: Users,
  USER_CIRCLE: UserCircle,
  USER_SQUARE: UserSquare,
  USERS_2: Users2,
  LOG_IN: LogIn,
  LOG_OUT: LogOut,

  SUN: Sun,
  MOON: Moon,
  CLOUD_RAIN: CloudRain,
  SNOWFLAKE: Snowflake,
  DROPLET: Droplet,
  DROPLETS: Droplets,

  GLOBE: Globe,
  COMPASS: Compass,
  NAVIGATION: Navigation,
  ROUTE: Route,
  BUILDING: Building,
  HOME: Home,
  STORE: Store,
  LIBRARY: Library,

  LAYOUT_DASHBOARD: LayoutDashboard,
  CALENDAR_DAYS: CalendarDays,
  CLIPBOARD_LIST: ClipboardList,
  PIE_CHART: PieChart,
  SHOPPING_CART: ShoppingCart,
  CREDIT_CARD: CreditCard,
  DOLLAR_SIGN: DollarSign,
  PACKAGE: Package,
  LINK: LucideLink,
  LINK2: Link2,
  /** Lucide 원명 Link2 호환 */
  LINK_2: Link2,
  ZAP: Zap,
  MESSAGE_SQUARE: MessageSquare,
  ALERT_CIRCLE: AlertCircle,
  MEGAPHONE: Megaphone,
  SPARKLES: Sparkles,
  RECEIPT: Receipt,
  TRENDING_UP: TrendingUp,
  BUILDING_2: Building2,
  BAR_CHART_3: BarChart3,
  BAR_CHART_2: BarChart2,
  BAR_CHART: BarChart,
  CLOUD_SUN: CloudSun,
  WIND: Wind,
  REFRESH_CW: RefreshCw,
  CPU: Cpu,
  BOOK_OPEN: BookOpen,
  USER_PLUS: UserPlus,
  USER_CHECK: UserCheck,
  ROTATE_CCW: RotateCcw,
  CALENDAR_PLUS: CalendarPlus,
  CALENDAR_CHECK: CalendarCheck,
  AWARD: Award,
  BRIEFCASE: Briefcase,
  CALCULATOR: Calculator,
  TARGET: Target,
  ARROW_UP_CIRCLE: ArrowUpCircle,
  ARROW_DOWN_CIRCLE: ArrowDownCircle,
  SHOPPING_BAG: ShoppingBag,
  CODE: Code,
  HISTORY: History,
  MOVE: Move,
  BRAIN: Brain,
  FILE_EDIT: FileEdit,
  ACTIVITY: Activity,
  LIGHTBULB: Lightbulb,
  HEART_PULSE: HeartPulse,
  BOOK: Book,
  WRENCH: Wrench,
  ARROW_RIGHT_CIRCLE: ArrowRightCircle,
  EXTERNAL_LINK: ExternalLink,
  USER_COG: UserCog,
  COG: Cog,

  /** View mode pills (ViewModeToggle, mapping list, etc.) */
  LAYOUT_GRID: LayoutGrid,
  GRID_2X2: Grid2X2,
  LIST: List,
  LAYOUT_LIST: LayoutList
};

/** Resolve icon component by registry key */
export const getIcon = (iconName) => {
  return ICONS[iconName] || ICONS.HELP_CIRCLE;
};

export const getIconSize = (sizeName) => {
  return ICON_SIZES[sizeName] || ICON_SIZES.MD;
};

export const getIconColor = (colorName, role = null) => {
  if (role && ICON_COLORS_BY_ROLE[role]) {
    return ICON_COLORS_BY_ROLE[role][colorName] || ICON_COLORS_BY_ROLE[role].PRIMARY;
  }
  return ICON_COLORS[colorName] || ICON_COLORS.PRIMARY;
};

export default ICONS;
