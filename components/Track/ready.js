import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { colors, sizes } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../APIConfig';

const ReadyScreen = ({ navigation }) => {
  const [showButton, setShowButton] = useState(false);
  const [numQuestions, setNumQuestions] = useState(0);
  const [userId, setUserId] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const opacityValue = useRef(new Animated.Value(0)).current;

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
      <View style={styles.buttonContainer}>
        <Animated.View style={[styles.readyButton, { opacity: opacityValue }]}>
          <TouchableOpacity onPress={handleReadyButtonPress}>
            <Text style={styles.readyButtonText}>
              {numQuestions > 0 ? "Let's GO!" : "Come Back Later"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
    paddingTop: 200,
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
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  numQuestions: {
    fontSize: 48,
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
  readyButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderColor: colors.secondary,
    backgroundColor: colors.secondary,
    borderRadius: sizes.radius,
    borderWidth: 2,
  },
  readyButtonText: {
    fontSize: 22,
    color: colors.primaryBis,
    fontFamily: 'Montserrat',
  },
});

export default ReadyScreen;
