import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  contentWidth,
  fonts,
  scale,
  sizes,
  spacing,
  tints,
  typography,
} from '@shared/config/theme';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import ErrorState from '@shared/components/ErrorState';
import SearchField from '@shared/components/SearchField';
import PressableScale from '@shared/components/PressableScale';
import { SEARCH_CATEGORIES, SEARCH_META } from '@features/cast/utils/castSearch';

const BUBBLE = scale(38);
const MAX_STAGGERED_ROWS = 8;

const CategoryChips = ({ category, onChange }) => (
  <View style={styles.chips} accessibilityRole="radiogroup">
    {SEARCH_CATEGORIES.map((name) => {
      const selected = category === name;
      return (
        <PressableScale
          key={name}
          scaleTo={0.94}
          onPress={() => onChange(name)}
          style={[styles.chip, selected && styles.chipSelected]}
          accessibilityRole="radio"
          accessibilityState={{ selected }}
        >
          <Ionicons
            name={SEARCH_META[name].icon}
            size={scale(17)}
            color={selected ? colors.textOnColor : colors.textSecondary}
          />
          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{name}</Text>
        </PressableScale>
      );
    })}
  </View>
);

const ResultRow = ({ item, index, onSelect }) => (
  <Animated.View entering={FadeInDown.delay(Math.min(index, MAX_STAGGERED_ROWS) * 30).duration(260)}>
    <PressableScale
      scaleTo={0.985}
      onPress={() => onSelect(item)}
      style={styles.row}
      accessibilityRole="button"
    >
      <View style={styles.rowBubble}>
        <Ionicons name={SEARCH_META[item.category].icon} size={scale(18)} color={colors.accent} />
      </View>
      <Text style={styles.rowLabel} numberOfLines={2}>
        {item.label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </PressableScale>
  </Animated.View>
);

/**
 * Full-screen search: field, category chips and the results (or what to do instead). `search` is
 * the value of `useCastSearch`; `onSelect(result)` opens a result.
 */
const SearchPanel = ({ search, onClose, onSelect, bottomSpace }) => {
  const { query, setQuery, category, setCategory, results, loading, error, retry } = search;
  const text = query.trim();

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <Loader fullScreen={false} size={120} />
        </View>
      );
    }
    if (error) {
      return (
        <ErrorState
          compact
          error={error}
          onRetry={retry}
          fallbackMessage="Search failed. Please try again."
          style={styles.state}
        />
      );
    }
    if (results.length > 0) {
      return (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: bottomSpace }}
          renderItem={({ item, index }) => <ResultRow item={item} index={index} onSelect={onSelect} />}
        />
      );
    }
    if (text) {
      return (
        <StateMessage
          compact
          icon="search-outline"
          title="No results"
          message={`No ${category.toLowerCase()} matches "${text}".`}
          style={styles.state}
        />
      );
    }
    return (
      <Animated.View entering={FadeIn.duration(300)} style={styles.hint}>
        <View style={styles.hintBubble}>
          <Ionicons name={SEARCH_META[category].icon} size={scale(30)} color={colors.accent} />
        </View>
        <Text style={styles.hintText}>{SEARCH_META[category].hint}</Text>
      </Animated.View>
    );
  };

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      <View style={styles.header}>
        <SearchField
          placeholder={`Search ${category.toLowerCase()}s`}
          onChangeText={setQuery}
          value={query}
          style={styles.field}
          autoFocus
          returnKeyType="search"
        />
        <PressableScale
          scaleTo={0.92}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cancel search"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.cancel}>Cancel</Text>
        </PressableScale>
      </View>
      <CategoryChips category={category} onChange={setCategory} />
      <View style={styles.body}>{renderBody()}</View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    ...contentWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 4,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
  },
  field: { flex: 1 },
  cancel: { ...typography.bodySmall, fontFamily: fonts.bold, color: colors.accent },
  chips: {
    ...contentWidth,
    flexDirection: 'row',
    gap: spacing.s,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: spacing.s,
    borderRadius: sizes.buttonRadius,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { ...typography.bodySmall, color: colors.text },
  chipTextSelected: { fontFamily: fonts.bold, color: colors.textOnColor },
  body: { ...contentWidth, flex: 1, paddingHorizontal: spacing.m },
  center: { alignItems: 'center', paddingTop: spacing.l },
  state: { marginTop: spacing.l },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 4,
    paddingVertical: spacing.s + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowBubble: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tints.blue,
  },
  rowLabel: { ...typography.body, flex: 1 },
  hint: { alignItems: 'center', paddingTop: spacing.xl, paddingHorizontal: spacing.l },
  hintBubble: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tints.blue,
    marginBottom: spacing.m,
  },
  hintText: { ...typography.bodySmall, textAlign: 'center' },
});

export default SearchPanel;
