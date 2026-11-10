import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { TextInput, Portal, Modal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import { colors, contentWidth, fonts, sizes, spacing, typography } from '@shared/config/theme';
import { api } from '@shared/api/client';
import { clearUser, getUser, isGuestUser } from '@shared/utils/UserStorage';
import { resetToAuthChoice } from '@navigation/navigationHelpers';
import visibilityCategories from '@shared/data/visibilityCategories';
import Loader from '@shared/components/Loader';
import ErrorState from '@shared/components/ErrorState';
import AppButton from '@shared/components/AppButton';
import { BACK_BUTTON_SIZE } from '@shared/components/BackButton';

export const isNonEmpty = (value) => !!value && value.trim().length > 0;

// Guests (or a missing session) cannot publish; offer to sign in instead of letting the API reject it.
export const ensureCanPost = (userId, navigation) => {
  if (userId && !isGuestUser(userId)) return true;
  Alert.alert('Sign in required', 'Please sign in to publish content.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Sign in',
      onPress: async () => {
        await clearUser();
        resetToAuthChoice(navigation);
      },
    },
  ]);
  return false;
};

export const usePostAuthor = (defaultUniversity) => {
  const [author, setAuthor] = useState({ userId: null, university: defaultUniversity });

  useEffect(() => {
    let active = true;
    getUser().then(({ userId, userUniversity }) => {
      if (active) {
        setAuthor({ userId: userId || null, university: userUniversity || defaultUniversity });
      }
    });
    return () => {
      active = false;
    };
  }, [defaultUniversity]);

  return author;
};

export const useDepartmentTopics = (department) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setTopics([]);
    setError(null);
    if (!department) return undefined;

    let active = true;
    setLoading(true);
    api
      .get(`/topic/department/${encodeURIComponent(department)}`)
      .then(({ data }) => {
        if (active) setTopics(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Error fetching topics:', err);
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [department, reloadKey]);

  return { topics, loading, error, reload: () => setReloadKey((key) => key + 1) };
};

export const SelectorField = ({ label, onPress, disabled }) => (
  <TouchableOpacity
    style={styles.selectorContainer}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
  >
    <Text style={styles.selectorText}>{label}</Text>
    <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
  </TouchableOpacity>
);

// One row of a picker modal; the current value is highlighted in the accent color.
const OptionRow = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.optionRow, selected && styles.optionRowSelected]}
    onPress={onPress}
    accessibilityRole="button"
  >
    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    {selected && <Ionicons name="checkmark" size={20} color={colors.accent} />}
  </TouchableOpacity>
);

const OptionSeparator = () => <View style={styles.separator} />;

export const OptionsModal = ({ visible, onDismiss, title, options, getKey, getLabel, selectedKey, onSelect }) => (
  <Portal>
    <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
      {!!title && <Text style={styles.modalTitle}>{title}</Text>}
      <FlatList
        data={options}
        style={styles.modalList}
        keyExtractor={getKey}
        ItemSeparatorComponent={OptionSeparator}
        renderItem={({ item }) => (
          <OptionRow
            label={getLabel(item)}
            selected={!!selectedKey && getKey(item) === selectedKey}
            onPress={() => onSelect(item)}
          />
        )}
      />
    </Modal>
  </Portal>
);

export const TopicPickerModal = ({
  visible,
  onDismiss,
  title,
  topics,
  loading,
  error,
  onRetry,
  selected,
  onSelect,
}) => {
  const [isManualEntry, setManualEntry] = useState(false);
  const [manualTopic, setManualTopic] = useState('');

  useEffect(() => {
    if (!visible) {
      setManualEntry(false);
      setManualTopic('');
    }
  }, [visible]);

  const saveManualTopic = () => {
    if (isNonEmpty(manualTopic)) {
      onSelect(manualTopic.trim());
    }
    setManualEntry(false);
    setManualTopic('');
  };

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.modalLoader}>
          <Loader fullScreen={false} size={100} />
        </View>
      );
    }
    return (
      <>
        {error ? (
          <ErrorState
            compact
            error={error}
            onRetry={onRetry}
            fallbackMessage="We couldn't load the topics. You can still enter a custom topic."
            style={styles.stateMessage}
          />
        ) : (
          <FlatList
            data={topics}
            style={styles.modalList}
            keyExtractor={(item) => item._id || item.name}
            ItemSeparatorComponent={OptionSeparator}
            renderItem={({ item }) => (
              <OptionRow
                label={item.name}
                selected={!!selected && item.name === selected}
                onPress={() => onSelect(item.name)}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No topics yet for this department.</Text>
            }
          />
        )}
        {isManualEntry ? (
          <View style={styles.manualEntry}>
            <TextInput
              label="Custom Topic"
              value={manualTopic}
              onChangeText={setManualTopic}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveManualTopic}
            />
            <AppButton size="medium" fullWidth onPress={saveManualTopic}>
              Save Topic
            </AppButton>
          </View>
        ) : (
          <AppButton
            variant="link"
            size="medium"
            icon="pencil-outline"
            onPress={() => setManualEntry(true)}
            style={styles.manualTopicButton}
          >
            Enter Custom Topic
          </AppButton>
        )}
      </>
    );
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        {!!title && <Text style={styles.modalTitle}>{title}</Text>}
        {renderBody()}
      </Modal>
    </Portal>
  );
};

