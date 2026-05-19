/**
 * ShopCategoryTabs — PLP 카테고리 탭 Molecule
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import {
  SHOP_CATEGORY_TABS,
  type ShopCatalogCategory,
} from '@/constants/clientShopConstants';

interface ShopCategoryTabsProps {
  activeKey: ShopCatalogCategory | string;
  onChange: (key: ShopCatalogCategory) => void;
}

export function ShopCategoryTabs({ activeKey, onChange }: ShopCategoryTabsProps) {
  const theme = useTheme();

  const handlePress = (key: ShopCatalogCategory) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onChange(key);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      {SHOP_CATEGORY_TABS.map((tab) => {
        const selected = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => handlePress(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              {
                borderBottomColor: selected ? theme.colors.primary : 'transparent',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color: selected ? theme.colors.primary : theme.colors.textSecondary,
                  fontFamily: selected ? theme.fontFamily.semibold : theme.fontFamily.medium,
                  fontSize: theme.fontSize.base,
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 4,
  },
  tab: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    justifyContent: 'center',
  },
  tabLabel: {
    lineHeight: 22,
  },
  spacer: {
    width: 8,
  },
});
