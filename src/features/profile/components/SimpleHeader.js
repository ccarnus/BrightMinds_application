import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, shadow, sizes, spacing } from '@shared/config/theme';

const SimpleHeader = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image
          source={require('@assets/Profile_icons/arrow_back_icon.png')}
          style={styles.backIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 60,
    alignItems: 'center',
    flexDirection: 'row',
    paddingLeft: 15,
    paddingTop: 40,
    backgroundColor: colors.darkblue,
  },
  backIcon: {
    width: 32,
    height: 32, 
  },
});

export default SimpleHeader;