const THUMB_TOUCH_SIZE = { width: 48, height: 48 };

export const VisibilitySlider = ({ value, onChange }) => (
  <View style={styles.visibility}>
    <Text style={styles.visibilityLabel}>{visibilityCategories[value - 1]?.label}</Text>
    <Slider
      value={value}
      // The slider reports an array of values (one per thumb).
      onValueChange={(next) => onChange(parseInt(Array.isArray(next) ? next[0] : next, 10))}
      minimumValue={1}
      maximumValue={visibilityCategories.length}
      step={1}
      minimumTrackTintColor={colors.action}
      maximumTrackTintColor={colors.lightGray}
      thumbTouchSize={THUMB_TOUCH_SIZE}
      containerStyle={styles.sliderContainer}
      trackStyle={styles.sliderTrack}
      thumbStyle={styles.sliderThumb}
    />
  </View>
);

export const UploadingOverlay = ({ visible, message }) => {
  if (!visible) return null;
  return (
    <View style={styles.loadingOverlay} accessibilityLiveRegion="polite">
      <Loader fullScreen={false} size={200} />
      {!!message && <Text style={styles.loadingText}>{message}</Text>}
    </View>
  );
};

export const postFormStyles = StyleSheet.create({
  // Header row: back button on the left, title centered (padded so it never runs under the button).
  header: {
    minHeight: BACK_BUTTON_SIZE,
    justifyContent: 'center',
    paddingHorizontal: spacing.s + BACK_BUTTON_SIZE + spacing.s,
    marginBottom: spacing.l,
  },
  headerBackButton: {
    position: 'absolute',
    left: spacing.s,
    top: 0,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
  },
  form: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
  },
  input: {
    marginBottom: spacing.m,
    backgroundColor: colors.surface,
  },
  inputOutline: {
    borderRadius: sizes.radius,
  },
  postButton: {
    marginTop: spacing.l,
  },
});

const styles = StyleSheet.create({
  input: postFormStyles.input,
  inputOutline: postFormStyles.inputOutline,
  // Same height and outline as the outlined Paper TextInputs above it.
  selectorContainer: {
    minHeight: 56,
    marginBottom: spacing.m,
    paddingHorizontal: 16,
    paddingVertical: spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
  },
  selectorText: {
    ...typography.body,
    flex: 1,
  },
  modalContainer: {
    width: '88%',
    maxWidth: 448,
    maxHeight: '80%',
    alignSelf: 'center',
    padding: spacing.m,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  modalList: {
    flexGrow: 0,
    flexShrink: 1,
  },
  modalLoader: {
    alignItems: 'center',
    paddingVertical: spacing.m,
  },
  optionRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.s,
    borderRadius: spacing.s,
  },
  optionRowSelected: {
    backgroundColor: colors.accentSoft,
  },
  optionText: {
    ...typography.body,
    flex: 1,
  },
  optionTextSelected: {
    fontFamily: fonts.bold,
    color: colors.accent,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  manualEntry: {
    paddingTop: spacing.m,
  },
  manualTopicButton: {
    alignSelf: 'center',
    marginTop: spacing.s,
  },
  stateMessage: {
    flex: 0,
  },
  emptyText: {
    ...typography.bodySmall,
    textAlign: 'center',
    paddingVertical: spacing.m,
  },
  visibility: {
    marginTop: spacing.s,
  },
  visibilityLabel: {
    ...typography.h3,
    color: colors.accent,
    textAlign: 'center',
  },
  sliderContainer: {
    width: '100%',
    marginTop: spacing.s,
    marginBottom: spacing.m,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  sliderThumb: {
    height: 22,
    width: 22,
    borderRadius: 11,
    backgroundColor: colors.action,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 10,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.s,
    color: colors.textOnColor,
    textAlign: 'center',
    paddingHorizontal: spacing.l,
  },
});
