import React from 'react';
import { StyleSheet } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { colors, fonts, sizes } from '@shared/config/theme';

const HEIGHT = 48;

/** The app's search input: flat white pill with a hairline border, same height everywhere. */
const SearchField = ({ style, inputStyle, ...props }) => (
  <Searchbar
    elevation={0}
    autoCorrect={false}
    iconColor={colors.textSecondary}
    placeholderTextColor={colors.textMuted}
    selectionColor={colors.accent}
    style={[styles.bar, style]}
    inputStyle={[styles.input, inputStyle]}
    {...props}
  />
);

const styles = StyleSheet.create({
  bar: {
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  input: {
    minHeight: 0,
    alignSelf: 'center',
    fontFamily: fonts.regular,
    fontSize: sizes.body,
    color: colors.text,
  },
});

export default SearchField;
