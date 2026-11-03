import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Button, TextInput, Portal, Modal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import { colors, sizes, spacing } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import { clearUser, getUser, isGuestUser } from '@shared/utils/UserStorage';
import { resetToAuthChoice } from '@navigation/navigationHelpers';
import visibilityCategories from '@shared/data/visibilityCategories';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';

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
        if (active) setError(getErrorMessage(err, 'Failed to load topics. Please try again later.'));
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
    <Ionicons name="chevron-down" size={18} color={colors.darkGray} />
  </TouchableOpacity>
);

export const OptionsModal = ({ visible, onDismiss, options, getKey, getLabel, onSelect }) => (
  <Portal>
    <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
      <FlatList
        data={options}
        style={styles.modalList}
        keyExtractor={getKey}
        renderItem={({ item }) => (
          <Button
            onPress={() => onSelect(item)}
            style={styles.modalItem}
            labelStyle={styles.modalItemLabel}
          >
            {getLabel(item)}
          </Button>
        )}
      />
    </Modal>
  </Portal>
);

export const TopicPickerModal = ({ visible, onDismiss, topics, loading, error, onRetry, onSelect }) => {
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
      return <Loader fullScreen={false} size={100} />;
    }
    return (
      <>
        {error ? (
          <StateMessage
            icon="cloud-offline-outline"
            title="Couldn't load topics"
            message={error}
            actionLabel="Try again"
            onAction={onRetry}
            style={styles.stateMessage}
          />
        ) : (
          <FlatList
            data={topics}
            style={styles.modalList}
            keyExtractor={(item) => item._id || item.name}
            renderItem={({ item }) => (
              <Button
                onPress={() => onSelect(item.name)}
                style={styles.modalItem}
                labelStyle={styles.modalItemLabel}
              >
                {item.name}
              </Button>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No topics yet for this department.</Text>
            }
          />
        )}
        {isManualEntry ? (
          <View>
            <TextInput
              label="Custom Topic"
              value={manualTopic}
              onChangeText={setManualTopic}
              mode="outlined"
              style={styles.input}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveManualTopic}
              activeOutlineColor={colors.darkGreen}
            />
            <Button
              onPress={saveManualTopic}
              style={styles.modalItem}
              labelStyle={styles.modalItemLabel}
            >
              Save Topic
            </Button>
          </View>
        ) : (
          <Button
            onPress={() => setManualEntry(true)}
            style={[styles.modalItem, styles.manualTopicButton]}
            labelStyle={styles.modalItemLabel}
          >
            Enter Custom Topic
          </Button>
        )}
      </>
    );
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        {renderBody()}
      </Modal>
    </Portal>
  );
};

export const VisibilitySlider = ({ value, onChange }) => (
  <>
    <Text style={styles.visibilityLabel}>{visibilityCategories[value - 1]?.label}</Text>
    <Slider
      value={value}
      // The slider reports an array of values (one per thumb).
      onValueChange={(next) => onChange(parseInt(Array.isArray(next) ? next[0] : next, 10))}
      minimumValue={1}
      maximumValue={visibilityCategories.length}
      step={1}
      containerStyle={styles.sliderContainer}
      trackStyle={styles.sliderTrack}
      thumbStyle={styles.sliderThumb}
    />
  </>
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

export const BackButton = ({ onPress, style }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.backButton, style]}
    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    accessibilityRole="button"
    accessibilityLabel="Go back"
  >
    <Ionicons name="chevron-back" size={28} color={colors.secondary} />
  </TouchableOpacity>
);

export const postFormStyles = StyleSheet.create({
  Maintitle: {
    fontSize: sizes.title,
    textAlign: 'center',
    marginBottom: spacing.l,
    marginTop: spacing.xl,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  input: {
    marginBottom: spacing.m,
    backgroundColor: 'transparent',
    fontFamily: 'Montserrat',
  },
  postButton: {
    marginLeft: spacing.m,
    marginRight: spacing.m,
    marginBottom: spacing.l,
    marginTop: spacing.l,
    paddingHorizontal: spacing.s,
  },
  postButtonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
  },
  // Aligns the back button with Maintitle inside a container padded by 20.
  backButton: {
    top: 20 + spacing.xl + spacing.xs,
  },
});

const styles = StyleSheet.create({
  input: postFormStyles.input,
  selectorContainer: {
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: sizes.radius,
    backgroundColor: 'white',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    flex: 1,
    fontFamily: 'Montserrat',
    color: colors.secondary,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    borderRadius: sizes.radius,
  },
  modalList: {
    flexGrow: 0,
    flexShrink: 1,
  },
  modalItem: {
    marginVertical: 2,
  },
  modalItemLabel: {
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  manualTopicButton: {
    marginTop: 10,
  },
  stateMessage: {
    flex: 0,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: 'Montserrat',
    color: colors.darkGray,
    paddingVertical: spacing.m,
  },
  visibilityLabel: {
    fontSize: sizes.h3,
    textAlign: 'center',
    marginTop: spacing.l,
    color: colors.darkblue,
    fontFamily: 'Montserrat',
  },
  sliderContainer: {
    width: '100%',
    marginTop: 8,
    marginBottom: 20,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: colors.lightGray,
  },
  sliderThumb: {
    height: 20,
    width: 20,
    backgroundColor: colors.darkGreen,
    borderRadius: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.s,
    color: colors.primary,
    fontFamily: 'Montserrat',
    fontSize: sizes.h3,
    textAlign: 'center',
    paddingHorizontal: spacing.l,
  },
  backButton: {
    position: 'absolute',
    left: spacing.m,
    zIndex: 10,
  },
});
