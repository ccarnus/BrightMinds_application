import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, Image, Dimensions } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { colors, sizes, spacing } from '@shared/config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@shared/config/APIConfig';
import { Button } from 'react-native-paper'; 

const { width } = Dimensions.get('window');

const ReadyScreen = ({ navigation }) => {
  const [showButton, setShowButton] = useState(false);
  const [numQuestions, setNumQuestions] = useState(0);
  const [userId, setUserId] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const opacityValue = useRef(new Animated.Value(0)).current;
  const Ready = require('@assets/Track_icons/ready.png');

  useEffect(() => {
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        setUserId(storedUserId);
      } catch (error) {
        console.error('Failed to fetch user ID from storage:', error);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      getCastList();
    }
  }, [userId]);

  useEffect(() => {
    if (showButton) {
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();
    }
  }, [showButton]);

  const getCastList = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user/${userId}`);
      const evaluationList = response.data.evaluation_list.filter(item => item.watched && !item.answered);
      const evaluationsData = evaluationList.map(item => ({
        contentid: item.contentid,
        type: item.type
      }));
      setEvaluations(evaluationsData);
      setNumQuestions(evaluationsData.length);
    } catch (error) {
      console.error('Error fetching evaluation list:', error);
    } finally {
      setIsLoading(false);
      setShowButton(true);
    }
  };

  const handleReadyButtonPress = () => {
    if (evaluations.length > 0) {
      navigation.navigate('Evaluation', { evaluations });
    } else {
      navigation.goBack();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You have</Text>
      <Text style={styles.numQuestions}>{numQuestions}</Text>
      <Text style={styles.title}>{numQuestions === 1 ? 'Question' : 'Questions'}</Text>
      <Image source={Ready} style={styles.infoImage2} />
      <View style={styles.buttonContainer}>
        <Animated.View style={[styles.readyButton, { opacity: opacityValue }]}>
          <Button
            mode="contained"
            onPress={handleReadyButtonPress}
            buttonColor={colors.darkGreen}
            contentStyle={{ flexDirection: 'row-reverse'}}
            icon={require('@assets/Track_icons/go.png')}
            labelStyle={{
              fontSize: sizes.h2,
              fontFamily: 'Montserrat',
              textAlign: 'center',
              paddingTop: spacing.s,
              paddingHorizontal: spacing.m
            }}
            style={{
              marginLeft: spacing.m,
              marginRight: spacing.m,
              marginBottom: spacing.s,
              marginTop: spacing.l,
              borderRadius: sizes.buttonRadius,
            }}
          >
            {numQuestions > 0 ? "Let's GO!" : "Come Back Later"}
          </Button>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
    paddingTop: spacing.xl*4,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryBis,
  },
  title: {
    fontSize: sizes.title,
    color: colors.secondary,
    marginBottom: spacing.s,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  numQuestions: {
    fontSize: sizes.title*2,
    color: colors.secondary,
    fontFamily: 'MontserratBold',
    marginBottom: 5,
    textAlign: 'center',
  },
  questionsText: {
    fontSize: 20,
    color: colors.secondary,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    marginBottom: 80,
  },
  infoImage2: {
    width: width * 0.5,
    height: width * 0.5,
    marginTop: spacing.l,
    marginBottom: spacing.xl,
    resizeMode: 'contain',
  },
});

export default ReadyScreen;
