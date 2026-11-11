import React, { useRef } from 'react';
import { Alert, Linking, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, sizes, spacing, typography } from '@shared/config/theme';
import AppButton from '@shared/components/AppButton';

const PERMISSION_MESSAGES = {
  camera: 'Please allow camera access in your device settings to record a video.',
  library: 'Please allow photo library access in your device settings to choose a video.',
};

/**
 * Asks for the permission of `source` ('camera' | 'library') then opens it to pick a video.
 * @returns {Promise<ImagePicker.ImagePickerAsset | null>} The picked asset, null if canceled/denied.
 */
export const pickVideoAsset = async (source) => {
  const { granted } =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!granted) {
    Alert.alert('Permission required', PERMISSION_MESSAGES[source], [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ]);
    return null;
  }
  const options = { mediaTypes: ['videos'] };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  return !result.canceled && result.assets?.length > 0 ? result.assets[0] : null;
};

/** Camera / gallery choice. `onSelect(source)` runs once the modal is gone. */
const MediaSourceModal = ({
  visible,
  title,
  cameraLabel,
  libraryLabel = 'Choose from Gallery',
  onSelect,
  onClose,
}) => {
  const pendingSourceRef = useRef(null);

  // iOS cannot present the picker while this modal is still animating out, so the launch is
  // deferred to the modal's onDismiss there.
  const launchPendingSource = () => {
    const source = pendingSourceRef.current;
    pendingSourceRef.current = null;
    if (source) onSelect(source);
  };

  const choose = (source) => {
    pendingSourceRef.current = source;
    onClose();
    if (Platform.OS !== 'ios') launchPendingSource();
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      onDismiss={launchPendingSource}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <AppButton fullWidth icon="camera" onPress={() => choose('camera')}>
            {cameraLabel}
          </AppButton>
          <AppButton fullWidth icon="image-multiple" onPress={() => choose('library')}>
            {libraryLabel}
          </AppButton>
          <AppButton fullWidth variant="secondary" onPress={onClose}>
            Cancel
          </AppButton>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
    backgroundColor: colors.overlay,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    gap: spacing.s,
    padding: spacing.l,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.s,
  },
});

export default MediaSourceModal;
