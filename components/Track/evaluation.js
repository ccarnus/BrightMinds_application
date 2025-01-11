import React, { useState, useEffect, useRef } from 'react';
import { Animated , View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import axios from 'axios';
import Gauge from './Gauge';
import { colors, sizes, spacing } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

let correctAnswerCount = 0;

const TakeTest = ({ route, navigation }) => {
  const { evaluations } = route.params;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [displayedQuestion, setDisplayedQuestion] = useState('');
  const [userId, setUserId] = useState(null);
  const typingIntervalRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserId();
    console.log(userId);
  }, []);
  
  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    const currentQuestion = questions[currentQuestionIndex]?.question;
    if (currentQuestion) {
      setDisplayedQuestion('');
      typeQuestion(currentQuestion);
    }
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [currentQuestionIndex, questions]);

  const typeQuestion = (questionText) => {
    let i = 0;
    typingIntervalRef.current = setInterval(() => {
      setDisplayedQuestion((prev) => prev + questionText.charAt(i));
      i++;
      if (i > questionText.length) clearInterval(typingIntervalRef.current);
    }, 50);
  };

  const removeContentFromEvaluationList = async (evaluation) => {
    try {
      await axios.post(`https://3.17.219.54/user/mark/content/as/answered/${userId}`, {
        contentId: evaluation.contentid,
      });
    } catch (error) {
      console.error(`Error marking content ${evaluation.contentid} as answered:`, error);
    }
  };
  
  const fetchQuestions = async () => {
    try {
      const questionsPromises = evaluations.map(item => {
        const url = item.type === 'article'
          ? `https://3.17.219.54/article/${item.contentid}`
          : `https://3.17.219.54/cast/${item.contentid}`;
        return axios.get(url);
      });
      const questionsResponses = await Promise.all(questionsPromises);
      const questionsData = questionsResponses.map(response => response.data.evaluation);
  
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };
  

  const animateCorrectAnswer = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.6,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const animateIncorrectAnswer = () => {
    Animated.sequence([
      // Shaking to the left and right
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAnswerSelection = async (selectedResponse) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswer = currentQuestion.correct;
    const isAnswerCorrect = selectedResponse === correctAnswer;

    setSelectedAnswer(selectedResponse);
    setIsCorrect(isAnswerCorrect);

    if (isAnswerCorrect) {
      animateCorrectAnswer();
      correctAnswerCount = correctAnswerCount + 1 ;
      removeContentFromEvaluationList(evaluations[currentQuestionIndex]);
    } else {
      animateIncorrectAnswer();
    }

    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        console.log(`correct answers count ${correctAnswerCount}`)
        navigation.navigate('Finish', {
          totalQuestions: questions.length,
          correctAnswers: correctAnswerCount,
        });
      }
    }, 1000);
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      <Gauge total={questions.length} current={currentQuestionIndex} />
      <View style={styles.questionContainer}>
      <Text
          style={styles.questionText}
          numberOfLines={5}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {displayedQuestion}
        </Text>
      </View>
      <ScrollView
        style={styles.answersContainer}
      >
        {currentQuestion?.responses.map((response, index) => (
          <Animated.View
          key={index}
          style={{
            transform: [
              { scale: selectedAnswer === response && isCorrect ? scaleAnim : 1 },
              { translateX: selectedAnswer === response && isCorrect === false ? shakeAnim : 0 }
            ],
          }}
        >
            <TouchableOpacity
              key={index}
              style={[
                styles.answerButton,
                {
                  backgroundColor:
                    selectedAnswer === response
                      ? isCorrect
                        ? '#4CAF50'
                        : '#F44336'
                      : '#FFFFFF',
                },
              ]}
              onPress={() => handleAnswerSelection(response)}
              disabled={selectedAnswer !== null}
            >
              <Text style={styles.answerButtonText}>{response}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryBis,
  },
  questionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop:spacing.s,
    marginBottom: spacing.s,
    marginLeft: spacing.s,
    marginRight: spacing.s,
    height: '30%',
  },
  questionText: {
    fontSize: sizes.h2,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    color: colors.secondary,
  },
  answersContainer: {
    width: '100%',
  },
  answerButton: {
    borderRadius: sizes.radius,
    marginLeft: spacing.m,
    marginRight: spacing.m,
    marginBottom: spacing.l,
    padding: 15,
    elevation: 5,
    textAlign: 'center',
    width: '250',
  },
  answerButtonText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    fontFamily: 'MontserratBold',
    textAlign: 'center',
  },
});

export default TakeTest;