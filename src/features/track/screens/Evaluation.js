import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInRight, FadeOut, ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentWidth, fonts, rewardColors, sizes, spacing, typography } from '@shared/config/theme';
import { api } from '@shared/api/client';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import haptics from '@shared/utils/haptics';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import ErrorState from '@shared/components/ErrorState';
import ConfirmDialog from '@shared/components/ConfirmDialog';
import ConfettiBurst from '@shared/components/ConfettiBurst';
import QuizTopBar from '@features/track/components/quiz/QuizTopBar';
import AnswerOption from '@features/track/components/quiz/AnswerOption';
import FeedbackPanel from '@features/track/components/quiz/FeedbackPanel';
import FloatingXp from '@features/track/components/quiz/FloatingXp';
import { praiseFor, xpForAnswer } from '@features/track/utils/rewards';
import { submitQuiz } from '@features/track/utils/quizApi';

const COMBO_TOAST_MS = 1300;

const isValidQuestion = (question) =>
  !!question &&
  typeof question.question === 'string' &&
  Array.isArray(question.responses) &&
  question.responses.length > 0;

// Combos worth a celebration: 3, 5, then every 5.
const isComboMilestone = (combo) => combo === 3 || (combo >= 5 && combo % 5 === 0);

const ComboToast = ({ combo }) => (
  <View pointerEvents="none" style={styles.toastLayer}>
    <Animated.View entering={ZoomIn.springify().damping(8)} exiting={FadeOut.duration(250)} style={styles.toast}>
      <MaterialCommunityIcons name="fire" size={40} color={rewardColors.streak} />
      <Text style={styles.toastTitle}>Combo x{combo}!</Text>
      <Text style={styles.toastText}>Bonus XP on every right answer</Text>
    </Animated.View>
  </View>
);

