import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { colors, sizes, spacing } from '../theme';
import InfoIcon from '../../assets/Virtual_lab_icons/info_icon.png';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const VirtualLab = ({ route }) => {
  const { labId, labDisplayName } = route.params;
  const [labData, setLabData] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    fetchLabData();
  }, []);

  const fetchLabData = async () => {
    try {
      const response = await fetch(`http://3.17.219.54/cast/department/${labId}`);
      const data = await response.json();

      const dataWithLogos = await Promise.all(data.map(async (cast) => {
        const universityResponse = await fetch(`http://3.17.219.54/university/by/name/${cast.university}`);
        const universityData = await universityResponse.json();
        return { ...cast, universityLogo: universityData.iconurl };
      }));

      setLabData(dataWithLogos);
    } catch (error) {
      console.error('Error fetching lab data:', error);
    }
  };

  const handleCastPress = (castId) => {
    navigation.navigate('VirtualLabVideoScreen', { selectedCastId: castId});
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.secon, colors.darkblue, colors.darkblue]}
        style={styles.topSection}>
        <View style={styles.titleOverlay}>
          <Text style={styles.labTitle}>{labDisplayName || 'Virtual Laboratory'}</Text>
        </View>
        <View style={styles.topRightButtons}>
          <TouchableOpacity>
            <Image source={InfoIcon} style={styles.topRightIcon} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <ScrollView style={styles.bottomSection}>
        {labData.length === 0 ? (
          <Text style={styles.noDataText}>No data available.</Text>
        ) : (
          labData.map((cast, index) => (
            <TouchableOpacity key={index} style={styles.castContainer} onPress={() => handleCastPress(cast._id)}>
              <Image source={{ uri: cast.castimageurl }} style={styles.castImage} />
              <View style={styles.castTextContainer}>
                <Text style={styles.castTitle}>{cast.title}</Text>
                <Image source={{ uri: cast.universityLogo }} style={styles.universityLogo} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    height: height / 4,
    backgroundColor: colors.secondary,
    elevation: 5,
  },
  titleOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  topRightButtons: {
    position: 'absolute',
    right: spacing.m,
    bottom: spacing.l,
    alignItems: 'center',
  },
  labTitle: {
    fontSize: sizes.title,
    color: colors.primary,
    textAlign: 'center',
    marginLeft: 10,
    marginRight: 10,
    fontFamily: 'Montserrat',
  },
  bottomSection: {
    backgroundColor: colors.primaryBis,
    paddingVertical: spacing.m,
    width: width,
    marginBottom: spacing.m,
  },
  castContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
    paddingHorizontal: spacing.m,
  },
  castTextContainer: {
    marginLeft: spacing.s,
    verticalAlign: 'top',
    justifyContent: 'center',
    flex: 1,
  },
  castTitle: {
    fontSize: sizes.h4,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  castImage: {
    width: 150,
    height: 100,
    resizeMode: 'cover',
  },
  noDataText: {
    fontSize: sizes.body,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.m,
  },
  topRightIcon: {
    width: 30,
    height: 30,
    marginVertical: spacing.s,
    tintColor: colors.primary,
  },
});

export default VirtualLab;
