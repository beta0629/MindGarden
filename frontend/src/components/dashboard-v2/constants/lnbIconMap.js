/**
 * LNB 아이콘 매핑 (DB icon 문자열 → lucide-react 컴포넌트)
 * 스펙: docs/design-system/LNB_MENU_STRUCTURE_AND_PERMISSION_SPEC.md §3
 *
 * @author MindGarden
 * @since 2026-02-25
 */

import {
  LayoutDashboard,
  Link,
  Settings,
  Users,
  FileText,
  Calendar,
  MessageCircle,
  CreditCard,
  ShoppingCart,
  DollarSign,
  PieChart,
  Receipt,
  Building2,
  BarChart3
} from 'lucide-react';

const LNB_ICON_MAP = {
  LayoutDashboard,
  Link,
  Settings,
  Users,
  FileText,
  Calendar,
  MessageCircle,
  CreditCard,
  ShoppingCart,
  DollarSign,
  PieChart,
  Receipt,
  Building2,
  BarChart3,
  'gear-fill': Settings,
  speedometer2: LayoutDashboard,
  'list-ul': FileText,
  'people-fill': Users,
  'cart-check': ShoppingCart,
  'graph-up': DollarSign,
  'piggy-bank': PieChart
};

/**
 * @param {string} iconKey DB menus.icon 값
 * @returns {import('react').ComponentType} Lucide 컴포넌트 (없으면 FileText)
 */
export function getLnbIcon(iconKey) {
  if (!iconKey) return FileText;
  return LNB_ICON_MAP[iconKey] || FileText;
}

export default LNB_ICON_MAP;
