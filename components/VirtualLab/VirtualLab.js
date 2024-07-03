import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { colors, sizes, spacing } from '../theme';
import PolarStarIcon from '../../assets/Virtual_lab_icons/star_icon.png';
import InfoIcon from '../../assets/Virtual_lab_icons/info_icon.png';
import CompassIcon from '../../assets/Virtual_lab_icons/compass_icon.png';
import MainIcebergIcon from '../../assets/Virtual_lab_icons/main_iceberg_icon.png';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const VirtualLab = ({ route }) => {
  const { labId } = route.params;
  const [labData, setLabData] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    fetchLabData();
  }, []);

  const fetchLabData = async () => {
    try {
      const response = await fetch(`http://3.17.219.54/cast/department/${labId}`);
      const data = await response.json();

      // Fetch university logos
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
    navigation.navigate('CategoryScreen', { selectedCastId: castId, category: labId });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.lightblue, colors.darkblue]}
        style={styles.topSection}>
        <Image source={MainIcebergIcon} style={styles.mainIcebergIcon} />
        <View style={styles.titleOverlay}>
          <Image source={PolarStarIcon} style={styles.polarStarIcon} />
          <Text style={styles.labTitle}>{labId || 'Exploring the Iceberg'}</Text>
        </View>
        <View style={styles.topRightButtons}>
          <TouchableOpacity>
            <Image source={InfoIcon} style={styles.topRightIcon} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image source={CompassIcon} style={styles.topRightIcon} />
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
    height: height / 3,
    alignItems: 'center',
    backgroundColor: colors.secondary,
    elevation: 5,
  },
  mainIcebergIcon: {
    width: '80%',
    height: '100%',
    resizeMode: 'contain',
  },
  titleOverlay: {
    position: 'absolute',
    top: spacing.m,
    alignItems: 'center',
  },
  topRightButtons: {
    position: 'absolute',
    right: spacing.m,
    bottom: spacing.l,
    alignItems: 'center',
  },
  polarStarIcon: {
    width: 100,
    height: 100,
    position: 'absolute',
    top: 0,
  },
  labTitle: {
    fontSize: sizes.title,
    color: colors.darkblue,
    textAlign: 'center',
    marginTop: 60,
    marginLeft: 10,
    marginRight: 10,
    fontFamily: 'MontserratBold',
  },
  bottomSection: {
    backgroundColor: colors.primaryBis,
    height: (2 * height) / 3,
    paddingVertical: spacing.m,
    width: width,
  },
  castContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
    width: '90%',
    paddingHorizontal: spacing.m,
  },
  castTextContainer: {
    marginLeft: spacing.m,
    flex: 1,
  },
  castTitle: {
    fontSize: sizes.h3,
    color: colors.darkblue,
    fontFamily: 'MontserratBold',
  },
  castImage: {
    width: 80,
    height: 80,
    borderRadius: sizes.radius,
    resizeMode: 'cover',
  },
  universityLogo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginTop: spacing.xs,
  },
  noDataText: {
    fontSize: sizes.body,
    color: colors.darkblue,
    textAlign: 'center',
    marginTop: spacing.m,
  },
  topRightIcon: {
    width: 30,
    height: 30,
    marginVertical: spacing.s,
  },
});

export default VirtualLab;
