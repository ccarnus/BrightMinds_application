import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StateMessage from '@shared/components/StateMessage';
import { colors } from '@shared/config/theme';

const errorIllustration = require('@assets/Cast_screen_icons/server_error.png');

const CrashScreen = ({ onRestart }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StateMessage
        image={errorIllustration}
        title="Something went wrong"
        message="An unexpected error occurred. Restart to continue using BrightMinds."
        actionLabel="Restart"
        onAction={onRestart}
      />
    </View>
  );
};

/**
 * Last line of defence against render crashes: shows a recovery screen instead of a blank app.
 * "Restart" remounts the navigation, which resolves the initial route again.
 */
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info?.componentStack);
  }

  restart = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <CrashScreen onRestart={this.restart} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
});

export default ErrorBoundary;