const TakeTest = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const evaluations = route.params?.evaluations || [];
  // Each entry pairs a question with the evaluation it belongs to, so answers stay attached to
  // the right content even when some content could not be loaded and was skipped.
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [praise, setPraise] = useState('');
  const [xpPop, setXpPop] = useState({ amount: 0, trigger: 0 });
  const [confetti, setConfetti] = useState(0);
  const [comboToast, setComboToast] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const userIdRef = useRef(null);
  const answersRef = useRef([]);
  // Refs (not state) so rapid double taps are rejected before the next render.
  const lockedRef = useRef(false);
  const handedOffRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Answers given before leaving mid-quiz still earn XP and count as answered.
      const userId = userIdRef.current;
      if (!handedOffRef.current && userId && !isGuestUser(userId) && answersRef.current.length > 0) {
        submitQuiz(userId, answersRef.current).catch((submitError) =>
          console.warn('Could not save the quiz answers:', submitError?.message)
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!comboToast) return undefined;
    const timer = setTimeout(() => setComboToast(null), COMBO_TOAST_MS);
    return () => clearTimeout(timer);
  }, [comboToast]);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [{ userId }, results] = await Promise.all([
        getUser(),
        Promise.all(
          evaluations.map((evaluation) =>
            api
              .get(`/cast/${evaluation.contentid}`)
              .then(({ data }) => ({ evaluation, question: data?.evaluation }))
              .catch((itemError) => ({ evaluation, itemError }))
          )
        ),
      ]);
      userIdRef.current = userId;
      const loaded = results.filter((r) => isValidQuestion(r.question));
      if (loaded.length === 0 && results.some((r) => r.itemError)) {
        throw results.find((r) => r.itemError).itemError;
      }
      if (mountedRef.current) {
        answersRef.current = [];
        lockedRef.current = false;
        setItems(loaded);
        setIndex(0);
        setSelected(null);
        setAnswers([]);
        setCombo(0);
        setXp(0);
      }
    } catch (fetchError) {
      console.error('Error fetching questions:', fetchError);
      if (mountedRef.current) setError(fetchError);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [evaluations]);

  useEffect(() => {
    fetchQuestions();
    // Questions are fetched once per visit; `evaluations` comes from route params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToTrack = () => navigation.popTo('BottomNav', { screen: 'Track' });

  const current = items[index];
  const lastAnswer = answers[answers.length - 1];
  const answeredCurrent = selected !== null;

  const handleAnswer = (response) => {
    if (!current || lockedRef.current) return;
    lockedRef.current = true;

    const correct = response === current.question.correct;
    const nextCombo = correct ? combo + 1 : 0;
    const earned = xpForAnswer(correct, nextCombo);
    answersRef.current = [
      ...answersRef.current,
      { contentId: current.evaluation.contentid, response, correct, xp: earned },
    ];

    setAnswers(answersRef.current);
    setSelected(response);
    setCombo(nextCombo);
    setXp((total) => total + earned);
    setPraise(praiseFor(correct, nextCombo));
    setXpPop({ amount: earned, trigger: Date.now() });

    if (correct) {
      if (isComboMilestone(nextCombo)) {
        haptics.celebrate();
        setConfetti(Date.now());
        setComboToast({ combo: nextCombo, key: Date.now() });
      } else {
        haptics.success();
      }
    } else {
      haptics.error();
    }
  };

  const handleNext = () => {
    if (!lockedRef.current || handedOffRef.current) return;
    if (index < items.length - 1) {
      haptics.tap();
      lockedRef.current = false;
      setSelected(null);
      setIndex((value) => value + 1);
      return;
    }
    // Finish grades and saves the quiz.
    handedOffRef.current = true;
    navigation.navigate('Finish', { answers: answersRef.current, total: items.length });
  };

  const handleClose = () => {
    if (answersRef.current.length === 0) {
      goToTrack();
    } else {
      setConfirmLeave(true);
    }
  };

  const optionState = (response) => {
    if (!answeredCurrent) return 'idle';
    if (response === selected) return lastAnswer?.correct ? 'correct' : 'wrong';
    if (!lastAnswer?.correct && response === current.question.correct) return 'reveal';
    return 'dimmed';
  };

  if (isLoading) {
    return <Loader backgroundColor={colors.background} />;
  }

  if (error) {
    return (
      <View style={[styles.stateContainer, { paddingTop: insets.top }]}>
        <ErrorState
          error={error}
          onRetry={fetchQuestions}
          fallbackMessage="We couldn't load your questions."
          secondaryActionLabel="Back to Track"
          onSecondaryAction={goToTrack}
        />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.stateContainer, { paddingTop: insets.top }]}>
        <StateMessage
          icon="help-circle-outline"
          title="No questions available"
          message="Come back later after watching more content."
          actionLabel="Back to Track"
          onAction={goToTrack}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.s }]}>
      <QuizTopBar
        total={items.length}
        results={answers.map((answer) => answer.correct)}
        current={index}
        xp={xp}
        combo={combo}
        onClose={handleClose}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.l + (answeredCurrent ? 0 : insets.bottom) },
        ]}
      >
        <Animated.View key={`question-${index}`} entering={FadeInRight.springify().damping(18)} style={styles.questionCard}>
          <View style={styles.source}>
            <MaterialCommunityIcons name="play-circle" size={16} color={colors.accent} />
            <Text style={styles.sourceText}>From a cast you watched</Text>
          </View>
          <Text style={styles.questionText} accessibilityRole="header">
            {current.question.question}
          </Text>
        </Animated.View>

        <View key={`answers-${index}`}>
          {current.question.responses.map((response, responseIndex) => (
            <AnswerOption
              key={`${index}-${responseIndex}`}
              index={responseIndex}
              text={response}
              state={optionState(response)}
              disabled={answeredCurrent}
              onPress={() => handleAnswer(response)}
            />
          ))}
        </View>
      </ScrollView>

      {answeredCurrent && lastAnswer && (
        <FeedbackPanel
          key={`feedback-${index}`}
          correct={lastAnswer.correct}
          praise={praise}
          xp={lastAnswer.xp}
          isLast={index === items.length - 1}
          onNext={handleNext}
          bottomInset={insets.bottom}
        />
      )}

      <View pointerEvents="none" style={styles.floatingLayer}>
        <FloatingXp amount={xpPop.amount} trigger={xpPop.trigger} style={styles.floatingXp} />
      </View>
      {comboToast && <ComboToast key={comboToast.key} combo={comboToast.combo} />}
      <ConfettiBurst trigger={confetti} count={32} origin={{ x: 0.5, y: 0.35 }} power={0.8} />

      <ConfirmDialog
        visible={confirmLeave}
        title="Leave the quiz?"
        message="Don't worry: the answers you've given so far still earn XP."
        confirmLabel="Leave"
        cancelLabel="Keep playing"
        onConfirm={() => {
          setConfirmLeave(false);
          goToTrack();
        }}
        onDismiss={() => setConfirmLeave(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stateContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s,
  },
  questionCard: {
    padding: spacing.m,
    marginBottom: spacing.l,
    borderRadius: sizes.radius + 4,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.s,
  },
  sourceText: {
    ...typography.caption,
    fontFamily: fonts.bold,
    color: colors.accent,
  },
  questionText: {
    ...typography.h2,
  },
  floatingLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  floatingXp: {
    top: '42%',
  },
  toastLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: sizes.radius + 4,
    backgroundColor: colors.surface,
    shadowColor: colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  toastTitle: {
    ...typography.h1,
    color: rewardColors.streak,
  },
  toastText: {
    ...typography.caption,
  },
});

export default TakeTest;
