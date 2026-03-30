/**
 * 이모지 → Lucide 아이콘 이름 매핑 및 렌더 헬퍼
 * UNIFIED_LAYOUT_SPEC: UI에서 이모지 사용 금지, Lucide React 아이콘만 사용
 *
 * @author Core Solution
 * @since 2025-03-04
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';

/** 이모지 → Lucide 아이콘 이름 (스펙 매핑표 기준) */
export const EMOJI_TO_LUCIDE = {
  '📊': 'BarChart3',
  '📋': 'ClipboardList',
  '💬': 'MessageCircle',
  '🔔': 'Bell',
  '✅': 'Check',
  '❌': 'X',
  '⚠️': 'AlertTriangle',
  '❗': 'AlertCircle',
  '💰': 'DollarSign',
  '📅': 'Calendar',
  '⏰': 'Clock',
  '👤': 'User',
  '👥': 'Users',
  '⚙️': 'Settings',
  '📧': 'Mail',
  '🔒': 'Lock',
  '🔍': 'Search',
  '✏️': 'Pencil',
  '🗑️': 'Trash2',
  '📭': 'Inbox',
  '📄': 'FileText',
  '📁': 'Folder',
  '📦': 'Package',
  '💳': 'CreditCard',
  '🛒': 'ShoppingCart',
  '⚡': 'Zap',
  '💾': 'Save',
  '🤖': 'Bot',
  '💊': 'Pill',
  '🧠': 'Brain',
  '🏢': 'Building2',
  '👑': 'Crown',
  '🔄': 'RefreshCw',
  '⏳': 'Loader2',
  '❓': 'HelpCircle',
  '🟢': 'Circle',
  '🔴': 'Circle',
  '⏸️': 'Pause',
  '🔚': 'CircleDot',
  '🚫': 'Ban',
  '🎉': 'PartyPopper',
  '🏖️': 'Palmtree',
  '🔧': 'Wrench',
  '👻': 'Ghost',
  '⚪': 'Circle',
  '↩️': 'Reply',
  '💵': 'Banknote',
  '💛': 'CreditCard',
  '💚': 'CreditCard',
  '🔷': 'CreditCard',
  '🔵': 'CreditCard',
  '💱': 'CircleDollarSign',
  '🏦': 'Landmark',
  '📝': 'FileText',
  '📈': 'TrendingUp',
  '📢': 'Megaphone',
  '🖥️': 'Monitor',
  '💧': 'Droplet',
  '🔥': 'Flame',
  '🌐': 'Globe',
  '🪑': 'Armchair',
  '📚': 'BookOpen',
  '🏥': 'Building2',
  '🧽': 'Spray',
  '🏠': 'Home',
  '🏛️': 'Building2',
  '🏪': 'Store',
  '🚨': 'AlertTriangle',
  '📍': 'MapPin'
};

const DEFAULT_ICON = 'HelpCircle';

/** ESLint import/namespace 회피: computed 접근용 로컬 복사 */
// eslint-disable-next-line import/namespace -- Lucide 아이콘 이름으로 동적 접근을 위해 namespace 복사
const iconMap = { ...LucideIcons };

/**
 * Lucide 아이콘 이름 또는 이모지 문자열을 React 엘리먼트로 반환
 * @param {string} nameOrEmoji - Lucide 컴포넌트 이름(예: 'User') 또는 이모지(레거시)
 * @param {object} props - Lucide 아이콘에 전달할 props (size, className 등)
 * @returns {React.ReactElement}
 */
export function getLucideIcon(nameOrEmoji, props = {}) {
  const size = props.size ?? 16;
  const rest = { ...props };
  delete rest.size;

  let iconName = nameOrEmoji;
  if (typeof nameOrEmoji === 'string' && EMOJI_TO_LUCIDE[nameOrEmoji]) {
    iconName = EMOJI_TO_LUCIDE[nameOrEmoji];
  }
  if (!iconName || typeof iconName !== 'string') {
    const Icon = iconMap[DEFAULT_ICON];
    return Icon ? React.createElement(Icon, { size, ...rest }) : null;
  }
  const Icon = iconMap[iconName];
  return Icon ? React.createElement(Icon, { size, ...rest }) : React.createElement(iconMap[DEFAULT_ICON], { size, ...rest });
}

/**
 * Lucide 아이콘 컴포넌트 참조 반환 (직접 렌더 시 사용)
 * @param {string} nameOrEmoji - Lucide 이름 또는 이모지
 * @returns {React.ComponentType}
 */
export function getLucideIconComponent(nameOrEmoji) {
  let iconName = nameOrEmoji;
  if (typeof nameOrEmoji === 'string' && EMOJI_TO_LUCIDE[nameOrEmoji]) {
    iconName = EMOJI_TO_LUCIDE[nameOrEmoji];
  }
  return iconMap[iconName] || iconMap[DEFAULT_ICON];
}
