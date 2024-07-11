import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, ScrollView } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, sizes, spacing } from './theme';
import { VictoryPie } from 'victory-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TrackScreen = () => {
  const [trackingData, setTrackingData] = useState({ objective: '', progress: 0 });
  const [history, setHistory] = useState([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(null);
  const [castCount, setCastCount] = useState(0);
  const [articleCount, setArticleCount] = useState(0);
  const navigation = useNavigation();
  const BrightMindsMascot = require('../assets/Track_icons/BrightMindsMascot.png');

  const handleReadyScreenPress = () => {
    navigation.navigate('Ready');
  };

  const handleNavigateToPublications = (type) => {
    if (type === 'cast') {
      navigation.navigate('CastPublicationsScreen');
    } else if (type === 'article') {
      navigation.navigate('ArticlePublicationsScreen');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const getUserRole = async () => {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedUserRole = await AsyncStorage.getItem('userRole');
        setUserId(storedUserId);
        setUserRole(storedUserRole);
      };
      getUserRole();
    }, [])
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://3.17.219.54/user/${userId}/tracking`);
        const data = await response.json();
        if (data.tracking) {
          setTrackingData({
            objective: data.tracking.objective,
            progress: data.tracking.progress / 100,
          });
          if (data.tracking.history) {
            setHistory(data.tracking.history.map(history => ({ x: history.category, y: history.count })));
          }
        }
      } catch (error) {
        console.error('Error fetching tracking data:', error);
      }
    };

    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://3.17.219.54/user/${userId}`);
        const data = await response.json();
        if (data.evaluation_list) {
          const answeredEvaluations = data.evaluation_list.filter(evaluation => evaluation.answered).length;
          setAnsweredCount(answeredEvaluations);
        }
        setCastCount(data.castPublications.length);
        setArticleCount(data.articlePublications.length);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (userId) {
      fetchData();
      fetchUserData();
    }
  }, [userId]);

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[colors.lightblue, colors.darkblue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.infoContainer}
      >
        <Text style={styles.infoText}>Understand the research shaping tomorrow's world</Text>
        <View style={styles.infoBottomContainer}>
          <View style={styles.infoBottomContainerLeft}>
            <Text style={styles.questionsansweredNumber}>{answeredCount}</Text>
            <Text style={styles.questionsansweredText}>Things learned</Text>
          </View>
          <View style={styles.infoBottomContainerRight}>
            <Image source={BrightMindsMascot} style={styles.infoImage}/>
          </View>
        </View>
      </LinearGradient>
      {(userRole === 'Professor' || userRole === 'Researcher' || userRole === 'PhD Student') && (
        <LinearGradient
          colors={['#3CB371', '#2E8B57']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.greenSection}
        >
          <Text style={styles.greenSectionTitle}>Publications</Text>
          <View style={styles.greenSectionContent}>
            <TouchableOpacity style={styles.greenSectionColumn} onPress={() => handleNavigateToPublications('article')}>
              <Image source={require('../assets/Cast_screen_icons/article_logo.png')} style={styles.greenSectionIcon} />
              <Text style={styles.greenSectionText}>{articleCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.greenSectionColumn} onPress={() => handleNavigateToPublications('cast')}>
              <Image source={require('../assets/Cast_screen_icons/cast_logo.png')} style={styles.greenSectionIcon} />
              <Text style={styles.greenSectionText}>{castCount}</Text>
            </TouchableOpacity>
            <View style={styles.greenSectionColumn}>
              <Image source={require('../assets/Cast_screen_icons/podcast_logo.png')} style={styles.greenSectionIcon} />
              <Text style={styles.greenSectionText}>0</Text>
            </View>
          </View>
        </LinearGradient>
      )}
      <View style={styles.ProgressContainer}>
        <Text style={styles.sectionTitle}>
          <Text style={styles.ProgressText}>{trackingData.objective}</Text> progress
        </Text>
        <ProgressBar progress={trackingData.progress} color={colors.darkblue} style={styles.progressBar} />
      </View>
      <View style={styles.ChartTitleContainer}>
        <Text style={styles.sectionTitle}>Learnings</Text>
        <View>
          {history.length > 0 ? (
            <VictoryPie 
              data={history}
              colorScale="qualitative"
              innerRadius={55}
              labelRadius={({ innerRadius }) => (Dimensions.get('window').width * 0.4 + innerRadius) / 2.5}
              style={{ labels: { fill: 'white', fontSize: 14, fontFamily: 'MontserratBold', justifyContent: 'center', alignItems: 'center'} }}
              labels={({ datum }) => datum.y > 0.1 ? `${datum.x}` : ''}
              width={Dimensions.get('window').width}
            />
          ) : (
            <Text style={styles.noDataText}>No learnings yet...</Text>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.buttonStartWeeklyEvaluation} onPress={handleReadyScreenPress}>
        <Text style={styles.buttonText}>Take Test</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: spacing.s,
    marginVertical: spacing.m,
    backgroundColor: colors.darkblue,
    marginLeft: spacing.m,
    marginRight: spacing.m,
    marginBottom: spacing.m,
    marginTop: spacing.m,
    borderRadius: sizes.radius,
    elevation: 5,
  },
  infoBottomContainer: {
    flexDirection: 'row',
  },
  infoBottomContainerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
  },
  infoBottomContainerRight: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
  },
  infoImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  questionsansweredNumber: {
    fontSize: sizes.title * 2,
    textAlign: 'center',
    fontFamily: 'MontserratBold',
    color: colors.primaryBis,
    marginTop: spacing.xs,
  },
  questionsansweredText: {
    fontSize: sizes.h4,
    textAlign: 'center',
    fontFamily: 'Montserrat',
    color: colors.primaryBis,
    marginTop: spacing.xs, 
  },
  infoText: {
    fontSize: sizes.h2,
    textAlign: 'left',
    fontFamily: 'Montserrat',
    color: colors.primaryBis,
    marginTop: spacing.xs,
    padding: 5,
  },
  greenSection: {
    padding: spacing.s,
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
    marginTop: spacing.m,
    borderRadius: sizes.radius,
    elevation: 5,
  },
  greenSectionContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  greenSectionColumn: {
    alignItems: 'center',
  },
  greenSectionIcon: {
    width: 48,
    height: 48,
    marginBottom: spacing.s,
  },
  greenSectionText: {
    fontSize: sizes.h2,
    color: colors.primaryBis,
    fontFamily: 'MontserratBold',
  },
  greenSectionTitle: {
    fontSize: sizes.h2,
    color: colors.secondary,
    marginBottom: spacing.m,
    fontFamily: 'MontserratBold',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: sizes.h2,
    color: colors.secondary,
    marginBottom: spacing.m,
    fontFamily: 'MontserratBold',
  },
  ProgressText: {
    fontFamily: 'MontserratBold',
    color: colors.secondary,
  },
  buttonStartWeeklyEvaluation: {
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.l,
    elevation: 5,
    width: '80%',
    marginLeft: '10%',
    padding: 15,
    borderRadius: sizes.radius,
    marginTop: spacing.m,
  },
  buttonText: {
    fontSize: sizes.h3,
    color: colors.primaryBis,
    fontFamily: 'MontserratBold',
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.lightGray,
    borderRadius: sizes.radius,
  },
  WatchTimeText: {
    fontSize: 16,
    fontFamily: 'MontserratBold',
    color: colors.secondary,
  },
  ProgressContainer: {
    backgroundColor: colors.primary,
    padding: spacing.m,
    marginVertical: spacing.m,
    marginLeft: spacing.m,
    marginRight: spacing.m,
    marginBottom: spacing.m,
    marginTop: spacing.m,
    borderRadius: sizes.radius,
    elevation: 5,
  },
  ChartTitleContainer: {
    backgroundColor: colors.primary,
    padding: spacing.s,
    marginVertical: spacing.m,
    marginLeft: spacing.m,
    marginRight: spacing.m,
    marginBottom: spacing.m,
    marginTop: spacing.m,
    borderRadius: sizes.radius,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    color: colors.secondary,
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 150,
  }
});

export default TrackScreen;
