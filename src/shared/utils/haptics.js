import * as Haptics from 'expo-haptics';

// Haptics are a bonus: unsupported devices or simulators must never break the flow.
const safely = (run) => () => {
  try {
    Promise.resolve(run()).catch(() => {});
  } catch {
    // Not available on this device.
  }
};

/** Tactile feedback for the quiz (selection, right/wrong answers, celebrations). */
const haptics = {
  tap: safely(() => Haptics.selectionAsync()),
  impact: safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  celebrate: safely(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }),
};

export default haptics;
