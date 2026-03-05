import React from 'react';
import {Image, TouchableOpacity} from 'react-native';
import icons from './icons';

const Icon = ({onPress, icon, style, size = 12}) => {
  const image = (
    <Image
      source={icons[icon]}
      style={[{width: size, height: size, resizeMode: 'contain'}, style]}
    />
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{image}</TouchableOpacity>;
  }
  return image;
};

export default Icon;