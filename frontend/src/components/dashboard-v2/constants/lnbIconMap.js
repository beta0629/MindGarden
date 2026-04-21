/**
 * LNB icon mapping (DB menus.icon string -> Icon registry key)
 * Spec: docs/design-system/LNB_MENU_STRUCTURE_AND_PERMISSION_SPEC.md
 *
 * @author Core Solution
 * @since 2026-02-25
 */

import { ICONS } from '../../../constants/icons';

const DEFAULT_ICON_KEY = 'FILE_TEXT';

const LNB_ICON_MAP = {
  LayoutDashboard: 'LAYOUT_DASHBOARD',
  Image: 'IMAGE',
  Link: 'LINK',
  Settings: 'SETTINGS',
  Users: 'USERS',
  FileText: 'FILE_TEXT',
  Tag: 'TAG',
  Calendar: 'CALENDAR',
  MessageCircle: 'MESSAGE_CIRCLE',
  CreditCard: 'CREDIT_CARD',
  ShoppingCart: 'SHOPPING_CART',
  DollarSign: 'DOLLAR_SIGN',
  PieChart: 'PIE_CHART',
  Receipt: 'RECEIPT',
  Building2: 'BUILDING_2',
  BarChart3: 'BAR_CHART_3',
  'gear-fill': 'SETTINGS',
  speedometer2: 'LAYOUT_DASHBOARD',
  'list-ul': 'FILE_TEXT',
  'people-fill': 'USERS',
  'cart-check': 'SHOPPING_CART',
  'graph-up': 'DOLLAR_SIGN',
  'piggy-bank': 'PIE_CHART'
};

/**
 * @param {string} iconKey DB menus.icon value
 * @returns {string} ICONS registry key
 */
export function getLnbIcon(iconKey) {
  if (!iconKey) {
    return DEFAULT_ICON_KEY;
  }
  const mapped = LNB_ICON_MAP[iconKey];
  if (mapped && ICONS[mapped]) {
    return mapped;
  }
  if (ICONS[iconKey]) {
    return iconKey;
  }
  return DEFAULT_ICON_KEY;
}

export default LNB_ICON_MAP;
